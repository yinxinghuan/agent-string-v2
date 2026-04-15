import { useState, useEffect, useRef } from 'react';

const CHARS = '!@#$%&*_-+=?/\\|<>~^0123456789';

interface ScrambleTextProps {
  children: string;
  speed?: number;      // ms per step (default 30)
  delay?: number;      // ms before start (default 0)
  scrambleTicks?: number; // random ticks per char before settle (default 3)
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function ScrambleText({
  children: text,
  speed = 30,
  delay = 0,
  scrambleTicks = 3,
  className,
  as: Tag = 'span',
}: ScrambleTextProps) {
  const [display, setDisplay] = useState('');
  const rafRef = useRef(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const chars = Array.from(text);
    const len = chars.length;
    // Total ticks: each char needs scrambleTicks random + 1 settle
    const totalSteps = len * (scrambleTicks + 1);
    let step = 0;

    const timer = setTimeout(() => {
      const tick = () => {
        step++;
        // How many chars are fully settled
        const settled = Math.floor(step / (scrambleTicks + 1));
        const result: string[] = [];

        for (let i = 0; i < len; i++) {
          if (chars[i] === ' ' || chars[i] === '\n') {
            result.push(chars[i]);
          } else if (i < settled) {
            result.push(chars[i]);
          } else if (i === settled) {
            // Currently scrambling this char
            const tickInChar = step % (scrambleTicks + 1);
            if (tickInChar === scrambleTicks) {
              result.push(chars[i]);
            } else {
              result.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
            }
          } else {
            // Not yet reached — show random
            result.push(CHARS[Math.floor(Math.random() * CHARS.length)]);
          }
        }

        setDisplay(result.join(''));

        if (step < totalSteps) {
          rafRef.current = window.setTimeout(tick, speed);
        }
      };
      tick();
    }, delay);

    return () => {
      clearTimeout(timer);
      clearTimeout(rafRef.current);
    };
  }, [text, speed, delay, scrambleTicks]);

  return <Tag className={className}>{display || '\u00A0'}</Tag>;
}
