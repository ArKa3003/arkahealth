import { cn } from "@/lib/utils";

type LandingEyebrowProps = {
  children: React.ReactNode;
  className?: string;
  /** Use on dark section backgrounds. */
  dark?: boolean;
};

/**
 * Small teal mono-style label preceding landing section headings.
 */
export function LandingEyebrow({ children, className, dark = false }: LandingEyebrowProps) {
  return (
    <p
      className={cn(
        "mb-4 text-center font-mono text-xs font-medium uppercase tracking-[0.14em]",
        dark ? "text-arka-teal-400" : "text-arka-teal-600",
        className,
      )}
    >
      {children}
    </p>
  );
}
