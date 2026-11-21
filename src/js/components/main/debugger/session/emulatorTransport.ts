// The app's end of the debugger's channel to the emulator page: a message channel whose other end the page
// takes (bwApp.debugConnect, boxedwine/debug/pageBridge.js).
import { BridgeTransport } from "../../utility/debug/engine/emulator/protocol";
import { getBwApp } from "../../../../utility/utilityFunctions";

export interface EmulatorTransport extends BridgeTransport {
  close(): void;
}

// null: the page is not loaded yet (getBwApp() is null then), or is an older one without the debugger.
export function connectEmulator(): EmulatorTransport | null {
  const app: { debugConnect?: (port: MessagePort) => void } | null = getBwApp();
  if (!app || typeof app.debugConnect !== "function") return null;
  const channel = new MessageChannel();
  app.debugConnect(channel.port2);
  const port = channel.port1;
  return {
    post: (message, transfer) => port.postMessage(message, transfer || []),
    listen: (handler) => {
      const onMessage = (event: MessageEvent) => handler(event.data);
      port.addEventListener("message", onMessage);
      port.start();
      return { dispose: () => port.removeEventListener("message", onMessage) };
    },
    close: () => port.close(),
  };
}
