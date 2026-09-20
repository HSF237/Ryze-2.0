import http from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { loadConfig } from "./config.js";
import { createDatabase } from "./db.js";
import { clearCookie, hashPassword, httpError, normalizeEmail, opaqueToken, parseCookies, RateLimiter, sessionCookie, tokenHash, validatePassword, verifyPassword } from "./security.js";
import { integer, pathMatch, readJson, send, text } from "./http.js";

const config = loadConfig();
const db = createDatabase(config.databaseUrl);
const authLimiter = new RateLimiter(10, 15 * 60_000);
const writeLimiter = new RateLimiter(120, 60_000);
const startedAt = Date.now();

const routes = [];
const route = (method, pattern, handler, options = {}) => routes.push({ method, pattern, handler, ...options });
const publicUser = (row) => ({ id: row.id, email: row.email, name: row.full_name, phone: row.phone, role: row.role, emailVerified: Boolean(row.email_verified_at) });
const ipOf = (req) => config.trustProxy ? String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress : req.socket.remoteAddress;
const ipHash = (req) => createHash("sha256").update(`${ipOf(req)}.${config.tokenPepper}`).digest("hex");

async function currentUser(req) {
  const raw = parseCookies(req.headers.cookie)[config.sessionCookie];
  if (!raw) return null;
  const result = await db.query(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now() AND u.disabled_at IS NULL`, [tokenHash(raw, config.tokenPepper)]);
  if (!result.rowCount) return null;
  return result.rows[0];
}

async function requireUser(req) { const user = await currentUser(req); if (!user) throw httpError(401, "Sign in to continue.", "UNAUTHORIZED"); return user; }
async function requireAdmin(req) { const user = await requireUser(req); if (user.role !== "admin") throw httpError(403, "Administrator access is required.", "FORBIDDEN"); return user; }

async function createSession(req, userId) {
  const token = opaqueToken();
  await db.query(`INSERT INTO sessions(user_id,token_hash,ip_hash,user_agent,expires_at) VALUES($1,$2,$3,$4,now()+($5::text||' milliseconds')::interval)`, [userId, tokenHash(token, config.tokenPepper), ipHash(req), String(req.headers["user-agent"] || "").slice(0, 500), config.sessionTtlMs]);
  return token;
}

function corsHeaders(req) {
  const origin = String(req.headers.origin || "");
  if (!origin) return {};
  if (!config.frontendOrigins.includes(origin)) throw httpError(403, "Origin is not allowed.", "ORIGIN_DENIED");
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", Vary: "Origin" };
}

function safeProduct(row) {
  return { id: row.id, slug: row.slug, name: row.name, category: row.category, description: row.description, image: row.image_url, tag: row.tag, price: Math.round(row.price_paise / 100), pricePaise: row.price_paise, stock: row.stock, colors: row.colors, specs: row.specs };
}

async function cartState(userId, client = db) {
  const result = await client.query(`SELECT c.product_id AS id,c.quantity AS qty,c.color,p.name,p.price_paise,p.stock,p.image_url FROM cart_items c JOIN products p ON p.id=c.product_id WHERE c.user_id=$1 AND p.status='active' ORDER BY c.updated_at DESC`, [userId]);
  const subtotalPaise = result.rows.reduce((sum, item) => sum + item.price_paise * item.qty, 0);
  return { items: result.rows, subtotalPaise };
}

route("GET", "/health", async () => ({ status: 200, data: { ok: true, service: "ryze-api", uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) } }));
route("GET", "/ready", async () => { await db.query("SELECT 1"); return { status: 200, data: { ready: true } }; });

route("POST", "/v1/auth/register", async ({ req, body }) => {
  if (!authLimiter.consume(`register:${ipOf(req)}`)) throw httpError(429, "Too many attempts. Try again later.", "RATE_LIMITED");
  const email = normalizeEmail(body.email), password = validatePassword(body.password), name = text(body.name, 2, 80, "Name");
  const passwordHash = await hashPassword(password);
  let user;
  try { user = (await db.query(`INSERT INTO users(email,password_hash,full_name) VALUES($1,$2,$3) RETURNING *`, [email,passwordHash,name])).rows[0]; }
  catch (error) { if (error.code === "23505") throw httpError(409, "An account already exists for this email.", "EMAIL_EXISTS"); throw error; }
  const verificationToken = opaqueToken();
  await db.query(`INSERT INTO account_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'verify_email',$2,now()+interval '24 hours')`, [user.id,tokenHash(verificationToken,config.tokenPepper)]);
  const session = await createSession(req, user.id);
  return { status: 201, data: { user: publicUser(user), verificationRequired: true, ...(config.nodeEnv === "development" ? { developmentVerificationToken: verificationToken } : {}) }, cookie: session };
});

route("POST", "/v1/auth/login", async ({ req, body }) => {
  if (!authLimiter.consume(`login:${ipOf(req)}`)) throw httpError(429, "Too many attempts. Try again later.", "RATE_LIMITED");
  const email = normalizeEmail(body.email), password = String(body.password || "");
  const result = await db.query(`SELECT * FROM users WHERE email=$1 AND disabled_at IS NULL`, [email]);
  const user = result.rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) throw httpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  const session = await createSession(req, user.id);
  await db.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id) VALUES($1,'auth.login','user',$1)`, [user.id]);
  return { status: 200, data: { user: publicUser(user) }, cookie: session };
});

route("POST", "/v1/auth/logout", async ({ req }) => {
  const raw = parseCookies(req.headers.cookie)[config.sessionCookie];
  if (raw) await db.query(`UPDATE sessions SET revoked_at=now() WHERE token_hash=$1`, [tokenHash(raw, config.tokenPepper)]);
  return { status: 200, data: { ok: true }, clearCookie: true };
});

route("GET", "/v1/auth/me", async ({ req }) => ({ status: 200, data: { user: publicUser(await requireUser(req)) } }));

route("POST", "/v1/auth/verify-email", async ({ body }) => {
  const hash = tokenHash(text(body.token, 20, 200, "Token"), config.tokenPepper);
  const result = await db.query(`UPDATE users u SET email_verified_at=COALESCE(email_verified_at,now()) FROM account_tokens t WHERE t.user_id=u.id AND t.token_hash=$1 AND t.purpose='verify_email' AND t.consumed_at IS NULL AND t.expires_at>now() RETURNING u.id`, [hash]);
  if (!result.rowCount) throw httpError(400, "Verification link is invalid or expired.", "TOKEN_INVALID");
  await db.query(`UPDATE account_tokens SET consumed_at=now() WHERE token_hash=$1`, [hash]);
  return { status: 200, data: { verified: true } };
});

route("POST", "/v1/auth/forgot-password", async ({ req, body }) => {
  if (!authLimiter.consume(`reset:${ipOf(req)}`)) throw httpError(429, "Too many attempts. Try again later.", "RATE_LIMITED");
  const email = normalizeEmail(body.email); const result = await db.query(`SELECT id FROM users WHERE email=$1`, [email]);
  let developmentResetToken;
  if (result.rowCount) { const token = opaqueToken(); await db.query(`INSERT INTO account_tokens(user_id,purpose,token_hash,expires_at) VALUES($1,'reset_password',$2,now()+interval '30 minutes')`, [result.rows[0].id,tokenHash(token,config.tokenPepper)]); if (config.nodeEnv === "development") developmentResetToken = token; }
  return { status: 202, data: { message: "If the account exists, reset instructions will be sent.", ...(developmentResetToken ? { developmentResetToken } : {}) } };
});

route("POST", "/v1/auth/reset-password", async ({ body }) => {
  const hash = tokenHash(text(body.token, 20, 200, "Token"), config.tokenPepper), passwordHash = await hashPassword(validatePassword(body.password));
  await db.tx(async (client) => {
    const result = await client.query(`SELECT * FROM account_tokens WHERE token_hash=$1 AND purpose='reset_password' AND consumed_at IS NULL AND expires_at>now() FOR UPDATE`, [hash]);
    if (!result.rowCount) throw httpError(400, "Reset link is invalid or expired.", "TOKEN_INVALID");
    await client.query(`UPDATE users SET password_hash=$1 WHERE id=$2`, [passwordHash,result.rows[0].user_id]);
    await client.query(`UPDATE sessions SET revoked_at=now() WHERE user_id=$1`, [result.rows[0].user_id]);
    await client.query(`UPDATE account_tokens SET consumed_at=now() WHERE id=$1`, [result.rows[0].id]);
  });
  return { status: 200, data: { reset: true } };
});

route("GET", "/v1/products", async ({ url }) => {
  const values = [], clauses = ["status='active'"];
  if (url.searchParams.get("category")) { values.push(url.searchParams.get("category")); clauses.push(`category=$${values.length}`); }
  if (url.searchParams.get("q")) { values.push(`%${url.searchParams.get("q").slice(0,100)}%`); clauses.push(`(name ILIKE $${values.length} OR description ILIKE $${values.length})`); }
  const result = await db.query(`SELECT * FROM products WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC LIMIT 100`, values);
  return { status: 200, data: { products: result.rows.map(safeProduct) }, cache: "public, max-age=60, stale-while-revalidate=300" };
});
route("GET", "/v1/products/:id", async ({ params }) => { const result = await db.query(`SELECT * FROM products WHERE (id=$1 OR slug=$1) AND status='active'`, [params.id]); if (!result.rowCount) throw httpError(404,"Product not found.","NOT_FOUND"); return { status: 200, data: { product: safeProduct(result.rows[0]) }, cache: "public, max-age=60" }; });

route("GET", "/v1/cart", async ({ req }) => ({ status: 200, data: await cartState((await requireUser(req)).id) }));
route("PUT", "/v1/cart/:productId", async ({ req, params, body }) => {
  const user = await requireUser(req), qty = integer(body.quantity, 0, 20, "Quantity");
  const product = (await db.query(`SELECT id,stock,colors FROM products WHERE id=$1 AND status='active'`, [params.productId])).rows[0];
  if (!product) throw httpError(404,"Product not found.","NOT_FOUND"); if (qty > product.stock) throw httpError(409,"Requested quantity is unavailable.","OUT_OF_STOCK");
  if (!qty) await db.query(`DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2`, [user.id,product.id]);
  else await db.query(`INSERT INTO cart_items(user_id,product_id,quantity,color) VALUES($1,$2,$3,$4) ON CONFLICT(user_id,product_id) DO UPDATE SET quantity=excluded.quantity,color=excluded.color,updated_at=now()`, [user.id,product.id,qty,String(body.color || product.colors?.[0] || "").slice(0,60)]);
  return { status: 200, data: await cartState(user.id) };
});

route("GET", "/v1/wishlist", async ({ req }) => { const user=await requireUser(req); const result=await db.query(`SELECT p.* FROM wishlist_items w JOIN products p ON p.id=w.product_id WHERE w.user_id=$1 ORDER BY w.created_at DESC`,[user.id]); return {status:200,data:{products:result.rows.map(safeProduct)}}; });
route("PUT", "/v1/wishlist/:productId", async ({ req, params, body }) => { const user=await requireUser(req); if(body.saved===false) await db.query(`DELETE FROM wishlist_items WHERE user_id=$1 AND product_id=$2`,[user.id,params.productId]); else await db.query(`INSERT INTO wishlist_items(user_id,product_id) SELECT $1,id FROM products WHERE id=$2 AND status='active' ON CONFLICT DO NOTHING`,[user.id,params.productId]); return {status:200,data:{saved:body.saved!==false}}; });

route("GET", "/v1/addresses", async ({ req }) => { const user=await requireUser(req); const result=await db.query(`SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at DESC`,[user.id]); return {status:200,data:{addresses:result.rows}}; });
route("POST", "/v1/addresses", async ({ req, body }) => { const user=await requireUser(req); const count=await db.query(`SELECT count(*)::int AS count FROM addresses WHERE user_id=$1`,[user.id]); if(count.rows[0].count>=8) throw httpError(409,"You can save up to eight addresses.","LIMIT_REACHED"); const values=addressValues(body); const result=await db.query(`INSERT INTO addresses(user_id,label,recipient_name,phone,line1,line2,city,state,postal_code,is_default) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,[user.id,...values]); return {status:201,data:{address:result.rows[0]}}; });
route("DELETE", "/v1/addresses/:id", async ({ req, params }) => { const user=await requireUser(req); await db.query(`DELETE FROM addresses WHERE id=$1 AND user_id=$2`,[params.id,user.id]); return {status:200,data:{deleted:true}}; });

route("POST", "/v1/checkout/quote", async ({ req, body }) => { const user=await requireUser(req); return {status:200,data:await quote(user.id,String(body.coupon || ""))}; });
route("POST", "/v1/orders", async ({ req, body }) => {
  const user=await requireUser(req); if(!user.email_verified_at) throw httpError(403,"Verify your email before placing an order.","EMAIL_NOT_VERIFIED");
  const addressId=text(body.addressId,10,100,"Address"), key=text(req.headers["idempotency-key"],10,100,"Idempotency key"), payment=String(body.paymentMethod || "");
  if(!["mock_upi","mock_card","mock_wallet","cod"].includes(payment)) throw httpError(400,"Choose an available payment method.");
  const order=await db.tx(async(client)=>{
    const previous=await client.query(`SELECT * FROM orders WHERE user_id=$1 AND idempotency_key=$2`,[user.id,key]); if(previous.rowCount) return previous.rows[0];
    const address=(await client.query(`SELECT * FROM addresses WHERE id=$1 AND user_id=$2`,[addressId,user.id])).rows[0]; if(!address) throw httpError(404,"Address not found.","NOT_FOUND");
    const cart=await cartState(user.id,client); if(!cart.items.length) throw httpError(400,"Your cart is empty.","EMPTY_CART");
    for(const item of cart.items){ const locked=(await client.query(`SELECT stock FROM products WHERE id=$1 FOR UPDATE`,[item.id])).rows[0]; if(!locked||locked.stock<item.qty) throw httpError(409,`${item.name} is no longer available in that quantity.`,"OUT_OF_STOCK"); }
    const pricing=await calculateQuote(client,user.id,cart,String(body.coupon || ""));
    const number=`RYZ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    const created=(await client.query(`INSERT INTO orders(order_number,user_id,payment_method,payment_status,subtotal_paise,discount_paise,shipping_paise,total_paise,coupon_code,address_snapshot,delivery_speed,delivery_slot,delivery_instructions,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,[number,user.id,payment,payment==="cod"?"pending":"mock",pricing.subtotalPaise,pricing.discountPaise,pricing.shippingPaise,pricing.totalPaise,pricing.couponCode||null,address,String(body.deliverySpeed||"standard").slice(0,20),String(body.deliverySlot||"").slice(0,60),String(body.deliveryInstructions||"").slice(0,240),key])).rows[0];
    for(const item of cart.items){ await client.query(`INSERT INTO order_items(order_id,product_id,product_name,image_url,unit_price_paise,quantity,color) VALUES($1,$2,$3,$4,$5,$6,$7)`,[created.id,item.id,item.name,item.image_url,item.price_paise,item.qty,item.color]); await client.query(`UPDATE products SET stock=stock-$1 WHERE id=$2`,[item.qty,item.id]); }
    await client.query(`INSERT INTO order_events(order_id,status,message,actor_user_id) VALUES($1,'placed','Order placed',$2)`,[created.id,user.id]); await client.query(`DELETE FROM cart_items WHERE user_id=$1`,[user.id]); return created;
  });
  return {status:201,data:{order}};
});

route("GET", "/v1/orders", async ({ req }) => { const user=await requireUser(req); const result=await db.query(`SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[user.id]); return {status:200,data:{orders:result.rows}}; });
route("GET", "/v1/orders/:id", async ({ req, params }) => { const user=await requireUser(req); const result=await db.query(`SELECT * FROM orders WHERE (id::text=$1 OR order_number=$1) AND user_id=$2`,[params.id,user.id]); if(!result.rowCount) throw httpError(404,"Order not found.","NOT_FOUND"); const items=await db.query(`SELECT * FROM order_items WHERE order_id=$1`,[result.rows[0].id]); const events=await db.query(`SELECT status,message,created_at FROM order_events WHERE order_id=$1 ORDER BY created_at`,[result.rows[0].id]); return {status:200,data:{order:{...result.rows[0],items:items.rows,timeline:events.rows}}}; });
route("POST", "/v1/orders/:id/cancel", async ({ req, params }) => { const user=await requireUser(req); const result=await db.tx(async(client)=>{ const order=(await client.query(`SELECT * FROM orders WHERE id::text=$1 AND user_id=$2 FOR UPDATE`,[params.id,user.id])).rows[0]; if(!order) throw httpError(404,"Order not found.","NOT_FOUND"); if(!["placed","confirmed"].includes(order.status)) throw httpError(409,"This order can no longer be cancelled.","INVALID_STATUS"); await client.query(`UPDATE orders SET status='cancelled' WHERE id=$1`,[order.id]); await client.query(`UPDATE products p SET stock=p.stock+i.quantity FROM order_items i WHERE i.order_id=$1 AND p.id=i.product_id`,[order.id]); await client.query(`INSERT INTO order_events(order_id,status,message,actor_user_id) VALUES($1,'cancelled','Order cancelled by customer',$2)`,[order.id,user.id]); return {...order,status:"cancelled"}; }); return {status:200,data:{order:result}}; });

route("GET", "/v1/admin/orders", async ({ req }) => { await requireAdmin(req); const result=await db.query(`SELECT o.*,u.email,u.full_name FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 250`); return {status:200,data:{orders:result.rows}}; });
route("PATCH", "/v1/admin/orders/:id/status", async ({ req, params, body }) => { const admin=await requireAdmin(req), status=String(body.status||""); if(!["confirmed","packed","shipped","out_for_delivery","delivered","cancelled","returned"].includes(status)) throw httpError(400,"Unsupported order status."); const result=await db.query(`UPDATE orders SET status=$1 WHERE id::text=$2 RETURNING *`,[status,params.id]); if(!result.rowCount) throw httpError(404,"Order not found.","NOT_FOUND"); await db.query(`INSERT INTO order_events(order_id,status,message,actor_user_id) VALUES($1,$2,$3,$4)`,[result.rows[0].id,status,text(body.message||status,2,200,"Message"),admin.id]); return {status:200,data:{order:result.rows[0]}}; });
route("POST", "/v1/admin/products", async ({ req, body }) => { const admin=await requireAdmin(req); const id=text(body.id,2,60,"Product ID"), name=text(body.name,3,100,"Name"), price=integer(body.pricePaise,0,100000000,"Price"), stock=integer(body.stock,0,100000,"Stock"); const result=await db.query(`INSERT INTO products(id,slug,name,category,description,image_url,tag,price_paise,stock,colors,specs,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,[id,text(body.slug,2,100,"Slug"),name,text(body.category,2,60,"Category"),String(body.description||"").slice(0,3000),text(body.image,2,500,"Image"),String(body.tag||"").slice(0,80),price,stock,Array.isArray(body.colors)?body.colors.slice(0,20):[],body.specs&&typeof body.specs==="object"?body.specs:{},body.status==="draft"?"draft":"active"]); await db.query(`INSERT INTO audit_logs(actor_user_id,action,entity_type,entity_id) VALUES($1,'product.create','product',$2)`,[admin.id,id]); return {status:201,data:{product:safeProduct(result.rows[0])}}; });

function addressValues(body){ const pin=String(body.postalCode||"").trim(); if(!/^\d{6}$/.test(pin)) throw httpError(400,"Enter a valid six-digit PIN code."); return [text(body.label||"Home",2,30,"Label"),text(body.recipientName,2,80,"Recipient name"),text(body.phone,7,20,"Phone"),text(body.line1,3,250,"Address"),String(body.line2||"").slice(0,250),text(body.city,2,80,"City"),text(body.state,2,80,"State"),pin,Boolean(body.isDefault)]; }
async function quote(userId,coupon){ const cart=await cartState(userId); return calculateQuote(db,userId,cart,coupon); }
async function calculateQuote(client,userId,cart,couponInput){ const couponCode=String(couponInput||"").trim().toUpperCase(); let discountPaise=0; if(couponCode){ const c=(await client.query(`SELECT * FROM coupons WHERE code=$1 AND enabled=true AND (starts_at IS NULL OR starts_at<=now()) AND (expires_at IS NULL OR expires_at>now())`,[couponCode])).rows[0]; if(!c||cart.subtotalPaise<c.minimum_paise) throw httpError(400,"Coupon is invalid or its conditions are not met.","INVALID_COUPON"); discountPaise=c.kind==="percent"?Math.round(cart.subtotalPaise*c.value/100):c.value; if(c.maximum_discount_paise) discountPaise=Math.min(discountPaise,c.maximum_discount_paise); discountPaise=Math.min(discountPaise,cart.subtotalPaise); } const shippingPaise=cart.subtotalPaise-discountPaise>=299900||!cart.items.length?0:9900; return {items:cart.items,subtotalPaise:cart.subtotalPaise,discountPaise,shippingPaise,totalPaise:cart.subtotalPaise-discountPaise+shippingPaise,couponCode}; }

const server = http.createServer(async (req, res) => {
  const requestId = randomUUID(), begin = Date.now();
  try {
    const securityHeaders = { "X-Content-Type-Options":"nosniff", "X-Frame-Options":"DENY", "Referrer-Policy":"strict-origin-when-cross-origin", "Permissions-Policy":"camera=(), microphone=(), geolocation=(self)", "Content-Security-Policy":"default-src 'none'; frame-ancestors 'none'", "X-Request-Id":requestId, ...corsHeaders(req) };
    if(req.method==="OPTIONS"){ res.writeHead(204,{...securityHeaders,"Access-Control-Allow-Methods":"GET,POST,PUT,PATCH,DELETE,OPTIONS","Access-Control-Allow-Headers":"Content-Type,Idempotency-Key","Access-Control-Max-Age":"86400"}); return res.end(); }
    if(!["GET","HEAD","OPTIONS"].includes(req.method) && !writeLimiter.consume(`write:${ipOf(req)}`)) throw httpError(429,"Too many requests. Try again shortly.","RATE_LIMITED");
    const url=new URL(req.url,"http://localhost"), found=routes.map((item)=>({...item,params:pathMatch(item.pattern,url.pathname)})).find((item)=>item.method===req.method&&item.params);
    if(!found) throw httpError(404,"Route not found.","NOT_FOUND");
    const body=["POST","PUT","PATCH"].includes(req.method)?await readJson(req):{};
    const result=await found.handler({req,res,url,params:found.params,body});
    const headers={...securityHeaders}; if(result.cookie) headers["Set-Cookie"]=sessionCookie(config.sessionCookie,result.cookie,Math.floor(config.sessionTtlMs/1000),config.nodeEnv==="production"); if(result.clearCookie) headers["Set-Cookie"]=clearCookie(config.sessionCookie,config.nodeEnv==="production"); if(result.cache) headers["Cache-Control"]=result.cache;
    send(res,result.status||200,result.data,headers);
    console.log(JSON.stringify({level:"info",requestId,method:req.method,path:url.pathname,status:result.status||200,durationMs:Date.now()-begin}));
  } catch(error){ const status=Number(error.status)||500; if(status>=500) console.error(JSON.stringify({level:"error",requestId,message:error.message,stack:config.nodeEnv==="development"?error.stack:undefined})); send(res,status,{error:{code:error.code||"INTERNAL_ERROR",message:status>=500?"The server could not complete your request.":error.message},requestId},{"X-Request-Id":requestId,...safeCors(req)}); }
});

function safeCors(req){ try{return corsHeaders(req);}catch{return{};} }
server.requestTimeout=15_000; server.headersTimeout=10_000; server.keepAliveTimeout=5_000; server.maxHeadersCount=100;
server.listen(config.port,"0.0.0.0",()=>console.log(JSON.stringify({level:"info",event:"server_started",port:config.port,environment:config.nodeEnv})));
async function shutdown(signal){ console.log(JSON.stringify({level:"info",event:"shutdown",signal})); server.close(async()=>{await db.close();process.exit(0);}); setTimeout(()=>process.exit(1),10_000).unref(); }
process.on("SIGTERM",()=>shutdown("SIGTERM")); process.on("SIGINT",()=>shutdown("SIGINT"));
