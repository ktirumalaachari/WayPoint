import { useState, useEffect, useRef } from 'react';

/**
 * Animated typewriter effect — simulates AI streaming responses.
 * @param {string} text - Full text to type out
 * @param {number} speed - ms per character (default 25)
 * @param {boolean} enabled - Whether to animate (false = show full text instantly)
 * @returns {{ displayText: string, isTyping: boolean }}
 */
export function useTypewriter(text, speed = 25, enabled = true) {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!enabled || !text) {
      setDisplayText(text || '');
      setIsTyping(false);
      return;
    }

    setDisplayText('');
    setIsTyping(true);
    let idx = 0;

    intervalRef.current = setInterval(() => {
      idx++;
      setDisplayText(text.slice(0, idx));
      if (idx >= text.length) {
        clearInterval(intervalRef.current);
        setIsTyping(false);
      }
    }, speed);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, enabled]);

  return { displayText, isTyping };
}
