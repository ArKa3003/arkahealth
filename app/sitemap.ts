import type { MetadataRoute } from "next";
import { routes } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arkahealth.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: baseUrl + routes.home, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: baseUrl + routes.clin, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: baseUrl + routes.ed, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: baseUrl + routes.ins, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
  ];
  return staticPages;
}
