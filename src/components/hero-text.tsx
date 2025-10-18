"use client";

import { motion } from "framer-motion";

export default function HeroText() {
  return (
    <motion.h1
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="font-headline text-4xl md:text-7xl font-bold tracking-tighter text-foreground"
    >
      inDizayn-ga Xush Kelibsiz!
    </motion.h1>
  );
}