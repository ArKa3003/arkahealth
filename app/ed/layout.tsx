import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ARKA-ED | Educational Platform",
  description:
    "Case-based learning for imaging appropriateness. Practice with clinical vignettes, select imaging, and get evidence-based feedback aligned with ACR criteria.",
  openGraph: {
    title: "ARKA-ED | ARKA Health",
    description:
      "Educational platform for imaging appropriateness. Case-based learning with ACR criteria.",
  },
};

export default function EdLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
