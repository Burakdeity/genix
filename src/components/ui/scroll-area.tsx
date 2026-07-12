"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";

function ScrollArea({
  className,
  children,
  viewportClassName,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportClassName?: string;
}) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className={cn(
          "orwix-scroll-hide size-full rounded-[inherit] outline-none",
          viewportClassName,
        )}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        "orwix-fancy-scrollbar flex touch-none select-none p-1 transition-opacity duration-200",
        "data-vertical:h-full data-vertical:w-3.5 data-horizontal:h-3.5 data-horizontal:w-full data-horizontal:flex-col",
        "opacity-70 hover:opacity-100 data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className={cn(
          "orwix-fancy-scrollbar-thumb relative flex-1 rounded-full",
          "before:absolute before:inset-0 before:rounded-full before:content-['']",
        )}
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
