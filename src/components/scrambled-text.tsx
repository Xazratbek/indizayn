"use client";

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useInView } from 'framer-motion';

// This is a simplified version that doesn't rely on SplitText or hover effects
// but uses a simple scramble-on-view animation.
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
  scrambleChars = "*#?@!_",
  speed = 0.5,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const animation = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    // ScrambleTextPlugin needs to be registered. Assuming it's done elsewhere or here.
    if (!gsap.plugins.scrambleText) {
        console.error("GSAP ScrambleTextPlugin is not registered.");
        return;
    }
    
    if (isInView && ref.current) {
      const originalText = ref.current.textContent || '';
      
      if (animation.current) {
        animation.current.kill();
      }

      animation.current = gsap.to(ref.current, {
        duration: duration,
        scrambleText: {
          text: originalText,
          chars: scrambleChars,
          speed: speed,
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
