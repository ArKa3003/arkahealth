'use client';

/**
 * @file RoiCounter.tsx
 * @description Animated glassmorphic ROI tile for guideline-consistent alternative selections.
 */

import { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

export interface RoiCounterProps {
  dollarsAvoided: number;
  ordersOptimized: number;
  className?: string;
}

/**
 * Displays cumulative dollars potentially avoided with a spring animation on change.
 */
export function RoiCounter({ dollarsAvoided, ordersOptimized, className = '' }: RoiCounterProps) {
  const spring = useSpring(dollarsAvoided, { stiffness: 120, damping: 20 });
  const [display, setDisplay] = useState(dollarsAvoided);

  useEffect(() => {
    spring.set(dollarsAvoided);
  }, [dollarsAvoided, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return () => unsub();
  }, [spring]);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(display);

  return (
    <motion.div
      className={`rounded-xl border border-arka-cyan/30 bg-arka-cyan/10 p-4 backdrop-blur-md ${className}`}
      layout
      aria-live="polite"
      aria-label={`${display} dollars potentially avoided across ${ordersOptimized} orders reviewed`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-arka-muted">Potentially avoided</p>
      <p className="mt-1 text-2xl font-semibold text-arka-cyan tabular-nums">{formatted}</p>
      <p className="mt-2 text-xs text-arka-muted">
        {ordersOptimized > 0
          ? `${formatted} potentially avoided when clinician chose guideline-consistent alternative.`
          : 'Guideline-consistent alternatives update this counter when selected in the chart.'}
      </p>
    </motion.div>
  );
}
