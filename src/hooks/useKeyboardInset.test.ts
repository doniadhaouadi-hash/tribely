import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useKeyboardInset } from "@/hooks/useKeyboardInset";

class FakeVisualViewport extends EventTarget {
  height = 812;
  offsetTop = 0;
}

describe("useKeyboardInset (QA-037)", () => {
  const original = window.visualViewport;
  afterEach(() => {
    Object.defineProperty(window, "visualViewport", { value: original, configurable: true });
  });

  it("reports the area covered by the on-screen keyboard", () => {
    const vv = new FakeVisualViewport();
    Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
    Object.defineProperty(window, "innerHeight", { value: 812, configurable: true });

    const { result } = renderHook(() => useKeyboardInset(true));
    expect(result.current.inset).toBe(0);

    act(() => {
      vv.height = 476; // keyboard of 336px opened
      vv.dispatchEvent(new Event("resize"));
    });
    expect(result.current).toEqual({ inset: 336, visibleHeight: 476 });
  });

  it("does nothing while disabled", () => {
    const vv = new FakeVisualViewport();
    vv.height = 400;
    Object.defineProperty(window, "visualViewport", { value: vv, configurable: true });
    const { result } = renderHook(() => useKeyboardInset(false));
    expect(result.current.inset).toBe(0);
  });
});
