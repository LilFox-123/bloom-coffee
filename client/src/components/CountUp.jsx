import { useEffect, useRef, useState } from 'react';

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Animates a numeric value from 0 → target on mount.
 * `format` maps the current numeric value to the displayed string.
 */
export default function CountUp({ value = 0, duration = 1200, format = (n) => n.toLocaleString('vi-VN'), className = '' }) {
  const [display, setDisplay] = useState(prefersReduced() ? value : 0);
  const rafRef = useRef();

  useEffect(() => {
    if (prefersReduced()) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(value);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return <span className={className}>{format(Math.floor(display))}</span>;
}
