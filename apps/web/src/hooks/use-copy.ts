"use client";

import { useState } from "react";

/**
 * Copies text to the clipboard and says what happened. When the clipboard is refused (older WebViews,
 * denied permission), `manual` asks the caller to show the text for the reader to select themselves.
 */
export function useCopy(manualMessage: string) {
  const [status, setStatus] = useState("");
  const [manual, setManual] = useState(false);
  async function copy(value: string, done: string) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(done);
      setManual(false);
      return true;
    } catch {
      setManual(true);
      setStatus(manualMessage);
      return false;
    }
  }
  return { status, manual, copy };
}
