import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
      <Image
        src="/arka-logo.svg"
        alt="ARKA Health"
        width={240}
        height={270}
        className="mx-auto mb-6 max-h-[180px] w-auto object-contain opacity-90"
        unoptimized
        priority
      />
      <span className="text-4xl font-bold text-arka-teal/90">404</span>
      <h1 className="mt-2 text-2xl font-bold text-arka-text-dark sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-arka-text-dark-muted">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="arka-button-primary inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light"
        >
          Back to Home
        </Link>
        <Link
          href="/clin"
          className="arka-button-secondary inline-flex min-h-[44px] items-center justify-center px-6 py-3 text-base font-semibold focus:outline-none focus:ring-2 focus:ring-arka-teal focus:ring-offset-2 focus:ring-offset-arka-bg-light"
        >
          Explore demos
        </Link>
      </div>
      <p className="mt-10 text-sm text-arka-text-dark-soft">
        <span className="font-accent italic">remARKAbly precise.</span> © 2026 ARKA.
      </p>
    </div>
  );
}
