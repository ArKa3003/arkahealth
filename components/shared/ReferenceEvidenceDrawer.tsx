"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";

import { FDANonDeviceBanner } from "@/components/shared/compliance/FDANonDeviceBanner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { safeFetchJson } from "@/lib/utils/safe-fetch-json";

export interface ReferenceEvidenceDrawerProps {
  cpt?: string;
  bodyPart?: string;
  complaint: string;
  /** Optional trigger label; defaults to "Reference evidence". */
  triggerLabel?: string;
  className?: string;
}

interface ReferenceHit {
  id?: string;
  source: "radiopaedia" | "webmd";
  title: string;
  excerpt: string;
  url: string;
  tags: string[];
  licensing: string;
  fetchedAt?: string;
}

const SKELETON_MS = 500;

function SourceBadge({ source }: { source: ReferenceHit["source"] }) {
  const label = source === "radiopaedia" ? "Radiopaedia" : "WebMD (curated)";
  const tone =
    source === "radiopaedia"
      ? "bg-sky-100 text-sky-900"
      : "bg-emerald-100 text-emerald-900";
  return (
    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", tone)}>{label}</span>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading reference evidence">
      {[0, 1, 2].map((i) => (
        <li key={i} className="animate-pulse rounded-md border border-slate-200 p-3">
          <div className="mb-2 h-4 w-2/3 rounded bg-slate-200" />
          <div className="mb-1 h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
        </li>
      ))}
    </ul>
  );
}

/**
 * Drawer that surfaces cached Radiopaedia / WebMD excerpts via `/api/ins/reference/lookup` only.
 */
export function ReferenceEvidenceDrawer({
  cpt,
  bodyPart,
  complaint,
  triggerLabel = "Reference evidence",
  className,
}: ReferenceEvidenceDrawerProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  const [hits, setHits] = React.useState<ReferenceHit[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const controller = new AbortController();
    const boot = window.setTimeout(() => {
      setLoading(true);
      setLoaded(false);
      setFetchError(null);
      setShowSkeleton(true);
    }, 0);
    const hideSkeletonTimer = window.setTimeout(() => {
      setShowSkeleton(false);
    }, SKELETON_MS);

    const params = new URLSearchParams({ complaint });
    if (cpt?.trim()) {
      params.set("cpt", cpt.trim());
    }
    if (bodyPart?.trim()) {
      params.set("bodyPart", bodyPart.trim());
    }

    void (async () => {
      const result = await safeFetchJson<{ results?: ReferenceHit[] }>(
        `/api/ins/reference/lookup?${params.toString()}`,
        {
          signal: controller.signal,
          cache: "no-store",
        },
      );

      if (controller.signal.aborted) {
        return;
      }

      if (!result.ok) {
        if (result.error === "Request aborted") {
          return;
        }
        const isNetworkOrTimeout =
          result.error === "Request timed out" ||
          result.error === "Network request failed" ||
          result.status === undefined;
        setFetchError(
          isNetworkOrTimeout ? "Reference lookup failed." : "Reference lookup unavailable.",
        );
        setHits([]);
      } else {
        setHits(result.data.results ?? []);
      }

      setLoading(false);
      setLoaded(true);
    })();

    return () => {
      controller.abort();
      window.clearTimeout(boot);
      window.clearTimeout(hideSkeletonTimer);
    };
  }, [open, cpt, bodyPart, complaint]);

  const emptyMessage =
    loaded && !loading && hits.length === 0
      ? "No reference content on file for this combination."
      : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          "text-sm font-medium text-sky-700 underline-offset-2 hover:underline",
          className,
        )}
      >
        {triggerLabel}
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reference evidence</DialogTitle>
          <DialogDescription>
            Licensed excerpts and deep links only — full articles are not republished.
          </DialogDescription>
        </DialogHeader>
        <FDANonDeviceBanner className="text-xs" />
        {showSkeleton || (loading && !loaded) ? <SkeletonList /> : null}
        {!showSkeleton && !loading && hits.length > 0 ? (
          <ul className="space-y-4">
            {hits.map((hit) => (
              <li key={hit.id ?? `${hit.source}-${hit.url}`} className="rounded-md border border-slate-200 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <SourceBadge source={hit.source} />
                  <span className="text-xs text-slate-500">{hit.licensing}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{hit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{hit.excerpt}</p>
                <a
                  href={hit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-sky-700 hover:underline"
                >
                  View on source site
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {emptyMessage ? (
          <p className="text-sm text-slate-600" role="status">
            {emptyMessage}
          </p>
        ) : null}
        {fetchError ? (
          <p className="text-sm text-amber-800" role="alert">
            {fetchError}
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
