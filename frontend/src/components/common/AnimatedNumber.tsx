import React, { useEffect, useRef } from 'react';
import { useMotionValue, animate } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number; // in seconds, default 1.2 (1200ms)
  decimals?: number;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  prefix = '',
  suffix = '',
  duration = 1.2,
  decimals = 2,
}) => {
  const count = useMotionValue(0);
  const elementRef = useRef<HTMLSpanElement>(null);

  const formatINR = (val: number, pref: string) => {
    if (pref === '₹') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val);
    }
    // fallback for other currencies
    return pref + new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(val);
  };

  useEffect(() => {
    // cubic-bezier equivalent to easeOutCubic: [0.33, 1, 0.68, 1]
    const controls = animate(count, value, {
      duration: duration,
      ease: [0.33, 1, 0.68, 1],
    });
    return () => controls.stop();
  }, [value, duration, count]);

  useEffect(() => {
    return count.on('change', (latest) => {
      if (elementRef.current) {
        elementRef.current.textContent = `${formatINR(latest, prefix)}${suffix}`;
      }
    });
  }, [count, prefix, suffix, decimals]);

  // Set initial text content on mount
  return (
    <span ref={elementRef} className="font-mono">
      {formatINR(value, prefix)}{suffix}
    </span>
  );
};

export default AnimatedNumber;
