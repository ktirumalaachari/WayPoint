import { useState, useEffect, useRef } from 'react';

/**
 * Animated count-up number effect — e.g. 0 → 71% readiness score reveal.
 * @param {number} end - Target number
 * @param {number} duration - Animation duration in ms (default 1500)
 * @param {boolean} enabled - Whether to animate
 * @param {number} start - Starting number (default 0)
 * @returns {number} Current animated value
 */
export function useCountUp(end, duration = 1500, enabled = true, start = 0) {
  const [value, setValue] = useState(enabled ? start : end);
  const startTime = useRef(null);
  const rafId = useRef(null);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }

    setValue(start);
    startTime.current = null;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);

      // Ease out cubic for a satisfying deceleration
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      }
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [end, duration, enabled, start]);

  return value;
}
