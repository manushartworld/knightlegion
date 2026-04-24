import React, { useMemo } from "react";

export default function Embers({ count = 28 }) {
  const embers = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 6,
      duration: 8 + Math.random() * 10,
      drift: (Math.random() - 0.5) * 80,
      size: 2 + Math.random() * 3,
      opacity: 0.4 + Math.random() * 0.6,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {embers.map((e, i) => (
        <span
          key={i}
          className="ember"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            opacity: e.opacity,
            animationDuration: `${e.duration}s`,
            animationDelay: `${e.delay}s`,
            "--drift": `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
