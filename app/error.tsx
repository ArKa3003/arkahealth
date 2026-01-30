"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src="/arka-icon.svg"
        alt=""
        width={48}
        height={48}
        className="mx-auto mb-6 opacity-80"
        unoptimized
      />
      <h1 className="text-2xl font-bold text-arka-text sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-arka-text-soft">
        We encountered an unexpected error. Our team has been notified. Please try again or return home.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
        >
          Try again
        </button>
        <Link
          href="/"
          className="arka-button-secondary inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-cyan focus:ring-offset-2 focus:ring-offset-arka-bg-dark"
        >
          Back to Home
        </Link>
      </div>
      <p className="mt-10 text-sm text-arka-text-soft/80">
        <span className="font-accent italic">remARKAbly precise.</span> © 2026 ARKA.
      </p>
    </div>
  );
}
