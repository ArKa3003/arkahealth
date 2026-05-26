'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { toInAppHref } from '@/lib/cds-platform/ml/feature-citation-url';

export interface CitationLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Renders external citations in a new tab or first-party catalogue links with Next.js {@link Link}.
 */
export function CitationLink({ href, children, className }: CitationLinkProps) {
  const inApp = toInAppHref(href);

  if (inApp) {
    return (
      <Link href={inApp} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
      <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
    </a>
  );
}

