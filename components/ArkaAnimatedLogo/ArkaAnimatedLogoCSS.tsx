'use client';

import React, { useId, useState, useEffect } from 'react';
import './ArkaAnimatedLogo.css';

const CIRCLE_OUTER_LENGTH = 2 * Math.PI * 250;
const CIRCLE_INNER_LENGTH = 2 * Math.PI * 235;
const ARC_PATH_LENGTH = 2 * Math.PI * 250 * (114 / 360);
const UNDERLINE_PATH_LENGTH = 302;
const CORNER_L_PATH_LENGTH = 90;

export interface ArkaAnimatedLogoCSSProps {
  width?: number;
  height?: number;
  /** Master switch for all animations. */
  animate?: boolean;
  /** When true (default), runs continuous idle animations after entrance. */
  idleAnimations?: boolean;
  /** Animation speed multiplier (default 1). */
  animationSpeed?: number;
  /** Called when entrance animations finish. */
  onAnimationComplete?: () => void;
  className?: string;
}

/**
 * ARKA logo with CSS-only animations (no Framer Motion).
 * For projects that don't use React/Framer Motion.
 * Import ArkaAnimatedLogo.css when using this component.
 */
export default function ArkaAnimatedLogoCSS({
  width = 800,
  height = 900,
  animate = true,
  idleAnimations = true,
  animationSpeed = 1,
  onAnimationComplete,
  className,
}: ArkaAnimatedLogoCSSProps) {
  const uid = useId().replace(/:/g, '');
  const prefix = `arka-css-${uid}-`;
  const [isMounted, setMounted] = useState(false);
  const [entranceDone, setEntranceDone] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!animate || !idleAnimations || !onAnimationComplete) return;
    const t = setTimeout(() => {
      setEntranceDone(true);
      onAnimationComplete?.();
    }, (2500 / animationSpeed));
    return () => clearTimeout(t);
  }, [animate, idleAnimations, onAnimationComplete, animationSpeed]);

  const shouldAnimate = animate && isMounted && !prefersReducedMotion;
  const idle = shouldAnimate && idleAnimations && entranceDone;
  const speed = Math.max(0.1, animationSpeed);
  const d = (ms: number) => `${ms / speed}ms`;
  const delay = (ms: number) => `${ms / speed}ms`;

  return (
    <svg
      viewBox="0 0 800 900"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width={width}
      height={height}
      className={className}
      data-animate={shouldAnimate}
      data-idle={idle}
      style={
        idle
          ? {
              ['--arka-anim-duration' as string]: d(4000),
              ['--arka-anim-delay' as string]: delay(2500),
            } as React.CSSProperties
          : undefined
      }
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

      {/* Root group for idle breath - CSS */}
      <g
        style={{
          transformOrigin: '400px 450px',
          animation: idle ? `arka-root-breath ${d(4000)} ease-in-out ${delay(2500)} infinite` : undefined,
        }}
      >
        <circle cx={400} cy={380} r={280} fill={`url(#${prefix}glowEffect)`} />

        {/* outer-rings */}
        <g
          id="outer-rings"
          style={{
            transformOrigin: '400px 380px',
            animation: idle ? `arka-ring-rotate 60s linear ${delay(1600)} infinite` : undefined,
          }}
        >
          <circle
            cx={400}
            cy={380}
            r={250}
            fill="none"
            stroke={`url(#${prefix}ringGradient1)`}
            strokeWidth={8}
            opacity={0.9}
            strokeDasharray={CIRCLE_OUTER_LENGTH}
            style={
              shouldAnimate
                ? {
                    strokeDashoffset: CIRCLE_OUTER_LENGTH,
                    animation: `arka-ring-draw ${d(1200)} ease-in-out ${delay(300)} forwards`,
                    ['--arka-stroke-length' as string]: CIRCLE_OUTER_LENGTH,
                  }
                : {}
            }
          />
          <circle
            cx={400}
            cy={380}
            r={235}
            fill="none"
            stroke={`url(#${prefix}ringGradient1)`}
            strokeWidth={3}
            opacity={0.6}
            strokeDasharray={CIRCLE_INNER_LENGTH}
            style={
              shouldAnimate
                ? {
                    strokeDashoffset: CIRCLE_INNER_LENGTH,
                    animation: `arka-ring-draw ${d(1200)} ease-in-out ${delay(400)} forwards`,
                    ['--arka-stroke-length' as string]: CIRCLE_INNER_LENGTH,
                  }
                : {}
            }
          />
          <path
            d="M 400 130 A 250 250 0 0 1 621 480"
            fill="none"
            stroke={`url(#${prefix}ringGradient2)`}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.95}
            strokeDasharray={ARC_PATH_LENGTH}
            style={
              shouldAnimate
                ? {
                    strokeDashoffset: ARC_PATH_LENGTH,
                    animation: `arka-arc-draw ${d(800)} ease-in-out ${delay(800)} forwards`,
                    ['--arka-arc-length' as string]: ARC_PATH_LENGTH,
                  }
                : {}
            }
          />
          {idle && (
            <circle cx={0} cy={0} r={3} fill="#00D9FF" opacity={1}>
              <animateMotion
                begin="1.6s"
                dur="2.5s"
                repeatCount="indefinite"
                path="M 400 130 A 250 250 0 0 1 621 480"
              />
            </circle>
          )}
        </g>

        <circle
          id="inner-circle"
          cx={400}
          cy={380}
          r={210}
          fill={`url(#${prefix}circleInner)`}
          filter={`url(#${prefix}dropShadow)`}
        />

        {/* medical-symbols */}
        {[
          { i: 0, tx: '307.5px', ty: '300px', duration: 3200 },
          { i: 1, tx: '482px', ty: '300px', duration: 3500 },
          { i: 2, tx: '310px', ty: '460px', duration: 3800 },
          { i: 3, tx: '482px', ty: '460px', duration: 3400 },
        ].map(({ i, tx, ty, duration }) => (
          <g
            key={i}
            style={{
              transformOrigin: `${tx} ${ty}`,
              opacity: shouldAnimate ? 0 : 0.15,
              animation: shouldAnimate
                ? `arka-symbol-enter ${d(600)} ease-out ${delay(1200 + i * 150)} forwards${idle ? `, arka-symbol-float ${d(duration)} ease-in-out ${delay(1200 + i * 150 + 600)} infinite` : ''}`
                : undefined,
            }}
          >
            {i === 0 && (
              <>
                <path
                  d="M 320 280 Q 300 270 290 290 Q 285 310 300 320 Q 315 325 325 310 Q 328 295 320 280"
                  fill="#5B9BD5"
                />
                <circle cx={315} cy={300} r={3} fill="#E8F4F8" />
                <circle cx={308} cy={295} r={2} fill="#E8F4F8" />
                <circle cx={310} cy={308} r={2} fill="#E8F4F8" />
              </>
            )}
            {i === 1 && (
              <>
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
              </>
            )}
            {i === 2 && (
              <path
                d="M 310 450 Q 305 440 295 445 Q 288 452 295 460 L 310 475 L 325 460 Q 332 452 325 445 Q 315 440 310 450"
                fill="#5B9BD5"
              />
            )}
            {i === 3 && (
              <>
                <circle cx={475} cy={455} r={5} fill="#5B9BD5" />
                <circle cx={490} cy={455} r={5} fill="#5B9BD5" />
                <circle cx={482} cy={470} r={5} fill="#5B9BD5" />
                <line x1={475} y1={455} x2={490} y2={455} stroke="#5B9BD5" strokeWidth={2} />
                <line x1={475} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
                <line x1={490} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
              </>
            )}
          </g>
        ))}

        {/* letters-group */}
        <g id="letters-group" filter={`url(#${prefix}letterGlow)`}>
          {[
            { delayMs: 500, d: 'M 205 420 L 245 320 L 270 320 L 310 420 L 285 420 L 277 395 L 238 395 L 230 420 Z M 245 375 L 270 375 L 257.5 340 Z' },
            { delayMs: 600, d: 'M 320 420 L 320 320 L 380 320 Q 400 320 410 335 Q 415 345 415 362 Q 415 379 405 389 Q 398 394 388 396 L 418 420 L 393 420 L 368 398 L 345 398 L 345 420 L 320 420 Z M 345 342 L 345 378 L 378 378 Q 388 378 393 370 Q 396 362 393 354 Q 388 346 378 346 L 345 342 Z', hasCt: true },
            { delayMs: 700, d: 'M 405 420 L 405 320 L 430 320 L 430 365 L 465 320 L 495 320 L 455 370 L 500 420 L 470 420 L 440 380 L 430 390 L 430 420 Z' },
            { delayMs: 800, d: 'M 490 420 L 530 320 L 555 320 L 595 420 L 570 420 L 562 395 L 523 395 L 515 420 Z M 530 375 L 555 375 L 542.5 340 Z' },
          ].map((item, i) => (
            <g
              key={i}
              style={{
                opacity: shouldAnimate ? 0 : 1,
                transform: shouldAnimate ? 'translateY(20px)' : 'translateY(0)',
                animation: shouldAnimate ? `arka-letter-enter ${d(500)} ease-out ${delay(item.delayMs)} forwards` : undefined,
              }}
            >
              <path
                d={item.d}
                fill={`url(#${prefix}letterGradient)`}
                filter={`url(#${prefix}textShadow)`}
              />
              {item.hasCt && (
                <g
                  id="ct-scanner"
                  style={{
                    transformOrigin: '371px 362px',
                    opacity: 0.7,
                    transform: shouldAnimate ? 'scale(0)' : 'scale(1)',
                    animation: shouldAnimate ? `arka-ct-scale ${d(500)} ease-out ${delay(1100)} forwards` : undefined,
                  }}
                >
                  <circle cx={371} cy={362} r={13} fill="none" stroke="#00D9FF" strokeWidth={1.5} />
                  <circle cx={371} cy={362} r={9} fill="none" stroke="#00D9FF" strokeWidth={1} />
                  <circle cx={371} cy={362} r={5} fill="none" stroke="#00D9FF" strokeWidth={0.8} />
                  <circle cx={371} cy={362} r={1.5} fill="#00D9FF" />
                  <line x1={371} y1={362} x2={381} y2={354} stroke="#00D9FF" strokeWidth={1.5} opacity={0.8} />
                </g>
              )}
            </g>
          ))}
        </g>

        {/* spear-group */}
        <g
          id="spear-group"
          filter={`url(#${prefix}dropShadow)`}
          style={{
            opacity: shouldAnimate ? 0 : 1,
            transform: shouldAnimate ? 'translateY(-100%) scale(1.02)' : 'translateY(0) scale(1)',
            animation: shouldAnimate ? `arka-spear-enter ${d(950)} cubic-bezier(0.16, 1, 0.3, 1) forwards` : undefined,
          }}
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
          <circle
            cx={400}
            cy={250}
            r={6}
            fill="#00D9FF"
            style={{
              opacity: idle ? undefined : 0.8,
              animation: idle ? `arka-dot-pulse ${d(2000)} ease-in-out ${delay(950)} infinite` : undefined,
            }}
          />
          <circle
            cx={400}
            cy={510}
            r={6}
            fill="#5B9BD5"
            style={{
              opacity: idle ? undefined : 0.8,
              animation: idle ? `arka-dot-pulse ${d(2000)} ease-in-out ${delay(950)} infinite` : undefined,
            }}
          />
        </g>

        {/* tagline-group */}
        <g id="tagline-group">
          <text
            x={400}
            y={680}
            fontFamily="Georgia, serif"
            fontSize={42}
            fontStyle="italic"
            fill="#5B9BD5"
            textAnchor="middle"
            letterSpacing={1}
            style={{
              opacity: shouldAnimate ? 0 : 1,
              transform: shouldAnimate ? 'translateY(15px)' : 'translateY(0)',
              animation: shouldAnimate ? `arka-tagline-enter ${d(700)} ease-out ${delay(1500)} forwards` : undefined,
            }}
          >
            rem<tspan fill="#00D9FF" fontWeight="bold">ARKA</tspan>bly precise
          </text>
          <path
            d="M 250 695 Q 400 690 550 695"
            stroke="#5B9BD5"
            strokeWidth={2}
            fill="none"
            opacity={0.4}
            strokeDasharray={UNDERLINE_PATH_LENGTH}
            style={
              shouldAnimate
                ? {
                    strokeDashoffset: UNDERLINE_PATH_LENGTH,
                    animation: `arka-underline-draw ${d(500)} ease-out ${delay(2000)} forwards`,
                    ['--arka-underline-length' as string]: UNDERLINE_PATH_LENGTH,
                  }
                : {}
            }
          />
        </g>

        {/* corner-markers */}
        {[
          { d: 'M 150 130 L 180 130 L 150 130 L 150 160', stroke: '#5B9BD5' },
          { d: 'M 650 130 L 620 130 L 650 130 L 650 160', stroke: '#00D9FF' },
          { d: 'M 150 630 L 180 630 L 150 630 L 150 600', stroke: '#5B9BD5' },
          { d: 'M 650 630 L 620 630 L 650 630 L 650 600', stroke: '#00D9FF' },
        ].map((corner, i) => (
          <path
            key={i}
            d={corner.d}
            fill="none"
            stroke={corner.stroke}
            strokeWidth={2}
            strokeDasharray={CORNER_L_PATH_LENGTH}
            style={
              shouldAnimate
                ? {
                    strokeDashoffset: CORNER_L_PATH_LENGTH,
                    opacity: 1,
                    animation: `arka-corner-draw ${d(400)} ease-in-out ${delay(1000)} forwards`,
                    ['--arka-corner-length' as string]: CORNER_L_PATH_LENGTH,
                  }
                : { opacity: 0.3 }
            }
          />
        ))}

        {/* precision-dots */}
        <g id="precision-dots" opacity={0.4} stroke="#5B9BD5" strokeWidth={2}>
          <line x1={400} y1={120} x2={400} y2={130} />
          <line x1={640} y1={380} x2={650} y2={380} />
          <line x1={150} y1={380} x2={160} y2={380} />
          {[
            { cx: 400, cy: 125 },
            { cx: 155, cy: 380 },
            { cx: 645, cy: 380 },
          ].map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r={3}
              fill="#00D9FF"
              style={{
                transformOrigin: `${dot.cx}px ${dot.cy}px`,
                transform: shouldAnimate ? 'scale(0)' : 'scale(1)',
                animation: shouldAnimate
                  ? `arka-dot-scale ${d(300)} cubic-bezier(0.34, 1.8, 0.64, 1) ${delay(1300 + i * 100)} forwards`
                  : undefined,
              }}
            />
          ))}
        </g>
      </g>
    </svg>
  );
}
