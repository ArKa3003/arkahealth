'use client';

/**
 * @file JsonSyntaxPre.tsx
 * @description Syntax-highlighted JSON block for the live CDS Hooks demo panel.
 */

import { useMemo, type ReactNode } from 'react';

export interface JsonSyntaxPreProps {
  /** Value serialized with JSON.stringify(value, null, 2). */
  value: unknown;
  className?: string;
  maxHeightClass?: string;
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
}: JsonSyntaxPreProps) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const lines = useMemo(() => text.split('\n'), [text]);

  return (
    <pre
      className={`overflow-auto rounded bg-slate-900 p-3 font-mono text-xs text-slate-100 ${maxHeightClass} ${className}`.trim()}
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
        <span key={key++} className={isMedicalBasis ? 'text-amber-300 font-semibold' : 'text-sky-300'}>
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
        <span key={key++} className="text-emerald-300">
          {quoted}
        </span>,
      );
    } else if (num) {
      nodes.push(
        <span key={key++} className="text-violet-300">
          {num}
        </span>,
      );
    } else if (literal) {
      nodes.push(
        <span key={key++} className="text-orange-300">
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
