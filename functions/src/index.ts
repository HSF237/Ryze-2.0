import { createHmac, timingSafeEqual } from "node:crypto";
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import Razorpay from "razorpay";

initializeApp();
const db = getFirestore();
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");
const razorpayWebhookSecret = defineSecret("RAZORPAY_WEBHOOK_SECRET");

type CartLine = { productId: string; quantity: number };

export const createPaymentOrder = onCall(
  { region: "asia-south1", secrets: [razorpayKeyId, razorpayKeySecret], enforceAppCheck: true },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Sign in before checkout.");
    const lines = request.data?.lines as CartLine[];
    if (!Array.isArray(lines) || !lines.length || lines.length > 50)
      throw new HttpsError("invalid-argument", "Your bag is invalid.");

    // Prices are always loaded from trusted Firestore product records.
    let amount = 0;
    for (const line of lines) {
      if (!line?.productId || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 20)
        throw new HttpsError("invalid-argument", "A bag quantity is invalid.");
      const product = await db.collection("products").doc(line.productId).get();
      const data = product.data();
      if (!product.exists || !data?.active || data.stock < line.quantity)
        throw new HttpsError("failed-precondition", "An item is no longer available.");
      amount += Number(data.price) * line.quantity;
    }

    const receipt = `ryze_${request.auth.uid.slice(0, 10)}_${Date.now()}`;
    const razorpay = new Razorpay({ key_id: razorpayKeyId.value(), key_secret: razorpayKeySecret.value() });
    const order = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt });
    await db.collection("paymentIntents").doc(order.id).create({
      uid: request.auth.uid,
      amount,
      currency: "INR",
      receipt,
      status: "created",
      lines,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: razorpayKeyId.value() };
  },
);

export const razorpayWebhook = onRequest(
  { region: "asia-south1", secrets: [razorpayWebhookSecret] },
  async (request, response) => {
    if (request.method !== "POST") { response.status(405).send("Method not allowed"); return; }
    const signature = request.header("x-razorpay-signature") || "";
    const expected = createHmac("sha256", razorpayWebhookSecret.value()).update(request.rawBody).digest("hex");
    const valid = signature.length === expected.length && timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) { response.status(401).send("Invalid signature"); return; }

    const event = request.body;
    const eventId = request.header("x-razorpay-event-id") || createHmac("sha256", razorpayWebhookSecret.value()).update(request.rawBody).digest("hex");
    const eventRef = db.collection("paymentEvents").doc(eventId);
    try {
      await eventRef.create({ type: event.event, receivedAt: FieldValue.serverTimestamp() });
    } catch (error: any) {
      if (error?.code === 6 || error?.code === "already-exists") { response.status(200).send("Already processed"); return; }
      throw error;
    }

    if (event.event === "payment.captured") {
      const payment = event.payload?.payment?.entity;
      const intentRef = db.collection("paymentIntents").doc(payment.order_id);
      await db.runTransaction(async (transaction) => {
        const intent = await transaction.get(intentRef);
        if (!intent.exists || intent.data()?.status === "captured") return;
        if (Number(payment.amount) !== Number(intent.data()?.amount) * 100 || payment.currency !== "INR")
          throw new Error("Payment amount mismatch");
        transaction.update(intentRef, { status: "captured", paymentId: payment.id, capturedAt: FieldValue.serverTimestamp() });
        transaction.create(db.collection("orders").doc(payment.order_id), {
          uid: intent.data()!.uid,
          lines: intent.data()!.lines,
          total: intent.data()!.amount,
          currency: "INR",
          paymentId: payment.id,
          status: "confirmed",
          createdAt: FieldValue.serverTimestamp(),
        });
      });
    }
    response.status(200).send("OK");
  },
);
