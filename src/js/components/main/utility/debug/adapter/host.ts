// The web app and the VS Code extension each implement this; everything else is shared.
import { DebugEngine } from "../engine/engine";
import { Timers } from "../engine/emulator/emulatorEngine";
import { LineMapper } from "../program/lineMapping";
import { SourceResolver } from "../program/sourcePaths";

// An empty refusal `message` means the host has already told the user (its own message box).
export interface ReadyPlan {
  ok: true;
  programPath: string;
  token: unknown; // the host's own record of what to build
}
export interface RefusedPlan {
  ok: false;
  message: string;
}
export type LaunchPlan = ReadyPlan | RefusedPlan;

export interface DebugHost {
  // The checks and saves a plain run makes. `program` is the host's name for the file (undefined: the open one);
  // `programPath` is the built program as the build names it (D:\bin\main.exe). A ready plan fixes the text
  // that will be built: `lineMapper` must count the edits made from that text on.
  plan(program: string | undefined, options: { debug: boolean }): Promise<LaunchPlan>;
  // Builds and runs what was planned. Resolves when the build's outcome is known.
  build(plan: ReadyPlan): Promise<{ ok: boolean; message?: string }>;
  // What will run the program. `unsupported` says why there is none: a terminal built without the debugger.
  createEngine(): Promise<{ engine: DebugEngine } | { unsupported: string }>;
  readonly resolver: SourceResolver;
  readonly lineMapper: LineMapper;
  decoder(): Promise<unknown>; // the iced-x86 namespace, started
  issueUrl(title: string, body: string): string;
  environment(): string[]; // lines for a report: the app's version, the browser, the terminal's build
  constantNamed?(name: string): boolean; // does the program's source define this name with EQU or = ?
  timers?: Timers;
  now?: () => number;
}
