import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard/", "/profile", "/saved", "/notifications", "/admin/", "/api/", "/login", "/register", "/write", "/reset-password", "/verify"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}