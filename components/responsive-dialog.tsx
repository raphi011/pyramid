"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";

type ResponsiveDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setIsDesktop(e.matches);
    }

    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}

function ResponsiveDialog({
  open,
  onClose,
  title,
  children,
  className,
}: ResponsiveDialogProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        title={title}
        className={className}
      >
        {children}
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onClose={onClose} title={title} className={className}>
      {children}
    </Sheet>
  );
}

export { ResponsiveDialog };
export type { ResponsiveDialogProps };
