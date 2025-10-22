
"use client"

import { useState, useEffect, RefObject } from 'react';

export const useIntersectionObserver = (
  elementRef: RefObject<Element>,
  options?: IntersectionObserverInit
): boolean => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Update state when element's intersection status changes
        setIsIntersecting(entry.isIntersecting);
      },
      { ...options }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
};
