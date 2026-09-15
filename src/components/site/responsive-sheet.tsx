"use client";

import type { ReactNode } from "react";
import { X } from "@phosphor-icons/react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerBody, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { DESKTOP_QUERY, useMediaQuery } from "@/hooks/use-media-query";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  closeLabel?: string;
};

/**
 * Desktop (>720px): centered `.web-modal` dialog. Phone: `.bottom-sheet` drawer with a drag handle.
 * The server snapshot is "phone", so the first client render never flashes the wrong surface.
 */
export function ResponsiveSheet({ open, onOpenChange, title, description, children, closeLabel = "关闭" }: Props) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label={closeLabel}
            className="absolute top-[21px] right-[18px] flex size-8 items-center justify-center text-[#6a7b81]"
          >
            <X size={20} />
          </button>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label={closeLabel}
          className="absolute top-[27px] right-[14px] flex size-8 items-center justify-center text-[#6a7b81]"
        >
          <X size={20} />
        </button>
        <DrawerBody>{children}</DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
