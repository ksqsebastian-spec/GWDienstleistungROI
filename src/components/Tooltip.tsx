"use client";

import { ReactNode, useState } from "react";

interface TooltipProps {
  children: ReactNode;
  text: string;
}

export default function Tooltip({ children, text }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-0.5 cursor-help border-b border-dotted border-text-dim"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-text text-surface text-[11px] leading-relaxed rounded-lg shadow-lg whitespace-normal w-56 z-50 pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-text" />
        </span>
      )}
    </span>
  );
}
