"use client";

import Image from "next/image";
import Link from "next/link";
import { routes } from "@/lib/constants";

export function Logo() {
  return (
    <Link
      href={routes.home}
      className="flex items-center gap-2 font-semibold text-foreground no-underline"
    >
      <Image
        src="/arka-logo.svg"
        alt="ARKA Health"
        width={36}
        height={36}
        className="h-9 w-9"
      />
      <span>ARKA Health</span>
    </Link>
  );
}
