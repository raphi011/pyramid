"use client";

import { CameraIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type QRScannerProps = {
  status: "idle" | "scanning" | "denied" | "success";
  onStart?: () => void;
  onResult?: string;
  className?: string;
};

function QRScanner({ status, onStart, onResult, className }: QRScannerProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl",
        "bg-slate-100 dark:bg-slate-800",
        "aspect-square w-full max-w-xs",
        className,
      )}
    >
      {status === "idle" && (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <CameraIcon className="size-12 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Scanne den QR-Code deines Vereins
          </p>
          <Button onClick={onStart}>Kamera starten</Button>
        </div>
      )}

      {status === "scanning" && (
        <div className="relative flex size-full items-center justify-center">
          <div className="absolute inset-8 rounded-xl ring-2 ring-court-500/50" />
          <div className="h-0.5 w-3/4 animate-pulse bg-court-500/50" />
          <p className="absolute bottom-6 text-xs text-slate-500">
            QR-Code in den Rahmen halten...
          </p>
        </div>
      )}

      {status === "denied" && (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <ExclamationTriangleIcon className="size-12 text-red-400" />
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Kamera-Zugriff verweigert
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bitte erlaube den Kamera-Zugriff in deinen Browser-Einstellungen.
          </p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-court-100 dark:bg-court-900">
            <svg
              className="size-6 text-court-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-900 dark:text-white">
            Code erkannt!
          </p>
          {onResult && (
            <code className="text-xs text-slate-500">{onResult}</code>
          )}
        </div>
      )}
    </div>
  );
}

export { QRScanner };
export type { QRScannerProps };
