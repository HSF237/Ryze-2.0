import Store from "../store";
import { notFound } from "next/navigation";
export default async function Page({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const { path } = await params;
  const allowed = [
    "shop",
    "search",
    "product",
    "collections",
    "wishlist",
    "compare",
    "cart",
    "checkout",
    "account",
    "orders",
    "order",
    "track",
    "offers",
    "wallet",
    "rewards",
    "deals",
    "assistant",
    "notifications",
    "help",
    "studio",
  ];
  if (!allowed.includes(path[0])) notFound();
  return <Store initialPath={"/" + path.join("/")} />;
}
