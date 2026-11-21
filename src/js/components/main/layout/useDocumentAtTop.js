import { useEffect } from "react";

const editable = (element) => !!element && (element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName));

// The app never scrolls its document. Whatever does (iOS panning to a field for its keyboard and leaving the
// page shifted, an unguarded scrollIntoView) is undone once no field has the keyboard. The page height is
// clientHeight, not innerHeight, which iOS can shrink while its keyboard is up.
export default function useDocumentAtTop() {
  useEffect(() => {
    const root = document.scrollingElement || document.documentElement;
    const visual = window.visualViewport;
    let frame = 0;
    const settle = () => {
      frame = 0;
      if (!root.scrollTop && !root.scrollLeft) return;
      const keyboardGone = !editable(document.activeElement) || (visual && visual.height >= document.documentElement.clientHeight - 1);
      if (keyboardGone) window.scrollTo(0, 0);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(settle);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("focusout", schedule);
    if (visual) visual.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("focusout", schedule);
      if (visual) visual.removeEventListener("resize", schedule);
    };
  }, []);
}
