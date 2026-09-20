import { createDatabase } from "../src/db.js";
import { hashPassword, normalizeEmail, validatePassword } from "../src/security.js";

const db = createDatabase(process.env.DATABASE_URL);
const products = [
  ["aura","aura-studio-headphones","Aura Studio Headphones","Audio","A little less noise. A lot more you.","/images/headphones.webp","THE HEADLINER",349900,20,["Silver / Blue"],{"Connection":"Wireless concept","Finish":"Brushed silver"}],
  ["type","type-one-keyboard","Type One Keyboard","Workspace","Make room for a better rhythm.","/images/keyboard.webp","DESK ESSENTIAL",279900,15,["Ice / Cobalt"],{"Layout":"Compact","Finish":"Matte"}],
  ["pulse","pulse-mini-speaker","Pulse Mini Speaker","Audio","Small footprint, confident sound.","/images/speaker.webp","SMALL BUT BOLD",149900,24,["Electric Blue"],{"Connection":"Wireless concept","Design":"Portable"}],
  ["arc","arc-sculptural-lamp","Arc Sculptural Lamp","Living","A softer side to your setup.","/images/lamp.webp","SET THE MOOD",229900,12,["Chalk"],{"Category":"Desk lighting","Finish":"Matte ivory"}],
  ["orbit","orbit-everyday-watch","Orbit Everyday Watch","Wearables","A future-facing everyday accessory.","/images/watch.webp","EVERYDAY UPGRADE",399900,18,["Silver / Cobalt"],{"Display":"Digital concept","Finish":"Silver"}],
];
try {
  for (const p of products) await db.query(`INSERT INTO products(id,slug,name,category,description,image_url,tag,price_paise,stock,colors,specs) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(id) DO UPDATE SET slug=excluded.slug,name=excluded.name,category=excluded.category,description=excluded.description,image_url=excluded.image_url,tag=excluded.tag,price_paise=excluded.price_paise,stock=excluded.stock,colors=excluded.colors,specs=excluded.specs`, p);
  await db.query(`INSERT INTO coupons(code,kind,value,minimum_paise,maximum_discount_paise,per_user_limit) VALUES ('RYZE10','percent',10,0,NULL,10),('WELCOME15','percent',15,200000,50000,1),('DESK200','fixed',20000,250000,NULL,5) ON CONFLICT(code) DO NOTHING`);
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = normalizeEmail(process.env.ADMIN_EMAIL);
    const passwordHash = await hashPassword(validatePassword(process.env.ADMIN_PASSWORD));
    await db.query(`INSERT INTO users(email,password_hash,full_name,role,email_verified_at) VALUES($1,$2,'RYZE Owner','admin',now()) ON CONFLICT(email) DO UPDATE SET role='admin'`, [email,passwordHash]);
  }
  console.log("Seed complete");
} finally { await db.close(); }
