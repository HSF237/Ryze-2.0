export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  tag: string;
  description: string;
  colors: string[];
  specs: Record<string, string>;
  stock: number;
};
export const products: Product[] = [
  {
    id: "aura",
    name: "Aura Studio Headphones",
    category: "Audio",
    price: 3499,
    image: "/images/headphones.webp",
    tag: "THE HEADLINER",
    description:
      "A little less noise. A lot more you. Sculpted over-ear headphones envisioned for your everyday soundtrack.",
    colors: ["Silver / Blue"],
    specs: {
      Connection: "Wireless concept",
      Finish: "Brushed silver",
      Design: "Over-ear",
      Collection: "Aura",
    },
    stock: 20,
  },
  {
    id: "type",
    name: "Type One Keyboard",
    category: "Workspace",
    price: 2799,
    image: "/images/keyboard.webp",
    tag: "DESK ESSENTIAL",
    description:
      "Make room for a better rhythm. A compact keyboard with a considered layout and a splash of cobalt.",
    colors: ["Ice / Cobalt"],
    specs: {
      Layout: "Compact",
      Finish: "Matte",
      Design: "Mechanical concept",
      Collection: "Type",
    },
    stock: 15,
  },
  {
    id: "pulse",
    name: "Pulse Mini Speaker",
    category: "Audio",
    price: 1499,
    image: "/images/speaker.webp",
    tag: "SMALL BUT BOLD",
    description:
      "A sculptural little speaker concept that brings a pop of colour to your space.",
    colors: ["Electric Blue"],
    specs: {
      Connection: "Wireless concept",
      Finish: "Cobalt",
      Design: "Portable",
      Collection: "Pulse",
    },
    stock: 24,
  },
  {
    id: "arc",
    name: "Arc Sculptural Lamp",
    category: "Living",
    price: 2299,
    image: "/images/lamp.webp",
    tag: "SET THE MOOD",
    description:
      "A softer side to your setup. Clean curves, a quiet silhouette, and a warm invitation to slow down.",
    colors: ["Chalk"],
    specs: {
      Category: "Desk lighting",
      Finish: "Matte ivory",
      Design: "Sculptural",
      Collection: "Arc",
    },
    stock: 12,
  },
  {
    id: "orbit",
    name: "Orbit Everyday Watch",
    category: "Wearables",
    price: 3999,
    image: "/images/watch.webp",
    tag: "EVERYDAY UPGRADE",
    description:
      "A future-facing accessory concept with a sculpted silver case and a confident cobalt strap.",
    colors: ["Silver / Cobalt"],
    specs: {
      Display: "Digital concept",
      Strap: "Cobalt",
      Finish: "Silver",
      Collection: "Orbit",
    },
    stock: 18,
  },
];
export const categories = [
  "All finds",
  "Audio",
  "Workspace",
  "Living",
  "Wearables",
];
export const money = (v: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(v);
export type Line = { id: string; qty: number; color: string };
export const couponOffers = [
  {
    code: "RYZE10",
    title: "10% off your preview bag",
    minimum: 0,
    description: "An introductory concept offer on any find.",
  },
  {
    code: "WELCOME15",
    title: "15% off your first look",
    minimum: 2000,
    description: "For preview bags from ₹2,000. Savings capped at ₹500.",
  },
  {
    code: "DESK200",
    title: "₹200 off your desk edit",
    minimum: 2500,
    description:
      "For preview bags from ₹2,500 with a Workspace or Living find.",
  },
];
export const voucherOffers = [
  {
    code: "FIRST250",
    title: "₹250 welcome voucher",
    minimum: 2000,
    description: "Claim for a concept bag from ₹2,000.",
  },
  {
    code: "SETUP400",
    title: "₹400 setup voucher",
    minimum: 4000,
    description:
      "Claim for a concept bag from ₹4,000 containing a Workspace or Living find.",
  },
];
export function couponValid(code: string, lines: Line[], catalog: Product[]) {
  const subtotal = lines.reduce(
    (s, l) => s + (catalog.find((p) => p.id === l.id)?.price ?? 0) * l.qty,
    0,
  );
  const hasDesk = lines.some((l) =>
    ["Workspace", "Living"].includes(
      catalog.find((p) => p.id === l.id)?.category || "",
    ),
  );
  return (
    code === "RYZE10" ||
    (code === "WELCOME15" && subtotal >= 2000) ||
    (code === "DESK200" && subtotal >= 2500 && hasDesk)
  );
}
export function voucherValid(code: string, lines: Line[], catalog: Product[]) {
  const subtotal = lines.reduce(
    (s, l) => s + (catalog.find((p) => p.id === l.id)?.price ?? 0) * l.qty,
    0,
  );
  const hasDesk = lines.some((l) =>
    ["Workspace", "Living"].includes(
      catalog.find((p) => p.id === l.id)?.category || "",
    ),
  );
  return (
    (code === "FIRST250" && subtotal >= 2000) ||
    (code === "SETUP400" && subtotal >= 4000 && hasDesk)
  );
}
export function totals(
  lines: Line[],
  catalog: Product[],
  coupon = "",
  voucher = "",
) {
  const subtotal = lines.reduce(
    (s, l) => s + (catalog.find((p) => p.id === l.id)?.price ?? 0) * l.qty,
    0,
  );
  const couponDiscount = couponValid(coupon.toUpperCase(), lines, catalog)
    ? coupon.toUpperCase() === "RYZE10"
      ? Math.round(subtotal * 0.1)
      : coupon.toUpperCase() === "WELCOME15"
        ? Math.min(500, Math.round(subtotal * 0.15))
        : 200
    : 0;
  const voucherDiscount = voucherValid(voucher.toUpperCase(), lines, catalog)
    ? voucher.toUpperCase() === "FIRST250"
      ? 250
      : 400
    : 0;
  const discount = Math.min(subtotal, couponDiscount + voucherDiscount);
  const shipping = subtotal === 0 || subtotal - discount >= 2999 ? 0 : 99;
  return {
    subtotal,
    couponDiscount,
    voucherDiscount,
    discount,
    shipping,
    total: subtotal - discount + shipping,
  };
}
