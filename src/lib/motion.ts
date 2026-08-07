import type { Transition, Variants } from "framer-motion";

export const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

export const transitions = {
  smooth: { duration: 0.4, ease: easeOut } satisfies Transition,
  snappy: { duration: 0.2, ease: easeOut } satisfies Transition,
  gentle: { duration: 0.6, ease: easeOut } satisfies Transition,
} as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.smooth },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.smooth },
};

export const staggerChildren: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: transitions.snappy },
};
