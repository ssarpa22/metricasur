import type { MetadataRoute } from "next";

const siteUrl = "https://metricasur.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/login/", "/auth/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
