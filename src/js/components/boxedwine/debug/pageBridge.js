import { EmulatorBridge } from "../../main/utility/debug/engine/emulator/emulatorBridge";

// The emulator page's end of the debugger, on the port from bwApp.debugConnect; a new connection releases what the
// one before it held. `nativePath`: a file as the terminal names it (D:\lab1\bin\main.exe) in this page's file
// system. `onHolding`: told while a stopped program is being held.
export function createDebugBridge({ nativePath, onHolding }) {
  let bridge = null;
  let port = null;
  // a reload or a close: the engine hears it at once
  window.addEventListener("pagehide", () => bridge && bridge.departing());

  const close = () => {
    if (bridge) bridge.dispose();
    if (port) port.close();
    bridge = null;
    port = null;
  };

  const connect = (next) => {
    close();
    port = next;
    const transport = {
      post: (message, transfer) => next.postMessage(message, transfer || []),
      listen: (handler) => {
        const onMessage = (event) => handler(event.data);
        next.addEventListener("message", onMessage);
        next.start();
        return { dispose: () => next.removeEventListener("message", onMessage) };
      },
    };
    bridge = new EmulatorBridge(
      {
        exports: () => (typeof Module !== "undefined" && typeof Module.bwWriteFile === "function" ? Module : null),
        nativePath,
        runtime: () => (window.BW_USE_MT ? "mt" : "st"),
        holding: onHolding,
      },
      transport,
    );
  };

  return { connect, close };
}
