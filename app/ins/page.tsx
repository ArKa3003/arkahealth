import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "ARKA-INS | ARKA Health",
  description: "Insurance prior authorization and appropriateness demo.",
};

export default function InsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to hub
      </Link>
      <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
        ARKA-INS
      </h1>
      <p className="mt-4 text-neutral-600 dark:text-neutral-400">
        Insurance prior authorization and imaging appropriateness. This demo
        will host the ARKA-INS workflow and CDS components.
      </p>
      <div className="mt-12 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center dark:border-neutral-600 dark:bg-neutral-800/30">
        <p className="text-neutral-500 dark:text-neutral-400">
          ARKA-INS demo content coming soon.
        </p>
      </div>
    </div>
  );
}
