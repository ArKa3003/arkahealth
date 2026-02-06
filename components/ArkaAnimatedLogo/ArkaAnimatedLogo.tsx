'use client';

import React, { useId, useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Shared style for GPU acceleration on animated elements (transform/opacity only)
const ANIMATED_STYLE = { willChange: 'transform, opacity' as const };
const GPU_LAYER_STYLE = { transform: 'translateZ(0)' };

// Medical symbol float durations (3–4s, randomized per symbol, stable across renders)
const SYMBOL_FLOAT_DURATIONS = [3.2, 3.5, 3.8, 3.4] as const;
const SYMBOL_STAGGER = 0.15;
const SYMBOL_ENTRANCE_DELAY = 1.2;
const SYMBOL_ENTRANCE_DURATION = 0.6;

// Ring path lengths for draw-on animation (stroke-dasharray/offset)
const CIRCLE_OUTER_LENGTH = 2 * Math.PI * 250;
const CIRCLE_INNER_LENGTH = 2 * Math.PI * 235;
// Arc from top clockwise: ~114° of circle → length ≈ 497
const ARC_PATH_LENGTH = 2 * Math.PI * 250 * (114 / 360);
// Tagline underline path length (quadratic bezier M 250 695 Q 400 690 550 695)
const UNDERLINE_PATH_LENGTH = 302;

// Corner L-shape path length (horizontal 30 + back 30 + vertical 30 = 90 per corner)
const CORNER_L_PATH_LENGTH = 90;

// Precision dots: scale-in delay 1.3s, stagger 0.1s, duration 0.3s, back.out(2)
const PRECISION_DOT_DELAY = 1.3;
const PRECISION_DOT_STAGGER = 0.1;
const PRECISION_DOT_DURATION = 0.3;
// Radar pulse: new pulse every 2.5s, scale 1→2, opacity 0.5→0
const RADAR_PULSE_DURATION = 1.2;
const RADAR_PULSE_REPEAT_DELAY = 1.3; // 1.2 + 1.3 = 2.5s between pulse starts
const RADAR_PULSE_INITIAL_DELAY = PRECISION_DOT_DELAY + PRECISION_DOT_DURATION; // after top dot appears

// Idle animations start after entrance completes (tagline + underline ~2.5s)
const ENTRANCE_DURATION = 2.5;
const TAGLINE_SPEED_MULTIPLIER = 0.1;

export interface ArkaAnimatedLogoProps {
  width?: number;
  height?: number;
  /** Master switch for all animations. When false, shows static logo. */
  animate?: boolean;
  /** When true (default), runs continuous idle animations after entrance. Set false for performance. */
  idleAnimations?: boolean;
  /** Animation speed multiplier (default 1). e.g. 2 = twice as fast. */
  animationSpeed?: number;
  /** Called when entrance animations finish (after tagline + underline). */
  onAnimationComplete?: () => void;
  className?: string;
}

export default function ArkaAnimatedLogo({
  width = 800,
  height = 900,
  animate = true,
  idleAnimations = true,
  animationSpeed = 1,
  onAnimationComplete,
  className,
}: ArkaAnimatedLogoProps) {
  const uid = useId().replace(/:/g, '');
  const prefix = `arka-${uid}-`;
  const prefersReducedMotion = useReducedMotion();
  const [isMounted, setMounted] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // No animations during SSR or until hydrated; respect prefers-reduced-motion.
  // When !isMounted we still use "entrance initial" state so Replay (remount) runs the full entrance.
  const shouldAnimate = animate && isMounted && prefersReducedMotion !== true;
  const useEntranceInitial = animate && !isMounted;
  const showInitial = shouldAnimate || useEntranceInitial;
  const idle = shouldAnimate && idleAnimations;
  const speed = Math.max(0.1, animationSpeed);
  const d = (duration: number) => duration / speed;
  const delay = (baseDelay: number) => baseDelay / speed;
  const taglineSpeed = Math.max(0.1, speed * TAGLINE_SPEED_MULTIPLIER);
  const dTagline = (duration: number) => duration / taglineSpeed;
  const taglineStartDelay = delay(ENTRANCE_DURATION + 0.2);

  return (
    <svg
      viewBox="0 0 800 900"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      width={width}
      height={height}
      className={className}
      data-animate={shouldAnimate}
      style={{ overflow: 'visible' }}
    >
      <motion.g
        style={{ transformOrigin: '400px 450px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
        animate={idle ? { scale: [1, 1.005, 1] } : { scale: 1 }}
        transition={
          idle
            ? {
                scale: {
                  duration: d(4),
                  repeat: Infinity,
                  delay: delay(ENTRANCE_DURATION),
                  ease: 'easeInOut',
                },
              }
            : {}
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

      {/* Background glow effect */}
      <circle cx={400} cy={380} r={280} fill={`url(#${prefix}glowEffect)`} />

      {/* Outer circle border (blue gradient): draw-on animation, does not rotate */}
      <motion.circle
        cx={400}
        cy={380}
        r={250}
        fill="none"
        stroke={`url(#${prefix}ringGradient1)`}
        strokeWidth={8}
        opacity={0.95}
        initial={showInitial ? { strokeDasharray: CIRCLE_OUTER_LENGTH, strokeDashoffset: CIRCLE_OUTER_LENGTH } : undefined}
        animate={
          shouldAnimate
            ? { strokeDasharray: CIRCLE_OUTER_LENGTH, strokeDashoffset: 0 }
            : showInitial ? { strokeDasharray: CIRCLE_OUTER_LENGTH, strokeDashoffset: CIRCLE_OUTER_LENGTH } : undefined
        }
        transition={
          shouldAnimate
            ? { duration: d(1.0), delay: delay(0.2), ease: 'easeInOut' }
            : {}
        }
        style={showInitial ? { strokeDasharray: CIRCLE_OUTER_LENGTH } : undefined}
      />
      {/* White outer ring: own animation, AFTER spear (delay 1.05), clearly visible */}
      <motion.circle
        cx={400}
        cy={380}
        r={252}
        fill="none"
        stroke="#FFFFFF"
        strokeWidth={6}
        initial={showInitial ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }}
        animate={
          shouldAnimate
            ? { opacity: 1, scale: 1 }
            : showInitial ? { opacity: 0, scale: 0.97 } : { opacity: 1, scale: 1 }
        }
        transition={
          shouldAnimate
            ? { duration: d(0.5), delay: delay(1.05), ease: [0.16, 1, 0.3, 1] }
            : {}
        }
        style={{ transformOrigin: '400px 380px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
      />

      {/* outer-rings: inner ring + arc — draw-on then slow rotation */}
      <motion.g
        id="outer-rings"
        style={{ transformOrigin: '400px 380px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
        animate={
          idle ? { rotate: 360 } : { rotate: 0 }
        }
        transition={
          idle
            ? {
                rotate: {
                  duration: d(60),
                  repeat: Infinity,
                  ease: 'linear',
                  delay: delay(1.6), // after all rings drawn (arc ends at 0.8 + 0.8)
                },
              }
            : {}
        }
      >
        {/* Main ring (inner): draw-on 1.2s, delay 0.4s */}
        <motion.circle
          cx={400}
          cy={380}
          r={235}
          fill="none"
          stroke={`url(#${prefix}ringGradient1)`}
          strokeWidth={3}
          opacity={0.6}
          initial={showInitial ? { strokeDasharray: CIRCLE_INNER_LENGTH, strokeDashoffset: CIRCLE_INNER_LENGTH } : undefined}
          animate={
            shouldAnimate
              ? { strokeDasharray: CIRCLE_INNER_LENGTH, strokeDashoffset: 0 }
              : showInitial ? { strokeDasharray: CIRCLE_INNER_LENGTH, strokeDashoffset: CIRCLE_INNER_LENGTH } : undefined
          }
          transition={
            shouldAnimate
              ? { duration: d(1.2), delay: delay(0.4), ease: 'easeInOut' }
              : {}
          }
          style={showInitial ? { strokeDasharray: CIRCLE_INNER_LENGTH } : undefined}
        />
        {/* Cyan arc: draw from top clockwise, 0.8s, delay 0.8s */}
        <motion.path
          d="M 400 130 A 250 250 0 0 1 621 480"
          fill="none"
          stroke={`url(#${prefix}ringGradient2)`}
          strokeWidth={8}
          strokeLinecap="round"
          opacity={0.95}
          initial={showInitial ? { strokeDasharray: ARC_PATH_LENGTH, strokeDashoffset: ARC_PATH_LENGTH } : undefined}
          animate={
            shouldAnimate
              ? { strokeDasharray: ARC_PATH_LENGTH, strokeDashoffset: 0 }
              : showInitial ? { strokeDasharray: ARC_PATH_LENGTH, strokeDashoffset: ARC_PATH_LENGTH } : undefined
          }
          transition={
            shouldAnimate
              ? { duration: d(0.8), delay: delay(0.8), ease: 'easeInOut' }
              : {}
          }
          style={showInitial ? { strokeDasharray: ARC_PATH_LENGTH } : undefined}
        />
        {/* Traveling energy pulse along arc: 3px dot, 2.5s per loop, starts after arc draws (idle only) */}
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
      </motion.g>

      {/* inner-circle: main circle background */}
      <circle
        id="inner-circle"
        cx={400}
        cy={380}
        r={210}
        fill={`url(#${prefix}circleInner)`}
        filter={`url(#${prefix}dropShadow)`}
      />

      {/* medical-symbols: brain, CT, heart, DNA icons — fade-in then subtle float */}
      <g id="medical-symbols">
        {/* brain (top-left) */}
        <motion.g
          style={{ transformOrigin: '307.5px 300px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          initial={showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }}
          animate={
            shouldAnimate
              ? {
                  opacity: 0.15,
                  scale: 1,
                  y: [0, -3, 0],
                }
              : showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }
          }
          transition={
            shouldAnimate
              ? {
                  opacity: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 0 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  scale: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 0 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  y: {
                    duration: d(SYMBOL_FLOAT_DURATIONS[0]),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 0 * SYMBOL_STAGGER + SYMBOL_ENTRANCE_DURATION),
                    repeat: idle ? Infinity : 0,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
          <path
            d="M 320 280 Q 300 270 290 290 Q 285 310 300 320 Q 315 325 325 310 Q 328 295 320 280"
            fill="#5B9BD5"
          />
          <circle cx={315} cy={300} r={3} fill="#E8F4F8" />
          <circle cx={308} cy={295} r={2} fill="#E8F4F8" />
          <circle cx={310} cy={308} r={2} fill="#E8F4F8" />
        </motion.g>
        {/* CT waves (top-right) */}
        <motion.g
          style={{ transformOrigin: '482px 300px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          initial={showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }}
          animate={
            shouldAnimate
              ? {
                  opacity: 0.15,
                  scale: 1,
                  y: [0, -3, 0],
                }
              : showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }
          }
          transition={
            shouldAnimate
              ? {
                  opacity: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 1 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  scale: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 1 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  y: {
                    duration: d(SYMBOL_FLOAT_DURATIONS[1]),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 1 * SYMBOL_STAGGER + SYMBOL_ENTRANCE_DURATION),
                    repeat: idle ? Infinity : 0,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
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
        </motion.g>
        {/* heart (bottom-left) */}
        <motion.g
          style={{ transformOrigin: '310px 460px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          initial={showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }}
          animate={
            shouldAnimate
              ? {
                  opacity: 0.15,
                  scale: 1,
                  y: [0, -3, 0],
                }
              : showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }
          }
          transition={
            shouldAnimate
              ? {
                  opacity: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 2 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  scale: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 2 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  y: {
                    duration: d(SYMBOL_FLOAT_DURATIONS[2]),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 2 * SYMBOL_STAGGER + SYMBOL_ENTRANCE_DURATION),
                    repeat: idle ? Infinity : 0,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
          <path
            d="M 310 450 Q 305 440 295 445 Q 288 452 295 460 L 310 475 L 325 460 Q 332 452 325 445 Q 315 440 310 450"
            fill="#5B9BD5"
          />
        </motion.g>
        {/* DNA (bottom-right) */}
        <motion.g
          style={{ transformOrigin: '482px 460px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          initial={showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }}
          animate={
            shouldAnimate
              ? {
                  opacity: 0.15,
                  scale: 1,
                  y: [0, -3, 0],
                }
              : showInitial ? { opacity: 0, scale: 0.8, y: 0 } : { opacity: 0.15, scale: 1, y: 0 }
          }
          transition={
            shouldAnimate
              ? {
                  opacity: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 3 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  scale: {
                    duration: d(SYMBOL_ENTRANCE_DURATION),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 3 * SYMBOL_STAGGER),
                    ease: 'easeOut',
                  },
                  y: {
                    duration: d(SYMBOL_FLOAT_DURATIONS[3]),
                    delay: delay(SYMBOL_ENTRANCE_DELAY + 3 * SYMBOL_STAGGER + SYMBOL_ENTRANCE_DURATION),
                    repeat: idle ? Infinity : 0,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
          <circle cx={475} cy={455} r={5} fill="#5B9BD5" />
          <circle cx={490} cy={455} r={5} fill="#5B9BD5" />
          <circle cx={482} cy={470} r={5} fill="#5B9BD5" />
          <line x1={475} y1={455} x2={490} y2={455} stroke="#5B9BD5" strokeWidth={2} />
          <line x1={475} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
          <line x1={490} y1={455} x2={482} y2={470} stroke="#5B9BD5" strokeWidth={2} />
        </motion.g>
      </g>

      {/* letters-group: ARKA text (includes ct-scanner inside R) */}
      <g id="letters-group" filter={`url(#${prefix}letterGlow)`}>
        {/* Letter A */}
        <motion.g
          style={ANIMATED_STYLE}
          initial={
            showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }
          }
          animate={
            shouldAnimate ? { opacity: 1, y: 0 } : (showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 })
          }
          transition={
            shouldAnimate
              ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.5) }
              : {}
          }
        >
          <path
            d="M 205 420 L 245 320 L 270 320 L 310 420 L 285 420 L 277 395 L 238 395 L 230 420 Z M 245 375 L 270 375 L 257.5 340 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
        {/* Letter R with ct-scanner inside */}
        <motion.g
          style={ANIMATED_STYLE}
          initial={
            showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }
          }
          animate={
            shouldAnimate ? { opacity: 1, y: 0 } : (showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 })
          }
          transition={
            shouldAnimate
              ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.6) }
              : {}
          }
        >
          <path
            d="M 320 420 L 320 320 L 380 320 Q 400 320 410 335 Q 415 345 415 362 Q 415 379 405 389 Q 398 394 388 396 L 418 420 L 393 420 L 368 398 L 345 398 L 345 420 L 320 420 Z M 345 342 L 345 378 L 378 378 Q 388 378 393 370 Q 396 362 393 354 Q 388 346 378 346 L 345 342 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
          {/* ct-scanner: scale in after R, then continuous animations */}
          <motion.g
            id="ct-scanner"
            initial={
              showInitial ? { opacity: 0.7, scale: 0 } : { opacity: 0.7, scale: 1 }
            }
            animate={
              shouldAnimate ? { opacity: 0.7, scale: 1 } : (showInitial ? { opacity: 0.7, scale: 0 } : { opacity: 0.7, scale: 1 })
            }
            transition={
              shouldAnimate
                ? {
                    scale: { duration: d(0.5), ease: 'easeOut', delay: delay(1.1) },
                    opacity: { duration: 0, delay: delay(1.1) },
                  }
                : {}
            }
            style={{ transformOrigin: '371px 362px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          >
            {/* 3 concentric rings: pulse (1.0 → 1.05 → 1.0), 1.5s, infinite when idle, stagger 0.2s */}
            <motion.circle
              cx={371}
              cy={362}
              r={13}
              fill="none"
              stroke="#00D9FF"
              strokeWidth={1.5}
              animate={
                idle ? { scale: [1, 1.05, 1] } : { scale: 1 }
              }
              transition={
                idle
                  ? {
                      scale: {
                        duration: d(1.5),
                        repeat: Infinity,
                        delay: delay(1.1 + 0),
                        ease: 'easeInOut',
                      },
                    }
                  : {}
              }
              style={{ transformOrigin: '371px 362px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
            />
            <motion.circle
              cx={371}
              cy={362}
              r={9}
              fill="none"
              stroke="#00D9FF"
              strokeWidth={1}
              animate={
                idle ? { scale: [1, 1.05, 1] } : { scale: 1 }
              }
              transition={
                idle
                  ? {
                      scale: {
                        duration: d(1.5),
                        repeat: Infinity,
                        delay: delay(1.1 + 0.2),
                        ease: 'easeInOut',
                      },
                    }
                  : {}
              }
              style={{ transformOrigin: '371px 362px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
            />
            <motion.circle
              cx={371}
              cy={362}
              r={5}
              fill="none"
              stroke="#00D9FF"
              strokeWidth={0.8}
              animate={
                idle ? { scale: [1, 1.05, 1] } : { scale: 1 }
              }
              transition={
                idle
                  ? {
                      scale: {
                        duration: d(1.5),
                        repeat: Infinity,
                        delay: delay(1.1 + 0.4),
                        ease: 'easeInOut',
                      },
                    }
                  : {}
              }
              style={{ transformOrigin: '371px 362px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
            />
            {/* center dot: pulse opacity 0.8 → 1.0 → 0.8, 1s, infinite when idle */}
            <motion.circle
              cx={371}
              cy={362}
              r={1.5}
              fill="#00D9FF"
              animate={
                idle
                  ? { opacity: [0.8, 1, 0.8] }
                  : { opacity: 0.8 }
              }
              transition={
                idle
                  ? {
                      opacity: {
                        duration: d(1),
                        repeat: Infinity,
                        delay: delay(1.1),
                        ease: 'easeInOut',
                      },
                    }
                  : {}
              }
              style={ANIMATED_STYLE}
            />
            {/* scan line: rotate 360°, 3s, linear, infinite when idle (starts after R/CT appears) */}
            <motion.line
              x1={371}
              y1={362}
              x2={381}
              y2={354}
              stroke="#00D9FF"
              strokeWidth={1.5}
              opacity={0.8}
              animate={
                idle ? { rotate: [0, 360] } : { rotate: 0 }
              }
              transition={
                idle
                  ? {
                      rotate: {
                        duration: d(3),
                        repeat: Infinity,
                        delay: delay(1.1),
                        ease: 'linear',
                      },
                    }
                  : {}
              }
              style={{ transformOrigin: '371px 362px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
            />
          </motion.g>
        </motion.g>
        {/* Letter K */}
        <motion.g
          style={ANIMATED_STYLE}
          initial={
            showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }
          }
          animate={
            shouldAnimate ? { opacity: 1, y: 0 } : (showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 })
          }
          transition={
            shouldAnimate
              ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.7) }
              : {}
          }
        >
          <path
            d="M 405 420 L 405 320 L 430 320 L 430 365 L 465 320 L 495 320 L 455 370 L 500 420 L 470 420 L 440 380 L 430 390 L 430 420 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
        {/* Letter A (second) */}
        <motion.g
          style={ANIMATED_STYLE}
          initial={
            showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }
          }
          animate={
            shouldAnimate ? { opacity: 1, y: 0 } : (showInitial ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 })
          }
          transition={
            shouldAnimate
              ? { duration: d(0.5), ease: 'easeOut', delay: delay(0.8) }
              : {}
          }
        >
          <path
            d="M 490 420 L 530 320 L 555 320 L 595 420 L 570 420 L 562 395 L 523 395 L 515 420 Z M 530 375 L 555 375 L 542.5 340 Z"
            fill={`url(#${prefix}letterGradient)`}
            filter={`url(#${prefix}textShadow)`}
          />
        </motion.g>
      </g>

      {/* spear-group: Gungnir spear (enters bottom to top) */}
      <motion.g
        id="spear-group"
        filter={`url(#${prefix}dropShadow)`}
        style={{ ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
        initial={
          showInitial
            ? { opacity: 0, y: '100%', scale: 1.02 }
            : { opacity: 1, y: 0, scale: 1 }
        }
        animate={
          shouldAnimate
            ? {
                opacity: [0, 1, 1],
                y: ['100%', 0, 0],
                scale: [1.02, 1.02, 1],
              }
            : showInitial ? { opacity: 0, y: '100%', scale: 1.02 } : { opacity: 1, y: 0, scale: 1 }
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
        <motion.circle
          cx={400}
          cy={250}
          r={6}
          fill="#00D9FF"
          initial={{ opacity: 0.8 }}
          animate={
            idle
              ? { opacity: [0.6, 1, 0.6] }
              : { opacity: 0.8 }
          }
          transition={
            idle
              ? {
                  duration: d(2),
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: delay(0.95),
                }
              : {}
          }
          style={ANIMATED_STYLE}
        />
        <motion.circle
          cx={400}
          cy={510}
          r={6}
          fill="#5B9BD5"
          initial={{ opacity: 0.8 }}
          animate={
            idle
              ? { opacity: [0.6, 1, 0.6] }
              : { opacity: 0.8 }
          }
          transition={
            idle
              ? {
                  duration: d(2),
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: delay(0.95),
                }
              : {}
          }
          style={ANIMATED_STYLE}
        />
      </motion.g>

      {/* corner-markers: L-shaped corner elements — draw-on stroke, all 4 corners simultaneously, delay 1s, duration 0.4s, then opacity 0.3 */}
      <g id="corner-markers">
        <motion.path
          d="M 150 130 L 180 130 L 150 130 L 150 160"
          fill="none"
          stroke="#5B9BD5"
          strokeWidth={2}
          initial={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH, strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }}
          animate={
            shouldAnimate
              ? { strokeDashoffset: 0, opacity: 0.3 }
              : showInitial ? { strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }
          }
          transition={
            shouldAnimate
              ? {
                  strokeDashoffset: { duration: d(0.4), delay: delay(1.0), ease: 'easeInOut' },
                  opacity: { duration: 0, delay: delay(1.0 + 0.4) },
                }
              : {}
          }
          style={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH } : undefined}
        />
        <motion.path
          d="M 650 130 L 620 130 L 650 130 L 650 160"
          fill="none"
          stroke="#00D9FF"
          strokeWidth={2}
          initial={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH, strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }}
          animate={
            shouldAnimate
              ? { strokeDashoffset: 0, opacity: 0.3 }
              : showInitial ? { strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }
          }
          transition={
            shouldAnimate
              ? {
                  strokeDashoffset: { duration: d(0.4), delay: delay(1.0), ease: 'easeInOut' },
                  opacity: { duration: 0, delay: delay(1.0 + 0.4) },
                }
              : {}
          }
          style={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH } : undefined}
        />
        <motion.path
          d="M 150 630 L 180 630 L 150 630 L 150 600"
          fill="none"
          stroke="#5B9BD5"
          strokeWidth={2}
          initial={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH, strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }}
          animate={
            shouldAnimate
              ? { strokeDashoffset: 0, opacity: 0.3 }
              : showInitial ? { strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }
          }
          transition={
            shouldAnimate
              ? {
                  strokeDashoffset: { duration: d(0.4), delay: delay(1.0), ease: 'easeInOut' },
                  opacity: { duration: 0, delay: delay(1.0 + 0.4) },
                }
              : {}
          }
          style={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH } : undefined}
        />
        <motion.path
          d="M 650 630 L 620 630 L 650 630 L 650 600"
          fill="none"
          stroke="#00D9FF"
          strokeWidth={2}
          initial={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH, strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }}
          animate={
            shouldAnimate
              ? { strokeDashoffset: 0, opacity: 0.3 }
              : showInitial ? { strokeDashoffset: CORNER_L_PATH_LENGTH, opacity: 1 } : { opacity: 0.3 }
          }
          transition={
            shouldAnimate
              ? {
                  strokeDashoffset: { duration: d(0.4), delay: delay(1.0), ease: 'easeInOut' },
                  opacity: { duration: 0, delay: delay(1.0 + 0.4) },
                }
              : {}
          }
          style={showInitial ? { strokeDasharray: CORNER_L_PATH_LENGTH } : undefined}
        />
      </g>

      {/* precision-dots: small targeting dots — scale in 0→1, delay 1.3s, stagger 0.1s, duration 0.3s, back.out(2) */}
      <g id="precision-dots" opacity={0.4} stroke="#5B9BD5" strokeWidth={2}>
        <line x1={400} y1={120} x2={400} y2={130} />
        <line x1={640} y1={380} x2={650} y2={380} />
        <line x1={150} y1={380} x2={160} y2={380} />
        {/* Top-center dot + radar pulse ring */}
        <g>
          {/* Radar pulse: ring expands scale 1→2, opacity 0.5→0, new pulse every 2.5s (idle only) */}
          {idle && (
            <motion.circle
              cx={400}
              cy={125}
              r={8}
              fill="none"
              stroke="#00D9FF"
              strokeWidth={1.5}
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{
                duration: d(RADAR_PULSE_DURATION),
                repeat: Infinity,
                repeatDelay: d(RADAR_PULSE_REPEAT_DELAY),
                delay: delay(RADAR_PULSE_INITIAL_DELAY),
                ease: 'easeOut',
              }}
              style={{ transformOrigin: '400px 125px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
            />
          )}
          <motion.circle
            cx={400}
            cy={125}
            r={3}
            fill="#00D9FF"
            initial={showInitial ? { scale: 0 } : { scale: 1 }}
            animate={shouldAnimate ? { scale: 1 } : (showInitial ? { scale: 0 } : { scale: 1 })}
            transition={
              shouldAnimate
                ? {
                    duration: d(PRECISION_DOT_DURATION),
                    delay: delay(PRECISION_DOT_DELAY + 0 * PRECISION_DOT_STAGGER),
                    ease: [0.34, 1.8, 0.64, 1] as const, // back.out(2) pop
                  }
                : {}
            }
            style={{ transformOrigin: '400px 125px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
          />
        </g>
        <motion.circle
          cx={155}
          cy={380}
          r={3}
          fill="#00D9FF"
          initial={showInitial ? { scale: 0 } : { scale: 1 }}
          animate={shouldAnimate ? { scale: 1 } : (showInitial ? { scale: 0 } : { scale: 1 })}
          transition={
            shouldAnimate
              ? {
                  duration: d(PRECISION_DOT_DURATION),
                  delay: delay(PRECISION_DOT_DELAY + 1 * PRECISION_DOT_STAGGER),
                  ease: [0.34, 1.8, 0.64, 1] as const,
                }
              : {}
          }
          style={{ transformOrigin: '155px 380px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
        />
        <motion.circle
          cx={645}
          cy={380}
          r={3}
          fill="#00D9FF"
          initial={showInitial ? { scale: 0 } : { scale: 1 }}
          animate={shouldAnimate ? { scale: 1 } : (showInitial ? { scale: 0 } : { scale: 1 })}
          transition={
            shouldAnimate
              ? {
                  duration: d(PRECISION_DOT_DURATION),
                  delay: delay(PRECISION_DOT_DELAY + 2 * PRECISION_DOT_STAGGER),
                  ease: [0.34, 1.8, 0.64, 1] as const,
                }
              : {}
          }
          style={{ transformOrigin: '645px 380px', ...ANIMATED_STYLE, ...GPU_LAYER_STYLE }}
        />
      </g>
      </motion.g>

      {/* tagline-group: "remARKAbly precise" — centered below, 0.1x speed, sequentially LAST */}
      <g id="tagline-group">
        <motion.text
          x={400}
          y={680}
          fontFamily="Georgia, serif"
          fontSize={46}
          fontStyle="italic"
          fill="#FFFFFF"
          textAnchor="middle"
          letterSpacing={1}
          style={{ ...ANIMATED_STYLE, transformOrigin: '400px 680px' }}
          initial={showInitial ? { opacity: 0, scale: 0.98 } : { opacity: 1, scale: 1 }}
          animate={
            shouldAnimate
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: 1 }
          }
          transition={
            shouldAnimate
              ? {
                  opacity: { duration: dTagline(1.0), delay: taglineStartDelay, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: dTagline(1.0), delay: taglineStartDelay, ease: [0.16, 1, 0.3, 1] },
                }
              : {}
          }
        >
          rem
          <motion.tspan
            fill="#00D9FF"
            fontWeight="bold"
            initial={shouldAnimate ? { filter: 'brightness(1)' } : undefined}
            animate={
              idle
                ? { filter: ['brightness(1)', 'brightness(1.1)', 'brightness(1)'] }
                : undefined
            }
            transition={
              idle
                ? {
                    duration: d(3),
                    repeat: Infinity,
                    delay: delay(ENTRANCE_DURATION),
                    ease: 'easeInOut',
                  }
                : {}
            }
          >
            ARKA
          </motion.tspan>
          bly precise
        </motion.text>
        <motion.path
          d="M 250 695 Q 400 690 550 695"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={2}
          fill="none"
          opacity={0.8}
          initial={
            showInitial
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
              : showInitial ? { strokeDasharray: UNDERLINE_PATH_LENGTH, strokeDashoffset: UNDERLINE_PATH_LENGTH } : undefined
          }
          transition={
            shouldAnimate
              ? {
                  duration: dTagline(0.5),
                  delay: taglineStartDelay + dTagline(1.0) + dTagline(0.2),
                  ease: 'easeOut',
                }
              : {}
          }
          style={
            showInitial ? { strokeDasharray: UNDERLINE_PATH_LENGTH } : undefined
          }
          onAnimationComplete={shouldAnimate ? onAnimationComplete : undefined}
        />
      </g>
    </svg>
  );
}
