import { getFirebaseUser } from "@/lib/firebase-auth-server";
import { CjError, cjRequest, importedPrice, isCjAdmin } from "@/lib/cj";
import { firebaseAdmin } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const reply = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function admin(req: Request) {
  const user = await getFirebaseUser(req);
  if (!user) throw new CjError("Sign in first.", 401);
  if (!isCjAdmin(user.email)) throw new CjError("Administrator access required.", 403);
  return user;
}

export async function GET(req: Request) {
  try {
    await admin(req);
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "status";
    if (action === "status") {
      const categories = await cjRequest<unknown[]>("/product/getCategory");
      return reply({ connected: true, categoryGroups: categories.length });
    }
    if (action === "products") {
      const keyWord = (url.searchParams.get("q") || "").trim().slice(0, 100);
      if (keyWord.length < 2) return reply({ error: "Search using at least two characters." }, 400);
      const data = await cjRequest<unknown>("/product/listV2", {
        query: { keyWord, page: 1, size: 20, orderBy: 0, countryCode: url.searchParams.get("country") || undefined },
      });
      return reply({ data });
    }
    if (action === "variants") {
      const pid = (url.searchParams.get("pid") || "").trim();
      if (!pid) return reply({ error: "Product ID is required." }, 400);
      return reply({ data: await cjRequest<unknown>("/product/variant/query", { query: { pid } }) });
    }
    if (action === "inventory") {
      const vid = (url.searchParams.get("vid") || "").trim();
      if (!vid) return reply({ error: "Variant ID is required." }, 400);
      return reply({ data: await cjRequest<unknown>("/product/stock/queryByVid", { query: { vid } }) });
    }
    return reply({ error: "Unknown CJ action." }, 400);
  } catch (error) {
    console.error("CJ GET failed", error);
    const e = error instanceof CjError ? error : new CjError("CJ is temporarily unavailable.");
    return reply({ error: e.message, requestId: e.requestId }, e.status);
  }
}

export async function POST(req: Request) {
  try {
    const user = await admin(req);
    if (Number(req.headers.get("content-length") || 0) > 10_000)
      return reply({ error: "Request too large." }, 413);
    const body = (await req.json()) as { action?: string; pid?: string; category?: string };
    if (body.action !== "import") return reply({ error: "Unknown CJ action." }, 400);
    const pid = String(body.pid || "").trim();
    if (!pid || pid.length > 200) return reply({ error: "Valid CJ product ID required." }, 400);

    const product: any = await cjRequest("/product/query", { query: { pid } });
    const variants: any[] = await cjRequest("/product/variant/query", { query: { pid } });
    const priceSource = product.sellPrice || product.nowPrice || variants?.[0]?.variantSellPrice;
    const id = `cj-${pid.toLowerCase()}`;
    const record = {
      id,
      name: String(product.productNameEn || product.nameEn || "CJ Product").slice(0, 120),
      category: String(body.category || "Living").slice(0, 40),
      price: importedPrice(priceSource),
      image: String(product.productImage || product.bigImage || variants?.[0]?.variantImage || ""),
      tag: "CJ IMPORT",
      description: String(product.description || "Imported from CJ Dropshipping.").slice(0, 4000),
      colors: variants.map((v) => v.variantNameEn || v.variantName).filter(Boolean).slice(0, 20),
      specs: { Supplier: "CJ Dropshipping", SKU: String(product.productSku || product.sku || "") },
      stock: Math.max(0, Number(product.totalVerifiedInventory || product.warehouseInventoryNum || 0)),
      supplier: { provider: "cj", pid, variants: variants.slice(0, 100) },
      importedAt: Date.now(),
      importedBy: user.email,
    };
    await firebaseAdmin().db.collection("catalog").doc(id).set(record, { merge: true });
    return reply({ imported: true, product: record }, 201);
  } catch (error) {
    console.error("CJ import failed", error);
    const e = error instanceof CjError ? error : new CjError("CJ import failed.");
    return reply({ error: e.message, requestId: e.requestId }, e.status);
  }
}
