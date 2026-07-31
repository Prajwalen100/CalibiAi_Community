"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Sheet, built on Radix Dialog.
 *
 * Used for every mobile slide-over and bottom sheet in the app. Radix gives us
 * focus trapping, scroll locking, `Escape` to close, and correct `aria-modal`
 * semantics for free, which is why the mobile drawers do not hand-roll any of
 * that behaviour.
 */
const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    ref={ref}
    // `sheet-overlay` keyframes live in globals.css. We deliberately avoid the
    // `tailwindcss-animate` plugin: it remaps Tailwind's core `duration-*`
    // utilities onto `animation-duration`, which would alter existing desktop
    // transitions across the app.
    className={cn("sheet-overlay fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm", className)}
    {...props}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

/**
 * Every side variant pads itself with the matching `env(safe-area-inset-*)`
 * value so sheets clear the notch, the Dynamic Island and the home indicator
 * when the app runs standalone.
 */
const sheetVariants = cva("sheet-panel fixed z-[101] flex flex-col gap-0 bg-white shadow-2xl dark:bg-slate-950", {
  variants: {
    side: {
      top: "inset-x-0 top-0 border-b border-slate-200 pt-[env(safe-area-inset-top)] dark:border-slate-800",
      bottom:
        "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl border-t border-slate-200 pb-[env(safe-area-inset-bottom)] dark:border-slate-800",
      left: "inset-y-0 left-0 h-full w-[86vw] max-w-sm border-r border-slate-200 pl-[env(safe-area-inset-left)] dark:border-slate-800",
      right:
        "inset-y-0 right-0 h-full w-[86vw] max-w-sm border-l border-slate-200 pr-[env(safe-area-inset-right)] dark:border-slate-800",
    },
  },
  defaultVariants: { side: "right" },
});

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {
  /** Renders the built-in top-right dismiss button. */
  showCloseButton?: boolean;
}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, showCloseButton = true, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      data-side={side}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      {children}
      {showCloseButton && (
        <SheetPrimitive.Close
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </SheetPrimitive.Close>
      )}
    </SheetPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = SheetPrimitive.Content.displayName;

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1.5 p-4 text-left", className)} {...props} />;
}
SheetHeader.displayName = "SheetHeader";

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />;
}
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-base font-bold text-slate-900 dark:text-white", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-slate-500 dark:text-slate-400", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

/** A grab handle for bottom sheets, matching native iOS/Android affordances. */
function SheetGrabber({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 justify-center pb-1 pt-3", className)} aria-hidden="true">
      <span className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-700" />
    </div>
  );
}

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetGrabber,
};
