import type { MetadataRoute } from "next";
import { products } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://ryze-future-store.hasanpro112.chatgpt.site";
  return [
    "",
    "/shop",
    "/collections",
    "/offers",
    "/deals",
    ...products.map((product) => "/product/" + product.id),
  ].map((path) => ({ url: base + path, changeFrequency: "weekly" }));
}
