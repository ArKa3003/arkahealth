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
  "text-base font-semibold text-arka-teal-300 underline decoration-arka-teal-300/80 underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-300 focus-visible:ring-offset-1 focus-visible:ring-offset-arka-bg-dark";

/**
 * One-time FDA Non-Device CDS acknowledgment modal shown site-wide until dismissed.
 */
export function FDAAcknowledgmentModal() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(() => !isFdaNoticeAcknowledged());

  const product = inferProductFromPathname(pathname);
  const variant = isPatientFdaRoute(pathname) ? "patient" : "default";
  const noticeText = getFdaNoticeParagraph(product, variant);

  const handleAcknowledge = () => {
    setFdaNoticeAcknowledged();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        aria-describedby="fda-acknowledgment-description"
        className="max-w-xl border border-arka-teal/30 bg-arka-bg-dark text-arka-text-soft p-7 sm:p-9 sm:max-w-2xl [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
            FDA Non-Device Clinical Decision Support Notice
          </DialogTitle>
          <DialogDescription id="fda-acknowledgment-description" className="sr-only">
            Regulatory notice for ARKA Clinical Decision Support under FD&amp;C Act §520(o)(1)(E).
          </DialogDescription>
        </DialogHeader>

        <p className="text-left text-base leading-relaxed text-arka-text-soft sm:text-lg">{noticeText}</p>

        <div className="flex flex-wrap items-center gap-4 pt-1 text-base">
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
            className="w-full rounded-lg bg-arka-slate-900 px-7 py-3 text-base font-semibold text-white transition-colors hover:bg-arka-slate-800 focus:outline-none focus:ring-2 focus:ring-arka-teal-500 focus:ring-offset-2 focus:ring-offset-arka-bg-dark sm:w-auto"
          >
            I Acknowledge
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
