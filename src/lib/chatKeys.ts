/** Phones/tablets: Enter inserts a line break and only the button sends (QA-035). */
export const isTouchDevice = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(pointer: coarse)").matches;

type EnterKeyEvent = {
  key: string;
  shiftKey: boolean;
  keyCode?: number;
  isComposing?: boolean;
};

/**
 * Should this keydown send the message? Not while an IME / Android keyboard
 * (Gboard, Samsung) is still composing the current word — Enter then only
 * confirms the word (isComposing, or the legacy keyCode 229).
 */
export const shouldSendOnEnter = (e: EnterKeyEvent, touch: boolean) =>
  e.key === "Enter" && !e.shiftKey && !e.isComposing && e.keyCode !== 229 && !touch;
