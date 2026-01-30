import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-ED | ARKA Health",
  description:
    "Educational platform: case-based learning for imaging appropriateness. Practice with clinical vignettes and evidence-based feedback.",
};

export default function EdLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
