'use client';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import {
  motion,
  AnimatePresence,
  Transition,
  VariantLabels,
  Target,
  TargetAndTransition
} from 'framer-motion';

function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface RotatingTextRef {
  next: () => void;
  previous: () => void;
  jumpTo: (index: number) => void;
  reset: () => void;
}

export interface RotatingTextProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof motion.span>,
    'children' | 'transition' | 'initial' | 'animate' | 'exit'
  > {
  texts: string[];
  transition?: Transition;
  initial?: boolean | Target | VariantLabels;
  animate?: boolean | VariantLabels | TargetAndTransition;
  exit?: Target | VariantLabels;
  animatePresenceMode?: 'sync' | 'popLayout' | 'wait';
  animatePresenceInitial?: boolean;
  rotationInterval?: number;
  staggerDuration?: number;
  staggerFrom?: 'first' | 'last' | 'center' | 'random' | number;
  loop?: boolean;
  auto?: boolean;
  splitBy?: 'characters' | 'words' | 'lines' | string;
  onNext?: (index: number) => void;
  mainClassName?: string;
  splitLevelClassName?: string;
  elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
  (
    {
      texts,
      transition = { type: 'spring', damping: 25, stiffness: 300 },
      initial = { y: '100%', opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: '-120%', opacity: 0 },
      animatePresenceMode = 'wait',
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0.05,
      staggerFrom = 'first',
      loop = true,
      auto = true,
      splitBy = 'characters',
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...rest
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
        return Array.from(segmenter.segment(text), segment => segment.segment);
      }
      return Array.from(text);
    };

    const elements = useMemo(() => {
      const currentText: string = texts[currentTextIndex];
      if (splitBy === 'characters') {
        const words = currentText.split(' ');
        return words.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== words.length - 1
        }));
      }
      if (splitBy === 'words') {
        return currentText.split(' ').map((word, i, arr) => ({
          characters: [word],
          needsSpace: i !== arr.length - 1
        }));
      }
      if (splitBy === 'lines') {
        return currentText.split('\n').map((line, i, arr) => ({
          characters: [line],
          needsSpace: i !== arr.length - 1
        }));
      }

      return currentText.split(splitBy).map((part, i, arr) => ({
        characters: [part],
        needsSpace: i !== arr.length - 1
      }));
    }, [texts, currentTextIndex, splitBy]);

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number): number => {
        const total = totalChars;
        if (staggerFrom === 'first') return index * staggerDuration;
        if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration;
        if (staggerFrom === 'center') {
          const center = Math.floor(total / 2);
          return Math.abs(center - index) * staggerDuration;
        }
        if (staggerFrom === 'random') {
          const randomIndex = Math.floor(Math.random() * total);
          return Math.abs(randomIndex - index) * staggerDuration;
        }
        return Math.abs((staggerFrom as number) - index) * staggerDuration;
      },
      [staggerFrom, staggerDuration]
    );

    const nextText = useCallback(() => {
      setCurrentTextIndex(prevIndex => {
        const nextIndex = prevIndex + 1;
        if (nextIndex >= texts.length) {
          if (loop) {
            onNext?.(0);
            return 0;
          }
          onNext?.(prevIndex);
          return prevIndex;
        }
        onNext?.(nextIndex);
        return nextIndex;
      });
    }, [texts.length, loop, onNext]);

    const previousText = useCallback(() => {
      setCurrentTextIndex(prevIndex => {
        const nextIndex = prevIndex - 1;
        if (nextIndex < 0) {
          if (loop) {
            onNext?.(texts.length - 1);
            return texts.length - 1;
          }
          onNext?.(prevIndex);
          return prevIndex;
        }
        onNext?.(nextIndex);
        return nextIndex;
      });
    }, [texts.length, loop, onNext]);

    const jumpTo = useCallback(
      (index: number) => {
        if (index >= 0 && index < texts.length) {
          setCurrentTextIndex(index);
          onNext?.(index);
        }
      },
      [texts.length, onNext]
    );

    const reset = useCallback(() => {
      setCurrentTextIndex(0);
      onNext?.(0);
    }, [onNext]);

    useImperativeHandle(ref, () => ({
      next: nextText,
      previous: previousText,
      jumpTo: jumpTo,
      reset: reset
    }));

    useEffect(() => {
      if (auto) {
        const interval = setInterval(nextText, rotationInterval);
        return () => clearInterval(interval);
      }
    }, [auto, rotationInterval, nextText]);

    return (
      <span className={cn('inline-block', mainClassName)} {...rest}>
        <AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
          <motion.span key={currentTextIndex} className="inline-flex">
            {elements.map((word, wordIndex) => (
              <React.Fragment key={wordIndex}>
                {word.characters.map((char, charIndex) => (
                  <motion.span
                    className={cn('inline-block', splitLevelClassName)}
                    key={charIndex}
                    initial={initial}
                    animate={animate}
                    exit={exit}
                    transition={{
                      ...transition,
                      delay: getStaggerDelay(charIndex, word.characters.length)
                    }}
                  >
                    <span className={elementLevelClassName}>{char}</span>
                  </motion.span>
                ))}
                {word.needsSpace && <span className="inline-block">&nbsp;</span>}
              </React.Fragment>
            ))}
          </motion.span>
        </AnimatePresence>
      </span>
    );
  }
);

RotatingText.displayName = 'RotatingText';
export default RotatingText;

    