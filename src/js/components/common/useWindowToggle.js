import { useCallback, useState } from "react";

// A button that opens a window toggles it: pressed while the window is open, it acts as the close button.
export const windowToggle = (isOpen, open, dismiss) => ({
  toggle: () => (isOpen ? dismiss() : open()),
  opener: { "aria-haspopup": "dialog", "aria-expanded": !!isOpen },
});

// A window whose open state the button keeps itself.
export default function useWindowToggle() {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return { isOpen, open, close, ...windowToggle(isOpen, open, close) };
}
