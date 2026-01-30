"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Stethoscope, GraduationCap, Shield } from "lucide-react";
import { routes } from "@/lib/constants";
import { cn } from "@/lib/utils";

const DEMO_PATHS = [routes.clin, routes.ed, routes.ins] as const;
const items = [
  { href: routes.clin, label: "CLIN", icon: Stethoscope },
  { href: routes.ed, label: "ED", icon: GraduationCap },
  { href: routes.ins, label: "INS", icon: Shield },
] as const;

export function DemoBottomNav() {
  const pathname = usePathname();
  const isDemoPage = DEMO_PATHS.some((p) => pathname.startsWith(p));
  if (!isDemoPage) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-arka-bg-dark/95 backdrop-blur-xl safe-area-bottom md:hidden"
      aria-label="Switch between ARKA demos"
      style={{
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-2 text-xs font-medium transition touch-manipulation active:bg-white/5",
              isActive
                ? "text-arka-cyan"
                : "text-arka-text-soft hover:text-arka-text"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
