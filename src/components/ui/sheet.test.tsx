import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sheet, SheetContent } from "@/components/ui/sheet";

describe("SheetContent (QA-024)", () => {
  afterEach(() => vi.restoreAllMocks());

  it("gives the dialog an accessible name and can drop the built-in close button", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const warns = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Sheet open>
        <SheetContent title="Filters" hideClose>
          <button type="button" aria-label="Close">x</button>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
    const radixWarnings = [...errors.mock.calls, ...warns.mock.calls].filter((c) =>
      String(c[0]).includes("DialogTitle") || String(c[0]).includes("Description"),
    );
    expect(radixWarnings).toEqual([]);
  });

  it("keeps the built-in close button by default", () => {
    render(
      <Sheet open>
        <SheetContent title="Onboarding">content</SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
