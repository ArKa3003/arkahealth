"use client";

type Props = {
  src: string;
};

export function ActionPlanViewer({ src }: Props) {
  // Native PDF viewer params: open at page 1, fit to width, hide PDF toolbar chrome we don't need.
  // These params are advisory — browsers honor them where supported (Chromium, Firefox).
  const viewerSrc = `${src}#view=FitH&pagemode=none&toolbar=1&navpanes=0`;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-xl border border-white/10 bg-arka-bg-medium shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)]">
        <object
          data={viewerSrc}
          type="application/pdf"
          aria-label="ARKA Action Plan, version 6.0"
          className="block h-[calc(100vh-9rem)] min-h-[680px] w-full bg-neutral-100"
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
      </div>
    </div>
  );
}
