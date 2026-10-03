"use client";

import { useEffect } from "react";

/**
 * Tells the page when a touch device's on-screen keyboard is covering it.
 *
 * Android Chrome shrinks the page itself (the viewport meta asks for
 * `interactive-widget=resizes-content`), but iOS Safari leaves the layout tall
 * and only shrinks the visible part, so a full-screen session sized to 100svh
 * ends up half behind the keyboard. While an input is focused and the visible
 * height has dropped well below what it was, this sets `html[data-keyboard]`
 * (CSS hides `.compact-hide` chrome) and `--app-h` (what `.h-app` sizes to).
 * Fine pointers never get either, so desktops are untouched.
 */
export function KeyboardViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const visual = viewport;
    const root = document.documentElement;
    const coarse = window.matchMedia("(pointer: coarse)");
    let baseline = Math.max(window.innerHeight, visual.height);

    function isTyping(): boolean {
      const el = document.activeElement;
      return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement;
    }

    function update() {
      // The reference height only follows the window while nothing is being
      // typed (rotation, browser bars), never while the keyboard is shrinking it.
      if (!isTyping()) baseline = Math.max(window.innerHeight, visual.height);
      const open = coarse.matches && isTyping() && baseline - visual.height > 120;
      if (open) {
        root.setAttribute("data-keyboard", "");
        root.style.setProperty("--app-h", `${Math.round(visual.height)}px`);
      } else {
        root.removeAttribute("data-keyboard");
        root.style.removeProperty("--app-h");
      }
    }

    // Focus changes settle after the keyboard animation starts, so check again shortly after.
    function onFocusChange() {
      update();
      window.setTimeout(update, 250);
    }

    visual.addEventListener("resize", update);
    window.addEventListener("orientationchange", onFocusChange);
    document.addEventListener("focusin", onFocusChange);
    document.addEventListener("focusout", onFocusChange);
    update();
    return () => {
      visual.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", onFocusChange);
      document.removeEventListener("focusin", onFocusChange);
      document.removeEventListener("focusout", onFocusChange);
      root.removeAttribute("data-keyboard");
      root.style.removeProperty("--app-h");
    };
  }, []);

  return null;
}
