// The adapter's events, as changes to the store.
import { DebugProtocol } from "@vscode/debugprotocol";
import type { DebugController } from "./debugController";
import { FrameView } from "./debugStore";
import { illegalInstruction } from "./illegalInstruction";
import { LOST_TERMINAL } from "./initialView";

let stops = 0;
// A step that ends sooner is never drawn as running: the views keep showing the stop it started from.
const RUNNING_DRAWN_AFTER_MS = 50;

const frameOf = (frame: DebugProtocol.StackFrame): FrameView => ({
  id: frame.id,
  name: frame.name,
  file: frame.source && frame.source.path ? frame.source.path : null,
  fileName: frame.source && frame.source.name ? frame.source.name : "",
  line: frame.line,
  address: frame.instructionPointerReference || "",
  subtle: frame.presentationHint === "subtle",
});

const exitText = (code: number): string => "The program exited with code " + code + (code > 9 || code < 0 ? " (" + (code >>> 0).toString(16).toUpperCase() + "h)" : "");

// The call stack of the thread that stopped, for the stop number `number`: dropped when the program has moved on.
async function readStack(controller: DebugController, threadId: number, number: number): Promise<void> {
  const { client, store } = controller;
  const [stack, threads] = await Promise.all([
    client.ask<DebugProtocol.StackTraceResponse["body"]>("stackTrace", { threadId, format: { hex: store.get().settings.hex } }),
    client.ask<DebugProtocol.ThreadsResponse["body"]>("threads"),
  ]);
  const view = store.get();
  if (!view.stop || view.stop.number !== number) return;
  const frames = "body" in stack ? stack.body.stackFrames.map(frameOf) : [];
  store.set({ frames, threads: "body" in threads ? threads.body.threads : view.threads });
  const own = frames.filter((frame) => frame.file)[0];
  // code without a source: the editor stays, and the disassembly shows where the program is
  if (!frames.length || !frames[0].file) controller.setSection("disassembly", { open: true });
  if (own) controller.showFrame(own);
}

export function wireEvents(controller: DebugController): void {
  const { client, store, breakpoints } = controller;
  let running: (() => void) | null = null; // lets the running state be drawn
  const drawRunning = (): void => {
    if (running) running();
    running = null;
  };

  client.on("process", () => store.set({ phase: "running", status: "Running" }));

  client.on("capabilities", (body: DebugProtocol.CapabilitiesEvent["body"]) => {
    if (body.capabilities && body.capabilities.supportsStepBack !== undefined) store.set((view) => ({ stepBack: { ...view.stepBack, supported: !!body.capabilities.supportsStepBack } }));
  });

  client.on("stopped", (body: DebugProtocol.StoppedEvent["body"]) => {
    // Run to Cursor with no session: the program is at its entry, and goes on to the cursor from there
    if (controller.runToAfterEntry && body.reason === "entry") {
      const args = controller.runToAfterEntry;
      controller.runToAfterEntry = null;
      client.request("masm/runTo", args).catch((error) => controller.refused(error));
      return;
    }
    controller.runToAfterEntry = null;
    const number = ++stops;
    const threadId = body.threadId || 1;
    // the stop, its call stack and the open sections' rows are drawn together
    void controller.update(
      (view) => ({
        phase: "stopped",
        status: body.description || "Stopped",
        stop: { number, reason: body.reason, description: body.description || "", threadId, hint: "" },
        frame: 1,
        waiting: false,
        version: view.version + 1,
      }),
      () => readStack(controller, threadId, number),
    );
    drawRunning(); // within the stop's own hold: the running state is never drawn
  });

  client.on("masm/state", (body: { stepBack: { available: boolean; reason: string }; counting: { available: boolean }; hint: string }) => {
    store.set((view) => ({
      stepBack: { ...view.stepBack, available: body.stepBack.available, reason: body.stepBack.reason },
      countingAvailable: body.counting.available,
      stop: view.stop ? { ...view.stop, hint: body.hint || "" } : null,
    }));
    const stop = store.get().stop;
    if (stop && stop.reason === "exception") void explainIllegal(stop.number, stop.threadId);
  });

  // an illegal instruction: its bytes, as the terminal's crash notice names them; else the plain hint stays
  const explainIllegal = async (number: number, threadId: number) => {
    let found: { hint: string; report: string } | null;
    try {
      found = await illegalInstruction(client, controller.host, threadId);
    } catch (error) {
      console.warn("[debugger] the illegal instruction could not be decoded", error);
      return;
    }
    if (found) store.set((view) => (view.stop && view.stop.number === number ? { stop: { ...view.stop, hint: found.hint, report: found.report } } : {}));
  };

  client.on("continued", () => {
    const hold = store.hold(RUNNING_DRAWN_AFTER_MS);
    drawRunning();
    running = hold;
    store.set((view) => ({ phase: "running", status: "Running", note: "", stop: null, frames: [], waiting: false, consoleResult: view.consoleResult ? { ...view.consoleResult, stale: true } : null }));
  });
  client.on("masm/waiting", () => store.set({ waiting: true, status: "Running: the program is waiting for input in the terminal" }));
  client.on("masm/animating", (body: { active: boolean }) => store.set({ animating: !!body.active }));

  client.on("output", (body: DebugProtocol.OutputEvent["body"]) => {
    controller.console.add(body.category === "important" ? "message" : "output", body.output);
    controller.setSection("console", { open: true });
    if (body.category === "important") store.set({ note: body.output.replace(/\n$/, "") });
  });

  client.on("breakpoint", (body: DebugProtocol.BreakpointEvent["body"]) => breakpoints.onChanged(body.breakpoint));

  client.on("invalidated", (body: DebugProtocol.InvalidatedEvent["body"]) => {
    const stop = store.get().stop;
    const restack = stop && (body.areas || []).indexOf("stacks") >= 0 ? () => readStack(controller, stop.threadId, stop.number) : undefined;
    void controller.update((view) => ({ version: view.version + 1 }), restack);
  });

  client.on("memory", () => void controller.update((view) => ({ version: view.version + 1 })));

  client.on("exited", (body: DebugProtocol.ExitedEvent["body"]) => {
    controller.endStatus = exitText(body.exitCode);
    controller.console.add("message", exitText(body.exitCode));
  });

  client.on("masm/failure", (body: { kind: string; message: string; url: string; fatal: boolean }) => {
    console.error("[debugger] " + body.kind + ": " + body.message);
    // an ending the user asked for (a reset, Debug switched off) is never the debugger's failure
    if (controller.quietEnd) return;
    // the terminal already says that it stopped or froze, with its own report: no second notice
    if (controller.hooks.terminalDown()) {
      store.set({ status: LOST_TERMINAL });
      if (body.fatal) controller.endStatus = LOST_TERMINAL;
      return;
    }
    store.set({ failure: { kind: body.kind, message: body.message, url: body.url, fatal: !!body.fatal } });
    if (body.fatal) controller.endStatus = "The debugger stopped";
  });

  client.on("terminated", () => {
    controller.runToAfterEntry = null;
    controller.host.release();
    breakpoints.sessionEnded();
    const status = controller.endStatus || "Debugging stopped";
    controller.endStatus = null;
    controller.views.clear();
    store.set((view) => ({
      phase: "idle",
      status,
      stop: null,
      frames: [],
      threads: [],
      waiting: false,
      animating: false,
      stepBack: { ...view.stepBack, available: false, reason: "" },
      version: view.version + 1,
    }));
    drawRunning();
  });
}
