"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getFdaNoticeParagraph,
  inferProductFromPathname,
  isFdaNoticeAcknowledged,
  isPatientFdaRoute,
  setFdaNoticeAcknowledged,
} from "@/lib/compliance/fda-notice-copy";

const REGULATORY_LINK_CLASS =
  "font-medium text-blue-800 underline decoration-blue-600/80 underline-offset-2 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-cyan focus-visible:ring-offset-1";

/**
 * One-time FDA Non-Device CDS acknowledgment modal shown site-wide until dismissed.
 */
export function FDAAcknowledgmentModal() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const product = inferProductFromPathname(pathname);
  const variant = isPatientFdaRoute(pathname) ? "patient" : "default";
  const noticeText = getFdaNoticeParagraph(product, variant);

  React.useEffect(() => {
    if (!isFdaNoticeAcknowledged()) {
      setOpen(true);
    }
  }, []);

  const handleAcknowledge = () => {
    setFdaNoticeAcknowledged();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        aria-describedby="fda-acknowledgment-description"
        className="max-w-lg border-blue-200 bg-[#EFF6FF] text-slate-800 sm:max-w-xl [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-900 sm:text-lg">
            FDA Non-Device Clinical Decision Support Notice
          </DialogTitle>
          <DialogDescription id="fda-acknowledgment-description" className="sr-only">
            Regulatory notice for ARKA Clinical Decision Support under FD&amp;C Act §520(o)(1)(E).
          </DialogDescription>
        </DialogHeader>

        <p className="text-left text-sm leading-relaxed text-slate-800">{noticeText}</p>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/docs/regulatory-rationale" className={REGULATORY_LINK_CLASS}>
            Read the regulatory rationale ↗
          </Link>
          <Link href="/docs/model-card" className={REGULATORY_LINK_CLASS}>
            Review the model card ↗
          </Link>
        </div>

        <DialogFooter className="sm:justify-center">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="w-full rounded-lg bg-arka-teal px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-arka-teal/90 focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 sm:w-auto"
          >
            I Acknowledge
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
