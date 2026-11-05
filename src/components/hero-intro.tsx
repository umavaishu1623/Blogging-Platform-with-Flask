"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function HeroIntro({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="hero-content page-width"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      transition={{ duration: 0.65, ease: [0.2, 0.7, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}