"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useJourneyDirection, type JourneyDirection } from "./ScrollJourney";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  replay?: boolean;
};

const revealVariants: Variants = {
  hidden: (direction: JourneyDirection) => ({
    opacity: 0,
    clipPath:
      direction === "up" ? "inset(16% 0 0 0)" : "inset(0 0 16% 0)",
  }),
  visible: {
    opacity: 1,
    clipPath: "inset(0 0 0 0)",
  },
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  replay = true,
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const direction = useJourneyDirection();

  return (
    <motion.div
      className={className}
      custom={direction}
      variants={shouldReduceMotion ? undefined : revealVariants}
      initial={shouldReduceMotion ? false : "hidden"}
      whileInView={shouldReduceMotion ? undefined : "visible"}
      viewport={{ once: !replay, amount: "some" }}
      transition={{
        duration: direction === "up" ? 0.46 : 0.62,
        delay: direction === "up" ? Math.min(delay * 0.25, 0.05) : delay,
        ease: direction === "up" ? [0.2, 0.82, 0.24, 1] : [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
