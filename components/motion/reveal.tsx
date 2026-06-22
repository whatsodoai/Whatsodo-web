'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface RevealProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

/**
 * Staggered entrance wrapper — wrap grid/list items with this and pass the
 * item's index so cards/rows cascade in instead of popping in all at once.
 */
export function Reveal({ children, index = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.5), ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Floating decorative blob — purely visual, sits behind content via
 * negative z-index/absolute positioning, animates with the `float`
 * keyframe defined in tailwind.config.ts.
 */
export function FloatingBlob({
  className,
  delay = false,
}: {
  className?: string;
  delay?: boolean;
}) {
  return <div className={`bg-blob ${delay ? 'animate-float-delay' : 'animate-float'} ${className ?? ''}`} />;
}
