import { useEffect, useState } from "react";

/**
 * How many pixels at the bottom of the layout viewport are covered by the
 * on-screen keyboard, plus the visible height above it. iOS Safari doesn't
 * shrink fixed elements when the keyboard opens, so bottom sheets use this
 * to stay above it (QA-037). 0 / window height where visualViewport is missing.
 */
export const useKeyboardInset = (enabled: boolean) => {
  const [state, setState] = useState({ inset: 0, visibleHeight: 0 });

  useEffect(() => {
    const vv = window.visualViewport;
    if (!enabled || !vv) return;
    const update = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      setState({ inset, visibleHeight: Math.round(vv.height) });
    };
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return state;
};
