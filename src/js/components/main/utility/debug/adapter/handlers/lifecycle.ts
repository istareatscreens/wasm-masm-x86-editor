import { DebugProtocol } from "@vscode/debugprotocol";
import { DebugSession } from "../../session/debugSession";
import { capabilities } from "../capabilities";
import { bridgeSession } from "../eventBridge";
import { MasmDebugAdapter } from "../masmDebugAdapter";
import { HandlerTable, RequestError } from "../shared";
import { applyStored } from "./breakpoints";

export const BUILD_FAILED = "Build failed — see the terminal";

interface LaunchArguments extends DebugProtocol.LaunchRequestArguments {
  program?: string; // the host's name for the file to debug; none: the file the user has open
  stopOnEntry?: boolean;
}

async function initialize(adapter: MasmDebugAdapter): Promise<DebugProtocol.Capabilities> {
  // the front end may send its breakpoints once this answer has gone out
  Promise.resolve().then(() => adapter.emit("initialized"));
  return capabilities(true);
}

async function launch(adapter: MasmDebugAdapter, args: LaunchArguments): Promise<void> {
  if (adapter.session && adapter.session.state !== "ended") throw new RequestError("A program is already being debugged");
  adapter.launchArguments = args;
  const host = adapter.host;
  const plan = await host.plan(args.program, { debug: !args.noDebug });
  if (plan.ok === false) {
    adapter.emit("terminated", {});
    throw new RequestError(plan.message || "The program cannot be started", !plan.message);
  }
  if (args.noDebug) {
    // a release build that runs as RUN runs it: there is nothing to debug, so the session is over at once
    const built = await host.build(plan);
    adapter.emit("terminated", {});
    if (!built.ok) throw new RequestError(built.message || BUILD_FAILED, true);
    return;
  }
  const made = await host.createEngine();
  if ("unsupported" in made) {
    adapter.emit("terminated", {});
    throw new RequestError(made.unsupported);
  }
  adapter.engine = made.engine;
  const session = new DebugSession({ engine: made.engine, decoder: await adapter.decoder(), resolver: host.resolver, cache: adapter.cache, programPath: plan.programPath, stopAtEntry: !!args.stopOnEntry, breakpointIds: adapter.nextBreakpointId, timers: host.timers, now: host.now });
  adapter.session = session;
  adapter.emit("capabilities", { capabilities: { supportsStepBack: made.engine.features.stepBack } });
  bridgeSession(adapter, session);
  applyStored(adapter, session);
  await session.arm();
  const built = await host.build(plan);
  if (!built.ok) {
    await session.disconnect();
    throw new RequestError(built.message || BUILD_FAILED, true);
  }
  session.built();
}

async function end(adapter: MasmDebugAdapter, terminate: boolean): Promise<void> {
  const session = adapter.session;
  if (adapter.animator) adapter.animator.stop();
  if (!session || session.state === "ended") return;
  const ended = new Promise<void>((resolve) => session.listen((event) => event.type === "ended" && resolve()));
  await (terminate ? session.terminate() : session.disconnect());
  await ended;
}

async function disconnect(adapter: MasmDebugAdapter, args: DebugProtocol.DisconnectArguments): Promise<void> {
  await end(adapter, args.terminateDebuggee !== false);
}

async function terminate(adapter: MasmDebugAdapter): Promise<void> {
  await end(adapter, true);
}

async function restart(adapter: MasmDebugAdapter, args: DebugProtocol.RestartArguments): Promise<void> {
  const again = (args.arguments as LaunchArguments) || adapter.launchArguments;
  if (!again) throw new RequestError("Nothing has been debugged yet");
  await end(adapter, true);
  await launch(adapter, again);
}

export const lifecycle: HandlerTable = {
  initialize,
  launch,
  configurationDone: async () => undefined,
  disconnect,
  terminate,
  restart,
};
