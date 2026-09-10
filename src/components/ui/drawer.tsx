"use client";

import * as React from "react";
import { cn } from "cn";
import { Drawer as DrawerPrimitive } from "vaul";

function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}

/** `.sheet-overlay` */
function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn("fixed inset-0 z-30 bg-[rgba(0,0,0,0.34)]", className)}
      {...props}
    />
  );
}

/** `.bottom-sheet`: 20px top radius, drag handle, 84%-of-viewport cap. */
function DrawerContent({
  className,
  children,
  maxHeight = "84svh",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content> & { maxHeight?: string }) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        style={{ maxHeight }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-31 flex min-h-[260px] flex-col overflow-hidden rounded-t-[20px] bg-[#f2f6f7] text-ink shadow-[0_-16px_48px_rgba(0,0,0,0.2)] outline-none",
          className,
        )}
        {...props}
      >
        <div data-slot="drawer-handle" className="grid h-[30px] shrink-0 place-items-center" aria-hidden>
          <div className="h-[5px] w-[42px] rounded-full bg-[#c9c9c4]" />
        </div>
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-header" className={cn("grid shrink-0 gap-1 px-[18px] pb-[14px]", className)} {...props} />;
}

function DrawerBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="drawer-body" className={cn("min-h-0 overflow-auto px-[18px] pb-safe-4", className)} {...props} />;
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("m-0 text-[21px] font-medium tracking-[-0.04em] whitespace-pre-line", className)}
      {...props}
    />
  );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("m-0 text-[10px] leading-[1.35] text-[#8a999f]", className)}
      {...props}
    />
  );
}

export { Drawer, DrawerBody, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger };
