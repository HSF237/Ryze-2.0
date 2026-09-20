import { getChatGPTUser } from "@/app/chatgpt-auth";
import { database, readRecords, getRecord, putRecord } from "@/lib/store-db";
import {
  products,
  totals,
  couponOffers,
  voucherOffers,
  couponValid,
  voucherValid,
  type Product,
  type Line,
} from "@/lib/catalog";
export const dynamic = "force-dynamic";
const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
async function catalogue(owner: string) {
  const changes = (await getRecord(owner, "catalog")) || {};
  return products.map((p) => ({ ...p, ...changes[p.id] }));
}
async function state(owner: string) {
  const rows = await readRecords(owner);
  const one = (kind: string, fallback: unknown) =>
    rows.find((r) => r.kind === kind && r.id === "main")?.body ?? fallback;
  return {
    cart: one("cart", []),
    wishlist: one("wishlist", []),
    wishlistCollections: one("wishlistCollections", []),
    compare: one("compare", []),
    recent: one("recent", []),
    alerts: one("alerts", []),
    searches: one("searches", []),
    location: one("location", null),
    vouchers: one("vouchers", []),
    profile: one("profile", {}),
    addresses: one("addresses", []),
    preferences: one("preferences", {}),
    rewardProfile: one("rewardProfile", { redeemed: 0, birthday: "" }),
    notifications: one("notifications", []),
    studioConfig: one("studioConfig", {
      banner: "Fresh finds. Better everyday.",
      campaign: "RYZE10",
    }),
    orders: rows
      .filter((r) => r.kind === "order")
      .map((r) => r.body)
      .sort((a, b) => b.created - a.created),
    tickets: rows
      .filter((r) => r.kind === "ticket")
      .map((r) => r.body)
      .sort((a, b) => b.created - a.created),
    reviews: rows.filter((r) => r.kind === "review").map((r) => r.body),
    questions: rows
      .filter((r) => r.kind === "question")
      .map((r) => r.body)
      .sort((a, b) => b.created - a.created),
    catalog: await catalogue(owner),
  };
}
export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!user) return reply({ user: null, catalog: products });
    return reply({
      user: { name: user.fullName || "", email: user.email },
      ...(await state(user.userId)),
    });
  } catch (e) {
    console.error("Store load failed", e);
    return reply(
      { error: "Your saved store is temporarily unavailable. Please retry." },
      503,
    );
  }
}
export async function POST(req: Request) {
  try {
    const origin = req.headers.get("origin");
    if (origin && origin !== new URL(req.url).origin)
      return reply({ error: "Request origin mismatch" }, 403);
    const user = await getChatGPTUser();
    if (!user)
      return reply(
        { error: "Sign in to save your shopping.", signIn: true },
        401,
      );
    if (Number(req.headers.get("content-length") || 0) > 50000)
      return reply({ error: "Request too large" }, 413);
    const body = await req.text();
    if (body.length > 50000) return reply({ error: "Request too large" }, 413);
    let data: any;
    try {
      data = JSON.parse(body);
    } catch {
      return reply({ error: "Invalid request" }, 400);
    }
    const { action } = data;
    const owner = user.userId;
    const catalog: Product[] = await catalogue(owner);
    const find = (id: string) => catalog.find((p) => p.id === id);
    const invalid = (msg: string) => reply({ error: msg }, 400);
    if (action === "cart") {
      const p = find(data.id);
      if (!p) return invalid("Product not found");
      const qty = Number(data.qty);
      if (!Number.isInteger(qty) || qty < 0 || qty > Math.min(p.stock, 20))
        return invalid("Choose a quantity within available preview stock.");
      const lines: Line[] = (await getRecord(owner, "cart")) || [];
      const next = lines.filter((l) => l.id !== p.id);
      if (qty) next.push({ id: p.id, qty, color: p.colors[0] });
      await putRecord(owner, "cart", "main", next);
    } else if (["wishlist", "compare", "alerts", "recent"].includes(action)) {
      if (!find(data.id)) return invalid("Product not found");
      let ids: string[] = (await getRecord(owner, action)) || [];
      if (action === "recent") {
        ids = [data.id, ...ids.filter((id) => id !== data.id)].slice(0, 8);
      } else if (ids.includes(data.id)) {
        ids = ids.filter((id) => id !== data.id);
      } else {
        if (action === "compare" && ids.length >= 3)
          return invalid("Compare up to three products at a time.");
        ids.push(data.id);
      }
      await putRecord(owner, action, "main", ids);
    } else if (action === "wishlistCollection") {
      const lists: any[] =
        (await getRecord(owner, "wishlistCollections")) || [];
      const op = String(data.op || "");
      if (op === "create") {
        const name = String(data.name || "").trim();
        if (name.length < 2 || name.length > 40)
          return invalid("Name your list using 2–40 characters.");
        if (lists.length >= 8)
          return invalid("You can create up to eight wishlist collections.");
        lists.push({
          id: crypto.randomUUID(),
          name,
          private: data.private !== false,
          items: [],
          created: Date.now(),
        });
      } else {
        const list = lists.find((x) => x.id === data.listId);
        if (!list) return invalid("Wishlist collection not found.");
        if (op === "toggle") {
          if (!find(data.id)) return invalid("Product not found");
          list.items = list.items.includes(data.id)
            ? list.items.filter((id: string) => id !== data.id)
            : [...list.items, data.id].slice(0, 50);
        } else if (op === "privacy") list.private = !!data.private;
        else if (op === "delete") {
          await putRecord(
            owner,
            "wishlistCollections",
            "main",
            lists.filter((x) => x.id !== data.listId),
          );
          return reply(await state(owner));
        } else return invalid("Unknown wishlist action.");
      }
      await putRecord(owner, "wishlistCollections", "main", lists);
    } else if (action === "profile") {
      const name = String(data.name || "").trim();
      if (name.length < 2 || name.length > 80)
        return invalid("Enter a name between 2 and 80 characters.");
      await putRecord(owner, "profile", "main", {
        name,
        phone: String(data.phone || "").slice(0, 20),
      });
    } else if (action === "address") {
      const a = data.address || {};
      if (
        !a.name?.trim() ||
        !a.line?.trim() ||
        !a.city?.trim() ||
        !/^\d{6}$/.test(a.pin || "")
      )
        return invalid(
          "Enter a name, street, city and six-digit Indian PIN code.",
        );
      const addresses = (await getRecord(owner, "addresses")) || [];
      if (addresses.length >= 8 && !a.id)
        return invalid("You can save up to eight addresses.");
      const clean = {
        id: a.id || crypto.randomUUID(),
        name: String(a.name).slice(0, 80),
        line: String(a.line).slice(0, 250),
        city: String(a.city).slice(0, 80),
        pin: a.pin,
        phone: String(a.phone || "").slice(0, 20),
      };
      await putRecord(owner, "addresses", "main", [
        clean,
        ...addresses.filter((x: any) => x.id !== clean.id),
      ]);
    } else if (action === "deleteAddress") {
      const a = (await getRecord(owner, "addresses")) || [];
      await putRecord(
        owner,
        "addresses",
        "main",
        a.filter((x: any) => x.id !== data.id),
      );
    } else if (action === "preferences") {
      await putRecord(owner, "preferences", "main", {
        newsletter: !!data.newsletter,
        alerts: !!data.alerts,
        orderUpdates: data.orderUpdates !== false,
        deals: data.deals !== false,
        favouriteCategories: Array.isArray(data.favouriteCategories)
          ? data.favouriteCategories
              .filter((x: string) =>
                ["Audio", "Workspace", "Living", "Wearables"].includes(x),
              )
              .slice(0, 4)
          : [],
      });
    } else if (action === "rewardProfile") {
      const birthday = String(data.birthday || "");
      if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday))
        return invalid("Choose a valid birthday.");
      const current = (await getRecord(owner, "rewardProfile")) || {
        redeemed: 0,
      };
      await putRecord(owner, "rewardProfile", "main", {
        ...current,
        birthday,
      });
    } else if (action === "notificationsRead") {
      const notes: any[] = (await getRecord(owner, "notifications")) || [];
      await putRecord(
        owner,
        "notifications",
        "main",
        notes.map((n) => ({ ...n, read: true })),
      );
    } else if (action === "search") {
      const query = String(data.query || "")
        .trim()
        .replace(/\s+/g, " ");
      if (query.length < 2 || query.length > 100)
        return invalid("Search for 2–100 characters.");
      const searches: string[] = (await getRecord(owner, "searches")) || [];
      await putRecord(
        owner,
        "searches",
        "main",
        [
          query,
          ...searches.filter((q) => q.toLowerCase() !== query.toLowerCase()),
        ].slice(0, 10),
      );
    } else if (action === "clearSearch") {
      await putRecord(owner, "searches", "main", []);
    } else if (action === "location") {
      const pin = String(data.pin || "").trim(),
        city = String(data.city || "").trim();
      if (!/^\d{6}$/.test(pin) || city.length < 2 || city.length > 80)
        return invalid("Enter a city and a six-digit PIN code.");
      await putRecord(owner, "location", "main", { pin, city });
    } else if (action === "claimVoucher") {
      const code = String(data.code || "")
        .trim()
        .toUpperCase();
      if (!voucherOffers.some((v) => v.code === code))
        return invalid("Unknown preview voucher.");
      const vouchers: {
        code: string;
        claimed: number;
        usedBy: string | null;
      }[] = (await getRecord(owner, "vouchers")) || [];
      if (vouchers.some((v) => v.code === code))
        return invalid("This preview voucher is already in your wallet.");
      await putRecord(owner, "vouchers", "main", [
        ...vouchers,
        { code, claimed: Date.now(), usedBy: null },
      ]);
    } else if (action === "previewOrder") {
      if (typeof data.key !== "string" || !/^[a-z0-9-]{10,80}$/i.test(data.key))
        return invalid("Please reopen checkout and try again.");
      const existing = await getRecord(owner, "order", data.key);
      if (existing) return reply({ order: existing, ...(await state(owner)) });
      const cart: Line[] = (await getRecord(owner, "cart")) || [];
      if (!cart.length) return invalid("Your bag is empty.");
      for (const l of cart) {
        const p = find(l.id);
        if (!p || l.qty > p.stock || l.qty < 1)
          return invalid("A product is no longer available in this quantity.");
      }
      const a = data.address || {};
      if (
        !a.name?.trim() ||
        !a.line?.trim() ||
        !a.city?.trim() ||
        !/^\d{6}$/.test(a.pin || "")
      )
        return invalid("Complete your delivery address first.");
      const coupon = String(data.coupon || "")
        .trim()
        .toUpperCase();
      if (
        coupon &&
        (!couponOffers.some((c) => c.code === coupon) ||
          !couponValid(coupon, cart, catalog))
      )
        return invalid(
          "This code is unavailable for your preview bag. Review its conditions in Offers.",
        );
      const voucher = String(data.voucher || "")
        .trim()
        .toUpperCase();
      const vouchers: {
        code: string;
        claimed: number;
        usedBy: string | null;
      }[] = (await getRecord(owner, "vouchers")) || [];
      if (
        voucher &&
        (!voucherOffers.some((v) => v.code === voucher) ||
          !vouchers.some((v) => v.code === voucher && !v.usedBy) ||
          !voucherValid(voucher, cart, catalog))
      )
        return invalid("Claim an eligible voucher in Offers before using it.");
      const method = String(data.method || "").trim();
      if (
        !["UPI", "Card", "Wallet"].includes(method) ||
        data.simulated !== true
      )
        return invalid(
          "Explore the mock payment step before saving your preview order.",
        );
      const order = {
        id: data.key,
        number: "RYZ-" + data.key.slice(0, 8).toUpperCase(),
        created: Date.now(),
        status: "Preview saved",
        items: cart.map((l) => ({ ...l, product: find(l.id) })),
        address: {
          name: String(a.name).slice(0, 80),
          line: String(a.line).slice(0, 250),
          city: String(a.city).slice(0, 80),
          pin: a.pin,
        },
        coupon,
        voucher,
        mockPayment: { method, simulated: true },
        deliverySpeed: ["Standard", "Express"].includes(data.deliverySpeed)
          ? data.deliverySpeed
          : "Standard",
        deliverySlot: String(data.deliverySlot || "Any time").slice(0, 60),
        deliveryInstruction: String(data.deliveryInstruction || "").slice(
          0,
          240,
        ),
        ...totals(cart, catalog, coupon, voucher),
        paid: false,
      };
      const inserted = await database()
        .prepare(
          "INSERT OR IGNORE INTO store_records(owner,kind,id,body,updated) VALUES(?,?,?,?,?)",
        )
        .bind(owner, "order", data.key, JSON.stringify(order), Date.now())
        .run();
      if (voucher && inserted.meta.changes === 1)
        await putRecord(
          owner,
          "vouchers",
          "main",
          vouchers.map((v) =>
            v.code === voucher ? { ...v, usedBy: data.key } : v,
          ),
        );
      if (inserted.meta.changes === 1) {
        const notes: any[] = (await getRecord(owner, "notifications")) || [];
        await putRecord(
          owner,
          "notifications",
          "main",
          [
            {
              id: crypto.randomUUID(),
              title: "Preview order saved",
              text: order.number + " is ready in your order centre.",
              created: Date.now(),
              read: false,
              href: "/order/" + order.id,
            },
            ...notes,
          ].slice(0, 30),
        );
      }
      return reply({
        order: await getRecord(owner, "order", data.key),
        ...(await state(owner)),
      });
    } else if (action === "orderAction") {
      const order = await getRecord(owner, "order", data.id);
      if (!order) return reply({ error: "Order not found" }, 404);
      const op = String(data.op || "");
      if (op === "instruction") {
        const instruction = String(data.instruction || "").trim();
        if (instruction.length > 240)
          return invalid("Keep delivery instructions under 240 characters.");
        order.deliveryInstruction = instruction;
      } else if (op === "cancelItem") {
        const item = order.items.find((x: any) => x.id === data.productId);
        if (!item) return invalid("Order item not found.");
        item.itemStatus = "Cancelled";
        if (order.items.every((x: any) => x.itemStatus === "Cancelled"))
          order.status = "Cancelled";
        else order.status = "Partially cancelled";
      } else if (op === "request") {
        if (!["Return", "Replacement"].includes(data.requestType))
          return invalid("Choose return or replacement.");
        order.requests = [
          ...(order.requests || []),
          {
            id: crypto.randomUUID(),
            type: data.requestType,
            productId: String(data.productId || ""),
            reason: String(data.reason || "Preview request").slice(0, 200),
            status: "Preview request saved",
            created: Date.now(),
          },
        ];
      } else return invalid("Unknown order action.");
      await putRecord(owner, "order", data.id, order);
    } else if (action === "cancelOrder") {
      const order = await getRecord(owner, "order", data.id);
      if (!order) return reply({ error: "Order not found" }, 404);
      if (order.status !== "Preview saved")
        return invalid("This preview has already been cancelled.");
      order.status = "Cancelled";
      await putRecord(owner, "order", data.id, order);
    } else if (action === "ticket") {
      const message = String(data.message || "").trim();
      if (message.length < 10 || message.length > 3000)
        return invalid("Please enter 10–3000 characters.");
      const id = crypto.randomUUID();
      await putRecord(owner, "ticket", id, {
        id,
        number: "HELP-" + id.slice(0, 6).toUpperCase(),
        subject: String(data.subject || "General help").slice(0, 100),
        message,
        created: Date.now(),
        status: "Saved draft — not sent",
      });
    } else if (action === "question") {
      if (!find(data.id)) return invalid("Product not found.");
      const question = String(data.question || "").trim();
      if (question.length < 8 || question.length > 300)
        return invalid("Write a question using 8–300 characters.");
      const id = crypto.randomUUID();
      await putRecord(owner, "question", id, {
        id,
        productId: data.id,
        question,
        answer:
          "RYZE support will answer after supplier details are connected.",
        status: "Preview question",
        created: Date.now(),
      });
    } else if (action === "reviewVote") {
      const review = await getRecord(owner, "review", data.id);
      if (!review) return invalid("Review not found.");
      review.helpful = Math.max(
        0,
        Number(review.helpful || 0) + (data.helpful ? 1 : -1),
      );
      await putRecord(owner, "review", data.id, review);
    } else if (action === "review") {
      if (
        !find(data.id) ||
        !Number.isInteger(data.rating) ||
        data.rating < 1 ||
        data.rating > 5
      )
        return invalid("Choose a product and rating.");
      const message = String(data.message || "").trim();
      if (message.length < 10 || message.length > 1500)
        return invalid("Write a review between 10 and 1,500 characters.");
      await putRecord(owner, "review", data.id, {
        id: data.id,
        rating: data.rating,
        message,
        created: Date.now(),
        status: "Private preview review",
        helpful: 0,
      });
    } else if (action === "studioConfig") {
      const banner = String(data.banner || "").trim();
      const campaign = String(data.campaign || "")
        .trim()
        .toUpperCase();
      if (banner.length < 4 || banner.length > 100)
        return invalid("Banner text must use 4–100 characters.");
      await putRecord(owner, "studioConfig", "main", {
        banner,
        campaign: campaign.slice(0, 20),
      });
    } else if (action === "catalog") {
      const p = find(data.id);
      if (!p) return invalid("Unknown product");
      const price = Number(data.price),
        stock = Number(data.stock),
        name = String(data.name || "").trim();
      if (
        !Number.isInteger(price) ||
        price < 1 ||
        price > 1000000 ||
        !Number.isInteger(stock) ||
        stock < 0 ||
        stock > 10000 ||
        name.length < 3 ||
        name.length > 100
      )
        return invalid("Check the name, price and stock values.");
      const c = (await getRecord(owner, "catalog")) || {};
      c[p.id] = { name, price, stock };
      await putRecord(owner, "catalog", "main", c);
    } else {
      return invalid("Unknown action");
    }
    return reply(await state(owner));
  } catch (e) {
    console.error("Store save failed", e);
    return reply(
      {
        error:
          "We could not save that change. Your input is still here; please retry.",
      },
      503,
    );
  }
}
