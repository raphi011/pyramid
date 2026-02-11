"use client";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
};

function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Bestätigen",
  cancelLabel = "Abbrechen",
  loading,
}: ConfirmDialogProps) {
  return (
    <ResponsiveDialog open={open} onClose={onClose} title={title}>
      {description && (
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}

export { ConfirmDialog };
export type { ConfirmDialogProps };
