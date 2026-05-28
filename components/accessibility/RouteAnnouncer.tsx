"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/clin": "ARKA-CLIN Clinical Decision Support",
  "/clin-suite": "ARKA-CLIN Suite",
  "/ed": "ARKA-ED Educational Platform",
  "/ins": "ARKA-INS Utilization Management",
  "/rural": "Rural Platform",
  "/rural/cds": "ARKA-RURAL CDS",
  "/rural/tele": "ARKA-TELE Teleradiology",
  "/rural/training": "ARKA-ED Rural Training",
  "/rural/reimbursement": "ARKA-INS Rural Reimbursement",
  "/rural/network": "Hub-and-Spoke Network Manager",
  "/rural/ai": "AI Diagnostics — Rural",
  "/rural/intelligence": "Rural Data Intelligence",
};

export function RouteAnnouncer() {
  const pathname = usePathname();
  const [announcement, setAnnouncement] = useState("");
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;
    const title = PAGE_TITLES[pathname] ?? (pathname.slice(1) || "Home");
    setAnnouncement(`Navigated to ${title}`);
    const t = setTimeout(() => setAnnouncement(""), 1000);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      id="route-announcer"
    >
      {announcement}
    </div>
  );
}
