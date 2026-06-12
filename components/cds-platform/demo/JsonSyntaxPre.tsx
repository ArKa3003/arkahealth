'use client';

/**
 * @file JsonSyntaxPre.tsx
 * @description Syntax-highlighted JSON block for the live CDS Hooks demo panel.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

export interface JsonSyntaxPreProps {
  /** Value serialized with JSON.stringify(value, null, 2). */
  value: unknown;
  className?: string;
  maxHeightClass?: string;
  /** When true, shows a copy-to-clipboard control above the pre block. */
  showCopy?: boolean;
}

const TOKEN_RE =
  /("(?:\\.|[^"\\])*")\s*(:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b|\bnull\b)|(\{|\}|\[|\]|,)/g;

/**
 * Renders pretty-printed JSON with basic token coloring inside a monospace pre.
 */
export function JsonSyntaxPre({
  value,
  className = '',
  maxHeightClass = 'max-h-48',
  showCopy = true,
}: JsonSyntaxPreProps) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const lines = useMemo(() => text.split('\n'), [text]);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="relative min-w-0">
      {showCopy ? (
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="absolute right-2 top-2 z-10 inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-md border border-slate-600 bg-slate-800/90 px-2 text-xs text-slate-200 hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arka-teal-500"
          aria-label={copied ? 'JSON copied' : 'Copy JSON to clipboard'}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
        </button>
      ) : null}
      <pre
        className={`min-w-0 overflow-x-auto overflow-y-auto rounded bg-slate-900 p-3 pt-10 font-mono text-xs text-slate-100 ${maxHeightClass} ${className}`.trim()}
      >
        <code>
          {lines.map((line, lineIndex) => (
            <span key={`${lineIndex}-${line.slice(0, 12)}`} className="block">
              {tokenizeLine(line)}
              {lineIndex < lines.length - 1 ? '\n' : null}
            </span>
          ))}
        </code>
      </pre>
      {copied ? (
        <span className="sr-only" role="status" aria-live="polite">
          JSON copied to clipboard
        </span>
      ) : null}
    </div>
  );
}

function tokenizeLine(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(line)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <span key={key++} className="text-slate-300">
          {line.slice(lastIndex, match.index)}
        </span>,
      );
    }

    const [raw, quoted, colon, num, literal, bracket] = match;

    if (quoted && colon) {
      const isMedicalBasis = quoted === '"medicalBasis"';
      nodes.push(
        <span key={key++} className={isMedicalBasis ? 'font-semibold text-amber-200' : 'text-sky-200'}>
          {quoted}
        </span>,
      );
      nodes.push(
        <span key={key++} className="text-slate-400">
          {colon}
        </span>,
      );
    } else if (quoted) {
      nodes.push(
        <span key={key++} className="text-emerald-200">
          {quoted}
        </span>,
      );
    } else if (num) {
      nodes.push(
        <span key={key++} className="text-violet-200">
          {num}
        </span>,
      );
    } else if (literal) {
      nodes.push(
        <span key={key++} className="text-orange-200">
          {literal}
        </span>,
      );
    } else if (bracket) {
      nodes.push(
        <span key={key++} className="text-slate-400">
          {bracket}
        </span>,
      );
    } else {
      nodes.push(
        <span key={key++} className="text-slate-300">
          {raw}
        </span>,
      );
    }

    lastIndex = match.index + raw.length;
  }

  if (lastIndex < line.length) {
    nodes.push(
      <span key={key++} className="text-slate-300">
        {line.slice(lastIndex)}
      </span>,
    );
  }

  return nodes.length > 0 ? nodes : [<span key={0}>{line || ' '}</span>];
}
