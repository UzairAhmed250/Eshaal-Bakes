"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Drawer as DrawerPrimitive } from "vaul";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

export type ResponsiveDialogSize = "sm" | "md" | "lg";

interface ResponsiveDialogContextValue {
  isDesktop: boolean;
  size: ResponsiveDialogSize;
  dismissible: boolean;
  showCloseButton: boolean;
}

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogContextValue>({
    isDesktop: false,
    size: "md",
    dismissible: true,
    showCloseButton: true,
  });

function useResponsiveDialogContext() {
  return React.useContext(ResponsiveDialogContext);
}

export interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: ResponsiveDialogSize;
  dismissible?: boolean;
  showCloseButton?: boolean;
  children: React.ReactNode;
}

/**
 * Single unified modal/drawer primitive for the entire application.
 * - Renders a centered Radix Dialog on desktop (`min-width: 768px`)
 * - Renders a Vaul bottom Drawer on mobile (`< 768px`) and during SSR / initial mount (no hydration mismatch)
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  size = "md",
  dismissible = true,
  showCloseButton = true,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!dismissible && !nextOpen) {
        return;
      }
      onOpenChange?.(nextOpen);
    },
    [dismissible, onOpenChange]
  );

  const contextValue = React.useMemo<ResponsiveDialogContextValue>(
    () => ({
      isDesktop,
      size,
      dismissible,
      showCloseButton,
    }),
    [isDesktop, size, dismissible, showCloseButton]
  );

  if (isDesktop) {
    return (
      <ResponsiveDialogContext.Provider value={contextValue}>
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
          {children}
        </DialogPrimitive.Root>
      </ResponsiveDialogContext.Provider>
    );
  }

  return (
    <ResponsiveDialogContext.Provider value={contextValue}>
      <DrawerPrimitive.Root
        open={open}
        onOpenChange={handleOpenChange}
        dismissible={dismissible}
      >
        {children}
      </DrawerPrimitive.Root>
    </ResponsiveDialogContext.Provider>
  );
}

export function ResponsiveDialogTrigger({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>) {
  const { isDesktop } = useResponsiveDialogContext();
  if (isDesktop) {
    return (
      <DialogPrimitive.Trigger asChild={asChild} className={className} {...props}>
        {children}
      </DialogPrimitive.Trigger>
    );
  }
  return (
    <DrawerPrimitive.Trigger asChild={asChild} className={className} {...props}>
      {children}
    </DrawerPrimitive.Trigger>
  );
}

const desktopModalSizeVariants = cva(
  "fixed left-1/2 top-1/2 z-50 flex max-h-[88vh] w-full -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none",
  {
    variants: {
      size: {
        sm: "max-w-md",
        md: "max-w-lg",
        lg: "max-w-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const DESKTOP_MAX_WIDTH_MAP: Record<ResponsiveDialogSize, string> = {
  sm: "28rem",
  md: "32rem",
  lg: "42rem",
};

/** Clicking a toast notification should never dismiss the open modal/drawer. */
function isToastTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element && Boolean(target.closest("[data-toast-root]"))
  );
}

export interface ResponsiveDialogContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  ariaLabel?: string;
}

export const ResponsiveDialogContent = React.forwardRef<
  HTMLDivElement,
  ResponsiveDialogContentProps
>(({ className, children, ariaLabel, style, ...props }, ref) => {
  const { isDesktop, size, dismissible, showCloseButton } =
    useResponsiveDialogContext();

  if (isDesktop) {
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-testid="responsive-dialog-overlay"
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm transition-opacity"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(24, 16, 12, 0.55)",
          }}
        />
        <DialogPrimitive.Content
          ref={ref}
          data-layout="desktop-dialog"
          aria-label={ariaLabel}
          onEscapeKeyDown={(event) => {
            if (!dismissible) event.preventDefault();
          }}
          onPointerDownOutside={(event) => {
            if (!dismissible || isToastTarget(event.target)) event.preventDefault();
          }}
          onInteractOutside={(event) => {
            if (!dismissible || isToastTarget(event.target)) event.preventDefault();
          }}
          className={cn(desktopModalSizeVariants({ size }), className)}
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "calc(100% - 2rem)",
            maxWidth: DESKTOP_MAX_WIDTH_MAP[size],
            maxHeight: "88vh",
            zIndex: 50,
            ...style,
          }}
          {...props}
        >
          {children}
          {showCloseButton && dismissible && (
            <DialogPrimitive.Close
              aria-label="Close dialog"
              className="absolute right-4 top-4 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/80 bg-background/90 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    );
  }

  return (
    <DrawerPrimitive.Portal>
      <DrawerPrimitive.Overlay
        data-testid="responsive-drawer-overlay"
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          backgroundColor: "rgba(24, 16, 12, 0.55)",
        }}
      />
      <DrawerPrimitive.Content
        ref={ref}
        data-layout="mobile-drawer"
        aria-label={ariaLabel}
        onEscapeKeyDown={(event) => {
          if (!dismissible) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (!dismissible || isToastTarget(event.target)) event.preventDefault();
        }}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 mt-12 flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border bg-card text-card-foreground shadow-2xl focus:outline-none",
          className
        )}
        style={{
          maxHeight: "88vh",
          ...style,
        }}
        {...props}
      >
        {/* Drag handle for mobile swipe down (no X close button on mobile drawer) */}
        <div
          data-testid="drawer-drag-handle"
          className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30"
          aria-hidden="true"
        />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPrimitive.Portal>
  );
});
ResponsiveDialogContent.displayName = "ResponsiveDialogContent";

export function ResponsiveDialogHeader({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { isDesktop, showCloseButton, dismissible } =
    useResponsiveDialogContext();
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col space-y-1.5 border-b px-6 py-4 text-left",
        isDesktop && showCloseButton && dismissible && "pr-14",
        className
      )}
      style={{
        paddingTop: "1.125rem",
        paddingBottom: "1.125rem",
        paddingLeft: "1.5rem",
        paddingRight: isDesktop && showCloseButton && dismissible ? "3.5rem" : "1.5rem",
        ...style,
      }}
      {...props}
    />
  );
}

export function ResponsiveDialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  const { isDesktop } = useResponsiveDialogContext();
  if (isDesktop) {
    return (
      <DialogPrimitive.Title
        className={cn(
          "font-display text-lg font-semibold leading-none tracking-tight text-foreground",
          className
        )}
        {...props}
      />
    );
  }
  return (
    <DrawerPrimitive.Title
      className={cn(
        "font-display text-lg font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  );
}

export function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>) {
  const { isDesktop } = useResponsiveDialogContext();
  if (isDesktop) {
    return (
      <DialogPrimitive.Description
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      />
    );
  }
  return (
    <DrawerPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export function ResponsiveDialogBody({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-5", className)}
      style={{
        paddingTop: "1.25rem",
        paddingBottom: "1.25rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        ...style,
      }}
      {...props}
    />
  );
}

export function ResponsiveDialogFooter({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-3 border-t bg-card px-6 py-4 sm:flex-row sm:items-center sm:justify-end",
        className
      )}
      style={{
        paddingTop: "1rem",
        paddingBottom: "1.125rem",
        paddingLeft: "1.5rem",
        paddingRight: "1.5rem",
        ...style,
      }}
      {...props}
    />
  );
}

export function ResponsiveDialogClose({
  className,
  children,
  asChild = false,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>) {
  const { isDesktop } = useResponsiveDialogContext();
  if (isDesktop) {
    return (
      <DialogPrimitive.Close asChild={asChild} className={className} {...props}>
        {children}
      </DialogPrimitive.Close>
    );
  }
  return (
    <DrawerPrimitive.Close asChild={asChild} className={className} {...props}>
      {children}
    </DrawerPrimitive.Close>
  );
}
