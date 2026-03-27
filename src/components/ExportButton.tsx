"use client";

import { ReactNode } from "react";

interface ExportButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children?: ReactNode;
}

export default function ExportButton({ onClick, disabled, children }: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-xs font-mono px-4 py-2 rounded-lg border bg-surface text-text-muted border-border hover:border-accent hover:text-accent transition-colors flex items-center gap-2 disabled:opacity-40"
    >
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
        />
      </svg>
      {children || "Export"}
    </button>
  );
}
