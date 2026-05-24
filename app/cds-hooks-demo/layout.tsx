import type { Metadata } from 'next';

/**
 * CDS Hooks live demo layout — metadata and content shell.
 * Global Navbar/Footer are provided by the root layout.
 */
export const metadata: Metadata = {
  title: 'ARKA CDS Hooks · Live Demo',
  description:
    'Live CDS Hooks 2.0 integration demo: guideline-anchored imaging appropriateness with transparent ML refinement, designed for FDA Non-Device CDS under the 21st Century Cures Act.',
  openGraph: {
    title: 'ARKA CDS Hooks · Live Demo',
    description:
      'Shareholder demo of citation-first CDS Hooks cards at the point of imaging order entry.',
  },
};

export default function CdsHooksDemoLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-screen bg-arka-bg-light">{children}</main>;
}
