import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/orders", "/order/", "/checkout", "/studio"],
    },
    sitemap: "https://ryze-future-store.hasanpro112.chatgpt.site/sitemap.xml",
  };
}
