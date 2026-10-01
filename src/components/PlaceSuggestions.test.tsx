import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlaceSuggestions } from "@/components/PlaceSuggestions";
import type { GeoPlace } from "@/lib/geocode";

const places: GeoPlace[] = [
  { label: "Galleria Mall, Al Maryah Island, Abu Dhabi", lat: 24.5, lng: 54.39 },
  { label: "Yas Mall, Yas Island, Abu Dhabi", lat: 24.49, lng: 54.61 },
];

/** Same wiring as the Where field in Create/Edit: hide the list on blur. */
const Harness = ({ onSelect }: { onSelect: (p: GeoPlace) => void }) => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <input aria-label="Where" onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} />
      {open && <PlaceSuggestions searching={false} places={places} onSelect={onSelect} />}
    </div>
  );
};

describe("PlaceSuggestions (QA-031)", () => {
  it("keeps the input focused while a suggestion is pressed", () => {
    render(<Harness onSelect={() => {}} />);
    const option = screen.getByRole("option", { name: /Galleria/ });
    // fireEvent returns false when the handler called preventDefault()
    expect(fireEvent.pointerDown(option)).toBe(false);
    expect(fireEvent.mouseDown(option)).toBe(false);
  });

  it("selects on a slow press: pointerdown, delay, then click", async () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();
    render(<Harness onSelect={onSelect} />);
    const input = screen.getByLabelText("Where");
    input.focus();

    const option = screen.getByRole("option", { name: /Galleria/ });
    fireEvent.pointerDown(option);
    fireEvent.mouseDown(option);
    // focus stays in the input, so the list is not hidden
    vi.advanceTimersByTime(600);
    expect(document.activeElement).toBe(input);
    fireEvent.click(screen.getByRole("option", { name: /Galleria/ }));

    expect(onSelect).toHaveBeenCalledWith(places[0]);
    vi.useRealTimers();
  });
});
