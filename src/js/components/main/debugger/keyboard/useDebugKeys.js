import { useEffect } from "react";

import { blockedReasons, startRule } from "../toolbar/commandStates";
import { commandOf } from "./debugKeys.js";

// Taken before the page's other handlers, with the browser's action cancelled (F5 would reload the page), also when
// the command does not apply: then the key does nothing, as its grey button. Keys typed in the terminal never come
// here: its frame has its own window. `editor()` gives { file, line, text } (the selection, or the word at the
// cursor), or null when no source is open.
export default function useDebugKeys(on, controller, editor) {
  useEffect(() => {
    if (!on) return undefined;
    const run = {
      go: () => controller.go(),
      stop: () => controller.stop(),
      restart: () => controller.restart(),
      runWithoutDebugging: () => controller.start({ noDebug: true }),
      next: () => controller.step("next"),
      stepIn: () => controller.step("stepIn"),
      stepOut: () => controller.step("stepOut"),
      stepBack: () => controller.stepBack(),
      pause: () => controller.pause(),
      showNext: () => controller.showNext(),
      toggleBreakpoint: (at) => at && controller.breakpoints.toggle(at.file, at.line),
      enableBreakpoint: (at) => at && controller.breakpoints.enable(at.file, at.line),
      quickWatch: (at) => at && at.text && controller.evaluateInConsole(at.text),
      runToCursor: (at) => at && controller.runTo({ file: at.file, line: at.line }),
      setNext: (at) => at && controller.setNext(at.file, at.line),
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape" && controller.view.animating) {
        controller.animate(false);
        return;
      }
      const command = commandOf(event);
      if (!command) return;
      event.preventDefault();
      event.stopPropagation();
      const view = controller.view;
      const start = startRule(controller.hooks.openFile(), view.program);
      if (blockedReasons({ phase: view.phase, stepBack: view.stepBack, canStart: start.canStart, startReason: start.reason })[command]) return;
      run[command](editor());
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [on, controller, editor]);
}
