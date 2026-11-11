import { useEffect, useState } from "react";

/**
 * Returns `true` once the window has scrolled past `threshold` px.
 * rAF-throttled + passive listener so it's cheap to use in a fixed navbar.
 * Reads the initial scroll position on mount (handles reload-while-scrolled).
 */
export function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        setScrolled(window.scrollY > threshold);
      });
    };
    onScroll(); // sync initial state
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [threshold]);

  return scrolled;
}
