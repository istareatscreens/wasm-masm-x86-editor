import { useStore } from "../../debugger/session/debugStore";
import { startRule } from "../../debugger/toolbar/commandStates";

// The build buttons while Debug is on. The program last debugged stands in when the open file is not an .asm
// (stepping may have opened an include). The reset is the plain one: it ends a session itself (cmd/terminalReset.ts).
export default function useDebugBanner({ on, controller, filename, plain }) {
  const phase = useStore(controller.store, (view) => view.phase);
  const program = useStore(controller.store, (view) => view.program);
  if (!on) return plain;

  const session = phase !== "idle";
  const start = startRule(filename, program);
  return {
    run: {
      onClick: () => controller.go(),
      disabled: !session && !start.canStart,
      title: phase === "stopped" ? "Continue (F5)" : session ? "the program is running: Break stops it" : start.canStart ? "compile, link and debug .asm file (F5)" : start.reason,
    },
    runBinary: session ? { onClick: () => {}, disabled: true, title: "stop debugging to run the compiled binary" } : plain.runBinary,
    cancel: session ? { onClick: () => controller.stop(), title: "stop debugging (Shift+F5)" } : plain.cancel,
    reset: plain.reset,
  };
}
