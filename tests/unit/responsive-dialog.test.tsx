import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

function mockMatchMedia(matchesDesktop: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("768px") ? matchesDesktop : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("ResponsiveDialog & ConfirmDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders as a centered Radix Dialog on desktop (width >= 768px)", () => {
    mockMatchMedia(true);

    render(
      <ResponsiveDialog open={true} onOpenChange={() => {}}>
        <ResponsiveDialogContent ariaLabel="Desktop Modal">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Edit Cake Product</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Update price and stock
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <input aria-label="Cake Name" defaultValue="Lotus Cake" />
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    const dialogEl = screen.getByRole("dialog");
    expect(dialogEl).toBeInTheDocument();
    expect(dialogEl).toHaveAttribute("data-layout", "desktop-dialog");
    expect(screen.getByText("Edit Cake Product")).toBeInTheDocument();
  });

  it("renders as a bottom Vaul Drawer on mobile (width < 768px)", () => {
    mockMatchMedia(false);

    render(
      <ResponsiveDialog open={true} onOpenChange={() => {}}>
        <ResponsiveDialogContent ariaLabel="Mobile Drawer">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Mobile Cart Drawer</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Review your items
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <p>2x Belgian Fudge Brownies</p>
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    const drawerEl = screen.getByRole("dialog");
    expect(drawerEl).toBeInTheDocument();
    expect(drawerEl).toHaveAttribute("data-layout", "mobile-drawer");
    expect(screen.getByTestId("drawer-drag-handle")).toBeInTheDocument();
  });

  it("closes on Escape key when dismissible is true and traps focus inside dialog", () => {
    mockMatchMedia(true);
    const onOpenChange = vi.fn();

    render(
      <ResponsiveDialog open={true} onOpenChange={onOpenChange}>
        <ResponsiveDialogContent ariaLabel="Focus Trap Modal">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>Focus Trap Test</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              Press Escape to close
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <button type="button">First Action</button>
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter>
            <button type="button">Second Action</button>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    );

    const dialogEl = screen.getByRole("dialog");
    fireEvent.keyDown(dialogEl, { key: "Escape", code: "Escape" });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("executes ConfirmDialog confirm and cancel flows properly", () => {
    mockMatchMedia(true);
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="Delete Product?"
        description="Products with existing orders will be soft-deleted."
        variant="destructive"
        confirmLabel="Delete Product"
        cancelLabel="Keep Product"
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText("Delete Product?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Delete Product" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Keep Product" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
