"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useState } from "react";
import type {
  RovikExpression,
  RovikPersonality,
} from "@/lib/demo-types";

type RovikFaceProps = {
  expression: RovikExpression;
  personality?: RovikPersonality;
  amplitude?: number;
};

type FacePalette = {
  primary: string;
  secondary: string;
  glow: string;
  aura: string;
  error: string;
};

const expressionLabel: Record<RovikExpression, string> = {
  idle: "Idle",
  listening: "Listening",
  thinking: "Thinking",
  speaking: "Speaking",
  success: "Success",
  confused: "Confused",
  error: "Error",
};

const facePalette: Record<RovikPersonality, FacePalette> = {
  professional: {
    primary: "#53ddff",
    secondary: "#2d91ff",
    glow: "rgba(83, 221, 255, 0.34)",
    aura: "rgba(83, 221, 255, 0.18)",
    error: "#ff6b86",
  },
  friendly: {
    primary: "#59f0db",
    secondary: "#21b6c7",
    glow: "rgba(89, 240, 219, 0.36)",
    aura: "rgba(89, 240, 219, 0.18)",
    error: "#ff7585",
  },
  minimalist: {
    primary: "#8de9ff",
    secondary: "#56a9ff",
    glow: "rgba(141, 233, 255, 0.28)",
    aura: "rgba(141, 233, 255, 0.14)",
    error: "#ff6f7f",
  },
  coach: {
    primary: "#6af0c8",
    secondary: "#2ccca0",
    glow: "rgba(106, 240, 200, 0.34)",
    aura: "rgba(106, 240, 200, 0.18)",
    error: "#ff6a7c",
  },
  researcher: {
    primary: "#6fd3ff",
    secondary: "#3c8cff",
    glow: "rgba(111, 211, 255, 0.34)",
    aura: "rgba(111, 211, 255, 0.16)",
    error: "#ff7a8f",
  },
};

function useBlink(enabled: boolean) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleBlink = () => {
      const delay = 2200 + Math.random() * 2400;

      blinkTimer = setTimeout(() => {
        setIsBlinking(true);

        resetTimer = setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 150);
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkTimer) {
        clearTimeout(blinkTimer);
      }

      if (resetTimer) {
        clearTimeout(resetTimer);
      }
    };
  }, [enabled]);

  return enabled && isBlinking;
}

export function RovikFace({
  expression,
  personality = "professional",
  amplitude = 0.6,
}: RovikFaceProps) {
  const reduceMotion = useReducedMotion();
  const isBlinking = useBlink(!reduceMotion);
  const glowId = useId().replace(/:/g, "");
  const screenGlowId = useId().replace(/:/g, "");
  const palette = facePalette[personality];
  const accent = expression === "error" ? palette.error : palette.primary;
  const accentSoft = expression === "error" ? palette.error : palette.secondary;
  const mouthHeight = 8 + Math.round(amplitude * 12);

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className="relative h-[8.8rem] w-[12rem] rounded-[2.15rem] border border-white/20 bg-[linear-gradient(180deg,rgba(249,251,255,0.98),rgba(218,225,235,0.94))] p-[0.6rem] shadow-[0_24px_54px_rgba(0,0,0,0.22),inset_0_-12px_18px_rgba(7,18,29,0.08),inset_0_1px_0_rgba(255,255,255,0.94)]"
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -2, 0],
                rotate: [0, 0.4, 0, -0.4, 0],
              }
        }
        transition={{
          duration: 5.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div
          className="absolute inset-x-[21%] -bottom-4 h-6 rounded-full blur-xl"
          style={{ backgroundColor: palette.aura }}
        />

        <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] border border-white/8 bg-[radial-gradient(circle_at_22%_16%,rgba(255,255,255,0.05),transparent_24%),linear-gradient(180deg,#01050c_0%,#040b14_100%)]">
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                expression === "error"
                  ? "radial-gradient(circle at 50% 30%, rgba(255,93,122,0.16), transparent 38%)"
                  : `radial-gradient(circle at 50% 30%, ${palette.aura}, transparent 42%)`,
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity:
                      expression === "thinking"
                        ? [0.22, 0.42, 0.22]
                        : expression === "listening"
                          ? [0.28, 0.54, 0.28]
                          : [0.18, 0.3, 0.18],
                  }
            }
            transition={{
              duration: expression === "thinking" ? 1.4 : 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute inset-y-0 left-[-38%] w-[42%] skew-x-[-20deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)]"
            animate={reduceMotion ? undefined : { x: ["0%", "255%"] }}
            transition={{
              duration: expression === "listening" ? 1.5 : 2.4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            style={{ opacity: expression === "listening" ? 0.8 : 0.25 }}
          />

          <svg
            viewBox="0 0 180 120"
            className="relative h-full w-full"
            role="img"
            aria-label={`Rovik face ${expressionLabel[expression].toLowerCase()}`}
          >
            <defs>
              <linearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={accent} />
                <stop offset="100%" stopColor={accentSoft} />
              </linearGradient>
              <filter id={screenGlowId} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4.5" result="blur" />
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
                />
              </filter>
            </defs>

            <motion.g
              animate={
                reduceMotion || expression !== "thinking"
                  ? undefined
                  : { x: [-1.5, 1.5, -1.5] }
              }
              transition={{
                duration: 1.2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <Eyes
                expression={expression}
                blink={isBlinking}
                accent={accent}
                gradientId={glowId}
                glowId={screenGlowId}
                reduceMotion={Boolean(reduceMotion)}
              />
              <Mouth
                expression={expression}
                accent={accent}
                gradientId={glowId}
                mouthHeight={mouthHeight}
                reduceMotion={Boolean(reduceMotion)}
              />
              <Extras
                expression={expression}
                accent={accent}
                reduceMotion={Boolean(reduceMotion)}
              />
            </motion.g>
          </svg>
        </div>
      </motion.div>

      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.24em] text-white/42">
          Rovik expression
        </p>
        <p className="mt-2 text-sm text-white/68">{expressionLabel[expression]}</p>
      </div>
    </div>
  );
}

function Eyes({
  expression,
  blink,
  accent,
  gradientId,
  glowId,
  reduceMotion,
}: {
  expression: RovikExpression;
  blink: boolean;
  accent: string;
  gradientId: string;
  glowId: string;
  reduceMotion: boolean;
}) {
  const sharedTransition = {
    duration: 0.9,
    ease: "easeInOut" as const,
  };

  if (expression === "listening") {
    return (
      <>
        {[58, 122].map((cx, index) => (
          <motion.g
            key={cx}
            style={{ transformOrigin: `${cx}px 48px` }}
            animate={
              reduceMotion
                ? undefined
                : {
                    scale: [1, 1.18, 1],
                    opacity: [0.9, 1, 0.9],
                  }
            }
            transition={{
              duration: 1.05,
              delay: index * 0.08,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <circle cx={cx} cy={48} r={10} fill={accent} filter={`url(#${glowId})`} />
            <circle cx={cx} cy={48} r={6.5} fill={`url(#${gradientId})`} />
          </motion.g>
        ))}
      </>
    );
  }

  if (expression === "thinking") {
    return (
      <>
        {[58, 122].map((cx) => (
          <motion.g
            key={cx}
            style={{ transformOrigin: `${cx}px 48px` }}
            animate={blink ? { scaleY: 0.18 } : { scaleY: 1 }}
            transition={sharedTransition}
          >
            <rect
              x={cx - 16}
              y={44}
              width={32}
              height={8}
              rx={4}
              fill={`url(#${gradientId})`}
              filter={`url(#${glowId})`}
            />
          </motion.g>
        ))}
      </>
    );
  }

  if (expression === "speaking") {
    return (
      <>
        {[58, 122].map((cx) => (
          <motion.g
            key={cx}
            style={{ transformOrigin: `${cx}px 47px` }}
            animate={blink ? { scaleY: 0.2 } : { scaleY: 1 }}
            transition={sharedTransition}
          >
            <rect
              x={cx - 15}
              y={43}
              width={30}
              height={8}
              rx={4}
              fill={`url(#${gradientId})`}
              filter={`url(#${glowId})`}
            />
          </motion.g>
        ))}
      </>
    );
  }

  if (expression === "success") {
    return (
      <>
        {[48, 112].map((x) => (
          <motion.path
            key={x}
            d={`M${x} 52 Q ${x + 10} 38 ${x + 24} 52`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            filter={`url(#${glowId})`}
            animate={reduceMotion ? undefined : { y: [0, -1, 0] }}
            transition={{
              duration: 1.6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </>
    );
  }

  if (expression === "confused") {
    return (
      <>
        <motion.rect
          x={42}
          y={44}
          width={34}
          height={8}
          rx={4}
          fill={`url(#${gradientId})`}
          filter={`url(#${glowId})`}
          style={{ transformOrigin: "59px 48px" }}
          animate={{
            scaleY: blink ? 0.24 : 1,
            rotate: -10,
          }}
          transition={sharedTransition}
        />
        <motion.rect
          x={105}
          y={44}
          width={30}
          height={8}
          rx={4}
          fill={`url(#${gradientId})`}
          filter={`url(#${glowId})`}
          style={{ transformOrigin: "120px 48px" }}
          animate={{
            scaleY: blink ? 0.24 : 1,
            rotate: 8,
          }}
          transition={sharedTransition}
        />
      </>
    );
  }

  if (expression === "error") {
    return (
      <>
        <motion.path
          d="M44 57 L73 44"
          fill="none"
          stroke={accent}
          strokeWidth="7"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          animate={reduceMotion ? undefined : { x: [0, -1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
        <motion.path
          d="M107 44 L136 57"
          fill="none"
          stroke={accent}
          strokeWidth="7"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
          animate={reduceMotion ? undefined : { x: [0, 1, 0] }}
          transition={{
            duration: 0.8,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </>
    );
  }

  return (
    <>
      {[58, 122].map((cx) => (
        <motion.g
          key={cx}
          style={{ transformOrigin: `${cx}px 46px` }}
          animate={blink ? { scaleY: 0.14 } : { scaleY: 1 }}
          transition={sharedTransition}
        >
          <rect
            x={cx - 6}
            y={30}
            width={12}
            height={34}
            rx={6}
            fill={`url(#${gradientId})`}
            filter={`url(#${glowId})`}
          />
        </motion.g>
      ))}
    </>
  );
}

function Mouth({
  expression,
  accent,
  gradientId,
  mouthHeight,
  reduceMotion,
}: {
  expression: RovikExpression;
  accent: string;
  gradientId: string;
  mouthHeight: number;
  reduceMotion: boolean;
}) {
  if (expression === "speaking") {
    return (
      <motion.rect
        x="75"
        y="77"
        width="30"
        height={mouthHeight}
        rx="8"
        fill={`url(#${gradientId})`}
        animate={
          reduceMotion
            ? undefined
            : {
                height: [8, mouthHeight, 10, mouthHeight - 2, 8],
                y: [81, 77, 80, 78, 81],
              }
        }
        transition={{
          duration: 0.64,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    );
  }

  if (expression === "success") {
    return (
      <motion.path
        d="M68 82 Q 90 96 112 82"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        animate={reduceMotion ? undefined : { pathLength: [0.92, 1, 0.92] }}
        transition={{
          duration: 1.4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    );
  }

  if (expression === "confused") {
    return (
      <motion.path
        d="M76 84 Q 90 78 104 84"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        animate={reduceMotion ? undefined : { y: [0, 1.5, 0] }}
        transition={{
          duration: 1.2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
    );
  }

  if (expression === "error") {
    return (
      <path
        d="M76 86 L104 86"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
      />
    );
  }

  return (
    <path
      d="M80 84 L100 84"
      fill="none"
      stroke={`url(#${gradientId})`}
      strokeWidth="5"
      strokeLinecap="round"
      opacity="0.92"
    />
  );
}

function Extras({
  expression,
  accent,
  reduceMotion,
}: {
  expression: RovikExpression;
  accent: string;
  reduceMotion: boolean;
}) {
  if (expression === "confused") {
    return (
      <motion.text
        x="140"
        y="38"
        fontSize="18"
        fontWeight="700"
        fill={accent}
        animate={reduceMotion ? undefined : { y: [38, 34, 38] }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        ?
      </motion.text>
    );
  }

  if (expression === "thinking") {
    return (
      <>
        {[0, 1, 2].map((index) => (
          <motion.circle
            key={index}
            cx={74 + index * 16}
            cy="24"
            r="2.4"
            fill={accent}
            animate={
              reduceMotion
                ? undefined
                : {
                    opacity: [0.25, 0.95, 0.25],
                    cy: [24, 20, 24],
                  }
            }
            transition={{
              duration: 1.05,
              delay: index * 0.12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </>
    );
  }

  if (expression === "listening") {
    return (
      <motion.circle
        cx="90"
        cy="60"
        r="39"
        fill="none"
        stroke={accent}
        strokeWidth="1.4"
        strokeDasharray="5 7"
        opacity="0.35"
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        style={{ transformOrigin: "90px 60px" }}
      />
    );
  }

  return null;
}
