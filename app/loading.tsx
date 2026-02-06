import { ArkaSpinner } from "@/components/ui/ArkaSpinner";

export default function Loading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16">
      <ArkaSpinner size="lg" />
      <span className="text-sm font-medium text-arka-text-dark-muted">Loading…</span>
    </div>
  );
}
