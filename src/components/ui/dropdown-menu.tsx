"use client";

import * as React from "react";
import { cn } from "cn";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";

function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

/** Paper card in the `.web-modal` palette: 4px radius, hairline border. Motion lives in `globals.css`. */
function DropdownMenuContent({ className, align = "end", sideOffset = 6, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-40 min-w-[150px] origin-(--radix-dropdown-menu-content-transform-origin) rounded-[4px] border border-line bg-[#f2f6f7] p-[6px] text-ink shadow-[0_14px_34px_rgba(21,28,31,0.12)] outline-none",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item>) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-between gap-6 rounded-[3px] px-3 text-xs text-mist outline-none select-none data-highlighted:bg-paper data-highlighted:text-ink aria-[current=true]:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem };
