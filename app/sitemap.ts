import type { MetadataRoute } from "next";
import { routes } from "@/lib/constants";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arkahealth.com";

/** Static marketing routes included in sitemap and release QA sweeps. */
export const QA_STATIC_ROUTES = [
  routes.home,
  routes.clinSuite,
  routes.clin,
  routes.cdsHooksDemo,
  routes.cdsHooksDiscovery,
  routes.cdsHooksDemoValidation,
  routes.ed,
  routes.ins,
  routes.rural,
  routes.signin,
  routes.security,
  routes.trust,
  routes.evidence,
  routes.roi,
  routes.featureCatalog,
  "/action-plan",
  "/privacy",
  "/terms",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = QA_STATIC_ROUTES.map((route) => ({
    url: baseUrl + route,
    lastModified: new Date(),
    changeFrequency:
      route === routes.home
        ? ("weekly" as const)
        : route === routes.security || route === routes.trust
          ? ("monthly" as const)
          : ("weekly" as const),
    priority:
      route === routes.home
        ? 1
        : route === routes.security || route === routes.trust
          ? 0.8
          : 0.85,
  }));
  return staticPages;
}
