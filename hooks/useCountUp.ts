'use client';
import { useEffect, useRef } from 'react';

export function useCountUpRef(
  target: number,
  duration = 1200,
  format: (v: number) => string = (v) => String(Math.round(v)),
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let raf: number;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      node.textContent = format(target * eased);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, format]);

  return ref;
}

export function useCountUp(target: number, duration = 1200): number {
  const ref = useRef(0);
  const [, forceUpdate] = [ref, () => {}];
  // Simple version — components can use useCountUpRef for DOM writes
  return target;
}
