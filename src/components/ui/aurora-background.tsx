"use client";

import React from "react";
import { motion } from "framer-motion";

export interface AuroraBackgroundProps {
  className?: string;
  children?: React.ReactNode;
  starCount?: number;
  gradientColors?: [string, string];
  pulseDuration?: number;
  ariaLabel?: string;
}

const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  className = "",
  children,
  starCount = 80,
  gradientColors = [
    "rgba(99, 102, 241, 0.20)",
    "rgba(139, 92, 246, 0.20)",
  ],
  pulseDuration = 8,
  ariaLabel = "Animated aurora background",
}) => {
  const [colorA, colorB] = gradientColors;

  return (
    <div
      aria-label={ariaLabel}
      className={`fixed inset-0 w-full h-full overflow-hidden bg-black text-slate-50 ${className}`}
      style={{
        zIndex: -10,
      }}
    >
      {/* ========================================================
          BACKGROUND LAYERS
         ======================================================== */}

      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {/* ======================================================
            PULSING RADIAL GRADIENTS
           ====================================================== */}

        <div
          className="absolute inset-0"
          style={{
            opacity: 0.55,

            backgroundImage: `
              radial-gradient(
                circle at 20% 20%,
                ${colorA} 0%,
                transparent 55%
              ),
              radial-gradient(
                circle at 80% 80%,
                ${colorB} 0%,
                transparent 55%
              )
            `,

            animation: `aurora-pulse ${pulseDuration}s ease-in-out infinite`,
          }}
        />

        {/* ======================================================
            ANIMATED AURORA BLOBS
           ====================================================== */}

        <motion.div
          className="absolute inset-0 mix-blend-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
          }}
        >
          {/* Purple blob */}

          <motion.div
            className="
              absolute
              -top-1/4
              -left-1/4
              w-1/2
              h-1/2
              rounded-full
              bg-purple-600
              blur-3xl
            "
            style={{
              opacity: 0.40,
            }}
            animate={{
              x: [-50, 50, -50],
              y: [-20, 20, -20],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />

          {/* Fuchsia blob */}

          <motion.div
            className="
              absolute
              -bottom-1/4
              -right-1/4
              w-1/2
              h-1/2
              rounded-full
              bg-fuchsia-600
              blur-3xl
            "
            style={{
              opacity: 0.40,
            }}
            animate={{
              x: [50, -50, 50],
              y: [20, -20, 20],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />

          {/* Indigo center blob */}

          <motion.div
            className="
              absolute
              top-1/3
              left-1/3
              w-1/3
              h-1/3
              rounded-full
              bg-indigo-700
              blur-3xl
            "
            style={{
              opacity: 0.30,
            }}
            animate={{
              x: [20, -20, 20],
              y: [-30, 30, -30],
              rotate: [0, 360, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 50,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* ======================================================
            STARS
           ====================================================== */}

        {Array.from({ length: starCount }).map((_, i) => {
          const x = Math.random() * 100;
          const y = Math.random() * 100;
          const duration = Math.random() * 3 + 2;
          const delay = Math.random() * 5;
          const maxOpacity = Math.random() * 0.8;

          return (
            <motion.div
              key={i}
              className="
                absolute
                w-[2px]
                h-[2px]
                rounded-full
                bg-white
              "
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: [
                  0,
                  maxOpacity,
                  0,
                ],
              }}
              transition={{
                duration,
                repeat: Infinity,
                delay,
                ease: "easeInOut",
              }}
            />
          );
        })}
      </div>

      {/* ========================================================
          OPTIONAL FOREGROUND CONTENT
         ======================================================== */}

      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
};

export default AuroraBackground;