"use client";

import { useEffect, useState } from "react";

const MESSAGES = [
  "принимаешь решения.",
  "переживаешь кризисы.",
  "строишь отношения.",
  "теряешь и находишь себя.",
];

export function FallingPills() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % MESSAGES.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="pill-zone relative z-10 mt-2">
      {/* Fixed text stage prevents layout movement during the crossfade. */}
      <div aria-live="polite" className="relative h-full mx-auto max-w-2xl">
        {MESSAGES.map((message, index) => (
          <p
            key={message}
            aria-hidden={index !== messageIndex}
            className="message-swap font-display absolute inset-0 flex items-start justify-center px-4 pt-2 text-center text-2xl leading-snug italic text-[#ff7b36] sm:text-3xl md:text-4xl lg:text-[2.35rem]"
            data-active={index === messageIndex}
          >
            {message}
          </p>
        ))}
      </div>
    </div>
  );
}
