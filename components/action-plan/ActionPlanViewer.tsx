"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
};

export function ActionPlanViewer({ src }: Props) {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  // Native PDF viewer params: open at page 1, fit to width, hide PDF toolbar chrome we don't need.
  // These params are advisory — browsers honor them where supported (Chromium, Firefox).
  const viewerSrc = `${src}#view=FitH&pagemode=none&toolbar=1&navpanes=0`;

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    (async () => {
      try {
        const response = await fetch(src, { method: "HEAD", signal: controller.signal });
        if (!response.ok) {
          setStatus("error");
        } else {
          setStatus("ok");
        }
      } catch {
        setStatus("error");
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [src]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-arka-bg-medium shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        {status === "error" ? (
          <div className="flex h-[calc(100vh-9rem)] min-h-[680px] flex-col items-center justify-center gap-4 p-6 text-center">
            <p className="text-sm text-arka-text-soft">
              The inline preview is unavailable. Open or download the Action Plan below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-arka-cyan/40 bg-arka-cyan/5 px-3 py-1.5 text-sm font-medium text-arka-cyan transition hover:border-arka-cyan/60 hover:bg-arka-cyan/10"
              >
                Open the Action Plan in a new tab
              </a>
              <a
                href={src}
                download
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-arka-text-muted transition hover:border-white/20 hover:text-arka-text"
              >
                Download PDF
              </a>
            </div>
          </div>
        ) : (
          <object
            data={viewerSrc}
            type="application/pdf"
            aria-label="ARKA Action Plan, version 6.0"
            className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-neutral-100"
            onError={() => setStatus("error")}
          >
            {/* Fallback for browsers that won't render PDFs inline (some iOS Safari builds, etc.) */}
            <iframe
              src={viewerSrc}
              title="ARKA Action Plan, version 6.0"
              className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-neutral-100"
            />
            <div className="p-6 text-center text-sm text-arka-text-soft">
              Your browser can&apos;t display PDFs inline.{" "}
              <a
                href={src}
                className="arka-link-underline font-medium text-arka-cyan hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open the Action Plan in a new tab
              </a>
              .
            </div>
          </object>
        )}
      </div>
    </div>
  );
}
