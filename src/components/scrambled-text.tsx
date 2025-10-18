"use client";

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { useInView } from 'framer-motion';

gsap.registerPlugin(ScrambleTextPlugin);

interface ScrambledTextProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  scrambleChars?: string;
  speed?: number;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  children,
  className,
  duration = 1.2,
  scrambleChars = ".:",
  speed = 0.5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const animation = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (isInView && ref.current) {
      const originalText = ref.current.textContent || '';
      
      // Clear any previous animation
      if (animation.current) {
        animation.current.kill();
      }

      // Start with scrambled text, then reveal
      animation.current = gsap.to(ref.current, {
        duration: duration,
        scrambleText: {
          text: originalText,
          chars: scrambleChars,
          speed: speed,
          revealDelay: 0.5,
          newClass: "is-revealed"
        },
        ease: 'none',
      });
    }

    return () => {
        if (animation.current) {
            animation.current.kill();
        }
    }
  }, [isInView, duration, scrambleChars, speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default ScrambledText;
