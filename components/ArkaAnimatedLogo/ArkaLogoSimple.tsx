'use client';

import React, { useId, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export interface ArkaLogoSimpleProps {
  width?: number;
  height?: number;
  /** Master switch for entrance animations. When false, shows static logo. */
  animate?: boolean;
  /** Animation speed multiplier (default 1). */
  animationSpeed?: number;
  /** Called when entrance animations finish. */
  onAnimationComplete?: () => void;
  className?: string;
}

/**
 * Lightweight ARKA logo with minimal animations:
 * spear entrance, letters fade-in, tagline fade-in.
 * No continuous/idle animations. Smaller bundle, good for mobile.
 */
export default function ArkaLogoSimple({
  width = 800,
  height = 900,
  animate = true,
  animationSpeed = 1,
  onAnimationComplete,
  className,
}: ArkaLogoSimpleProps) {
  const uid = useId().replace(/:/g, '');
  const prefix = `arka-simple-${uid}-`;
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldAnimate = animate && isMounted && prefersReducedMotion !== true;
  const speed = Math.max(0.1, animationSpeed);
  const d = (duration: number) => duration / speed;
  const delay = (baseDelay: number) => baseDelay / speed;

  const UNDERLINE_PATH_LENGTH = 302;

  return (
    <svg
      viewBox="0 0 800 900"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width={width}
      height={height}
      className={className}
    >
      <defs>
        <linearGradient id={`${prefix}spearGradient`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#A8D5E2', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#5B9BD5', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#2C5F8D', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id={`${prefix}ringGradient1`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#E8F4F8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#5B9BD5', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id={`${prefix}ringGradient2`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#00D9FF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0A7E8C', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id={`${prefix}circleInner`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#1A2942', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#0D1929', stopOpacity: 1 }} />
        </linearGradient>

        <radialGradient id={`${prefix}glowEffect`} cx="50%" cy="50%" r="50%">
          <stop offset="70%" style={{ stopColor: '#5B9BD5', stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: '#5B9BD5', stopOpacity: 0.3 }} />
        </radialGradient>

        <linearGradient id={`${prefix}letterGradient`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFFFFF', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#E8F4F8', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#B8D8E8', stopOpacity: 1 }} />
        </linearGradient>

        <filter id={`${prefix}dropShadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={3} />
          <feOffset dx={2} dy={4} result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.3} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${prefix}textShadow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={2} />
          <feOffset dx={1} dy={2} result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.4} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${prefix}letterGlow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={3} />
          <feOffset dx={0} dy={0} result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={0.4} />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background glow effect */}
      <circle cx={400} cy={380} r={280} fill={`url(#${prefix}glowEffect)`} />

      {/* outer-rings - static, no animation */}
      <g id="outer-rings" style={{ transformOrigin: '400px 380px' }}>
        <circle
          cx={400}
          cy={380}
          r={250}
          fill="none"
          stroke={`url(#${prefix}ringGradient1)`}
          strokeWidth={8}
          opacity={0.9}
        />
        <circle
          cx={400}
          cy={380}
          r={235}
          fill="none"
          stroke={`url(#${prefix}ringGradient1)`}
          strokeWidth={3}
          opacity={0.6}
        />
        <path
          d="M 400 130 A 250 250 0 0 1 621 480"
          fill="none"
          stroke={`url(#${prefix}ringGradient2)`}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.95}
        />
      </g>

      {/* White outer ring - own animation, after spear */}
      <motion.circle
        cx={400}
        cy={380}
        r={252}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={6}
        initial={shouldAnimate ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        transition={
          shouldAnimate
            ? {
                duration: d(0.5),
                delay: delay(1.05),
                ease: [0.16, 1, 0.3, 1],
              }
            : {}
        }
        style={{ transformOrigin: '400px 380px' }}
      />

      {/* inner-circle */}
      <circle
        id="inner-circle"
        cx={400}
        cy={380}
        r={210}
        fill={`url(#${prefix}circleInner)`}
        filter={`url(#${prefix}dropShadow)`}
      />

      {/* medical-symbols - static */}
      <g id="medical-symbols">
        <g style={{ transformOrigin: '307.5px 300px', opacity: 0.15 }}>
          <path
            d="M 320 280 Q 300 270 290 290 Q 285 310 300 320 Q 315 325 325 310 Q 328 295 320 280"
            fill="#5B9BD5"
          />
          <circle cx={315} cy={300} r={3} fill="#E8F4F8" />
          <circle cx={308} cy={295} r={2} fill="#E8F4F8" />
          <circle cx={310} cy={308} r={2} fill="#E8F4F8" />
        </g>
        <g style={{ transformOrigin: '482px 300px', opacity: 0.15 }}>
          <path
            d="M 470 290 Q 480 280 490 290 Q 495 300 490 310 Q 485 315 475 310"
            fill="none"
            stroke="#5B9BD5"
            strokeWidth={2}
          />
          <path
            d="M 475 295 Q 483 287 490 295 Q 493 303 488 310"
            fill="none"
            stroke="#5B9BD5"
            strokeWidth={2}
          />
          <circle cx={482} cy={300} r={4} fill="#5B9BD5" />
        </g>
        <g style={{ transformOrigin: '310px 460px', opacity: 0.15 }}>
          <path
            d="M 310 450 Q 305 440 295 445 Q 288 452 295 460 L 310 475 L 325 460 Q 332 452 325 445 Q 315 440 310 450"
            fill="#5B9BD5"
          />
        </g>
        <g style={{ transformOrigin: '482px 460px', opacity: 0.15 }}>
          <circle cx={475} cy={455} r={5} fill="#5B9BD5" />
          <circle cx={490} cy={455} r={5} fill="#5B9BD5" />
          <circle cx={482} cy={470} r={5} fill="#5B9BD5" />
          <line x1={475} y1={455} x2={490} y2={455} stroke="#5B9BD5" strokeWidth={2} />
          <line x1={475} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
          <line x1={490} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
        </g>
      </g>

      {/* letters-group - animated fade-in */}
      <g id="letters-group" filter={`url(#${prefix}letterGlow)`}>
        <motion.g
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={shouldAnimate ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.5) } : {}}
        >
          <path
            d="M 205 420 L 245 320 L 270 320 L 310 420 L 285 420 L 277 395 L 238 395 L 230 420 Z M 245 375 L 270 375 L 257.5 340 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
        <motion.g
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={shouldAnimate ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.6) } : {}}
        >
          <path
            d="M 320 420 L 320 320 L 380 320 Q 400 320 410 335 Q 415 345 415 362 Q 415 379 405 389 Q 398 394 388 396 L 418 420 L 393 420 L 368 398 L 345 398 L 345 420 L 320 420 Z M 345 342 L 345 378 L 378 378 Q 388 378 393 370 Q 396 362 393 354 Q 388 346 378 346 L 345 342 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
          <g id="ct-scanner" style={{ transformOrigin: '371px 362px', opacity: 0.7 }}>
            <circle cx={371} cy={362} r={13} fill="none" stroke="#00D9FF" strokeWidth={1.5} />
            <circle cx={371} cy={362} r={9} fill="none" stroke="#00D9FF" strokeWidth={1} />
            <circle cx={371} cy={362} r={5} fill="none" stroke="#00D9FF" strokeWidth={0.8} />
            <circle cx={371} cy={362} r={1.5} fill="#00D9FF" />
            <line x1={371} y1={362} x2={381} y2={354} stroke="#00D9FF" strokeWidth={1.5} opacity={0.8} />
          </g>
        </motion.g>
        <motion.g
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={shouldAnimate ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.7) } : {}}
        >
          <path
            d="M 405 420 L 405 320 L 430 320 L 430 365 L 465 320 L 495 320 L 455 370 L 500 420 L 470 420 L 440 380 L 430 390 L 430 420 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
        <motion.g
          initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
          animate={shouldAnimate ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={shouldAnimate ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.8) } : {}}
        >
          <path
            d="M 490 420 L 530 320 L 555 320 L 595 420 L 570 420 L 562 395 L 523 395 L 515 420 Z M 530 375 L 555 375 L 542.5 340 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
      </g>

      {/* spear-group - animated entrance */}
      <motion.g
        id="spear-group"
        filter={`url(#${prefix}dropShadow)`}
        initial={
          shouldAnimate
            ? { opacity: 0, y: '-100%', scale: 1.02 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        animate={
          shouldAnimate
            ? {
                opacity: [0, 1, 1],
                y: ['-100%', 0, 0],
                scale: [1.02, 1.02, 1],
              }
            : { opacity: 1, y: 0, scale: 1 }
        }
        transition={
          shouldAnimate
            ? {
                duration: d(0.95),
                times: [0, 0.8 / 0.95, 1],
                ease: [[0.16, 1, 0.3, 1] as const, 'easeOut'],
              }
            : {}
        }
      >
        <rect x={395} y={200} width={10} height={360} fill={`url(#${prefix}spearGradient)`} rx={2} />
        <path
          d="M 400 90 L 420 180 L 410 185 L 410 200 L 390 200 L 390 185 L 380 180 Z"
          fill={`url(#${prefix}spearGradient)`}
        />
        <path d="M 400 90 L 405 180 L 400 185 L 395 180 Z" fill="#E8F4F8" opacity={0.7} />
        <path d="M 400 120 L 408 160 L 400 165 L 392 160 Z" fill="#A8D5E2" opacity={0.5} />
        <line x1={400} y1={130} x2={400} y2={170} stroke="#FFFFFF" strokeWidth={1} opacity={0.6} />
        <rect x={360} y={197} width={80} height={6} fill="#5B9BD5" rx={2} />
        <rect x={397} y={180} width={6} height={40} fill="#5B9BD5" rx={2} />
        <path
          d="M 400 560 L 380 520 L 390 515 L 390 500 L 410 500 L 410 515 L 420 520 Z"
          fill={`url(#${prefix}spearGradient)`}
        />
        <path d="M 400 560 L 395 520 L 400 515 L 405 520 Z" fill="#2C5F8D" opacity={0.8} />
        <circle cx={400} cy={250} r={6} fill="#00D9FF" opacity={0.8} />
        <circle cx={400} cy={510} r={6} fill="#5B9BD5" opacity={0.8} />
      </motion.g>

      {/* tagline-group - horizontal slide-in, 1/4 slower, sequentially last (after white ring) */}
      <g id="tagline-group">
        <motion.text
          x={400}
          y={680}
          fontFamily="Georgia, serif"
          fontSize={42}
          fontStyle="italic"
          fill="#5B9BD5"
          textAnchor="middle"
          letterSpacing={1}
          initial={shouldAnimate ? { opacity: 0, x: 360 } : undefined}
          animate={shouldAnimate ? { opacity: 1, x: 400 } : undefined}
          transition={
            shouldAnimate
              ? {
                  opacity: { duration: d(0.9), delay: delay(1.65), ease: 'easeOut' },
                  x: { duration: d(0.9), delay: delay(1.65), ease: [0.16, 1, 0.3, 1] },
                }
              : {}
          }
        >
          rem<tspan fill="#00D9FF" fontWeight="bold">ARKA</tspan>bly precise
        </motion.text>
        <motion.path
          d="M 250 695 Q 400 690 550 695"
          stroke="#5B9BD5"
          strokeWidth={2}
          fill="none"
          opacity={0.4}
          initial={
            shouldAnimate
              ? {
                  strokeDasharray: UNDERLINE_PATH_LENGTH,
                  strokeDashoffset: UNDERLINE_PATH_LENGTH,
                }
              : undefined
          }
          animate={
            shouldAnimate
              ? {
                  strokeDasharray: UNDERLINE_PATH_LENGTH,
                  strokeDashoffset: 0,
                }
              : undefined
          }
          transition={
            shouldAnimate
              ? { duration: d(0.5), delay: delay(2.6), ease: 'easeOut' }
              : {}
          }
          style={shouldAnimate ? { strokeDasharray: UNDERLINE_PATH_LENGTH } : undefined}
          onAnimationComplete={shouldAnimate ? onAnimationComplete : undefined}
        />
      </g>

      {/* corner-markers - static */}
      <g id="corner-markers">
        <path
          d="M 150 130 L 180 130 L 150 130 L 150 160"
          fill="none"
          stroke="#5B9BD5"
          strokeWidth={2}
          opacity={0.3}
        />
        <path
          d="M 650 130 L 620 130 L 650 130 L 650 160"
          fill="none"
          stroke="#00D9FF"
          strokeWidth={2}
          opacity={0.3}
        />
        <path
          d="M 150 630 L 180 630 L 150 630 L 150 600"
          fill="none"
          stroke="#5B9BD5"
          strokeWidth={2}
          opacity={0.3}
        />
        <path
          d="M 650 630 L 620 630 L 650 630 L 650 600"
          fill="none"
          stroke="#00D9FF"
          strokeWidth={2}
          opacity={0.3}
        />
      </g>

      {/* precision-dots - static */}
      <g id="precision-dots" opacity={0.4} stroke="#5B9BD5" strokeWidth={2}>
        <line x1={400} y1={120} x2={400} y2={130} />
        <line x1={640} y1={380} x2={650} y2={380} />
        <line x1={150} y1={380} x2={160} y2={380} />
        <circle cx={400} cy={125} r={3} fill="#00D9FF" />
        <circle cx={155} cy={380} r={3} fill="#00D9FF" />
        <circle cx={645} cy={380} r={3} fill="#00D9FF" />
      </g>
    </svg>
  );
}
