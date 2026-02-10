"use client";

import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";

type QRCodeProps = {
  value: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
};

const sizeMap = {
  sm: 96,
  md: 160,
  lg: 224,
} as const;

function QRCode({ value, size = "md", label, className }: QRCodeProps) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)}>
      <div className="rounded-xl bg-white p-3">
        <QRCodeSVG
          value={value}
          size={sizeMap[size]}
          level="M"
          bgColor="transparent"
          fgColor="#0F172A"
        />
      </div>
      {label && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}

export { QRCode };
export type { QRCodeProps };
