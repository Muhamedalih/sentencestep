"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { TypingDemo } from "@/components/marketing/typing-demo";
import { fadeInUp, staggerChildren } from "@/lib/motion";

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 pt-16 pb-24 sm:pt-24 sm:pb-32">
      <div className="grid items-center gap-16 lg:grid-cols-2">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
          className="flex flex-col items-start gap-6"
        >
          <motion.span
            variants={fadeInUp}
            className="bg-brand-muted text-primary rounded-full px-4 py-1.5 text-sm font-medium"
          >
            English for Arabic speakers
          </motion.span>

          <motion.h1
            variants={fadeInUp}
            className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            Learn English, <span className="text-primary">letter by letter.</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-muted-foreground max-w-lg text-lg text-balance"
          >
            Looma turns real sentences, stories, and conversations into a focused typing practice —
            hear it, type it, feel it click.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-2 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link href="/learn">Start learning free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#modes">See how it works</a>
            </Button>
          </motion.div>

          <motion.p variants={fadeInUp} className="text-muted-foreground text-sm">
            No credit card required — try Normal, Stories, and Conversation lessons free.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <TypingDemo />
        </motion.div>
      </div>
    </section>
  );
}
