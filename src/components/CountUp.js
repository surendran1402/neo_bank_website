import React, { useEffect, useRef, useState } from 'react';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * CountUp component
 * Props:
 * - value: number (target value)
 * - duration: ms (default 1000)
 * - decimals: number of fraction digits (default 2 for currency, 0 otherwise)
 * - currency: boolean to format as INR currency
 * - formatter: optional custom formatter function(number) => string
 * - className: optional class name
 */
const CountUp = ({
  value = 0,
  duration = 1500,
  decimals,
  currency = false,
  formatter,
  className
}) => {
  const [display, setDisplay] = useState(0);
  const startValueRef = useRef(0);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);
  // Start from 0 on first mount so it animates initially
  const prevValueRef = useRef(0);

  // Default decimals
  const fractionDigits = typeof decimals === 'number' ? decimals : (currency ? 2 : 0);

  const format = (num) => {
    if (typeof formatter === 'function') return formatter(num);
    if (currency) {
      try {
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: fractionDigits
        }).format(num);
      } catch {
        return `${num.toFixed(fractionDigits)}`;
      }
    }
    return num.toFixed(fractionDigits);
  };

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = Number(value) || 0;

    // If value unchanged, ensure display matches formatter and bail
    if (startValue === endValue) {
      setDisplay(endValue);
      return;
    }

    startValueRef.current = startValue;
    startTimeRef.current = null;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, duration <= 0 ? 1 : elapsed / duration);
      const eased = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * eased;
      setDisplay(current);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        prevValueRef.current = endValue;
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span className={className}>{format(display)}</span>
  );
};

export default CountUp;
