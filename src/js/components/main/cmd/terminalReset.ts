// The terminal's reset. The page navigates the emulator frame itself, first to about:blank and then back to the
// emulator page, so a wedged, crashed or error-page document cannot stop it, and the old emulator is torn down
// before the new one starts. The user's files live in this page's IndexedDB, so a reset never touches them.
import { EmulatorInfo } from "../crash/bugReport";
import { EMULATOR_PAGE, emulatorFrame, emulatorPageInfo } from "./emulatorPage";

export type ResetResult = "loaded" | "retried" | "failed";
export interface ResetOutcome {
  result: ResetResult; // retried: loaded on the second attempt
  ms: number;
}
export interface ResetHooks {
  beforeReset(): void; // must not wait on the old page
  onFailed(): void;
}
interface FrameLike {
  src: string;
  addEventListener(type: "load", listener: () => void): void;
  removeEventListener(type: "load", listener: () => void): void;
}
export interface ResetOptions {
  frame(): FrameLike | null;
  pageInfo?(): EmulatorInfo; // read before the page goes, for a report
  page?: string;
  blankMs?: number;
  loadMs?: number;
  now?(): number;
  log?(message: string): void;
}

const KEPT = 5;

export function createTerminalReset({ frame, pageInfo = () => ({}), page = EMULATOR_PAGE, blankMs = 2000, loadMs = 20000, now = () => Date.now(), log = (message) => console.log(message) }: ResetOptions) {
  let hooks: ResetHooks = { beforeReset() {}, onFailed() {} };
  let inFlight: Promise<boolean> | null = null;
  let info: EmulatorInfo = {};
  const outcomes: ResetOutcome[] = [];

  // resolves true on the frame's load event, false when `ms` pass first
  const navigate = (target: FrameLike, url: string, ms: number): Promise<boolean> =>
    new Promise((resolve) => {
      const done = (loaded: boolean) => {
        clearTimeout(timer);
        target.removeEventListener("load", onLoad);
        resolve(loaded);
      };
      const onLoad = () => done(true);
      const timer = setTimeout(() => done(false), ms);
      target.addEventListener("load", onLoad);
      target.src = url;
    });

  const record = (result: ResetResult, start: number) => {
    const ms = Math.round(now() - start);
    outcomes.push({ result, ms });
    if (outcomes.length > KEPT) outcomes.shift();
    log(result === "failed" ? "[reset] the emulator page did not load (" + ms + " ms)" : "[reset] " + (result === "retried" ? "loaded after a retry" : "loaded") + " in " + ms + " ms");
  };

  const run = async (target: FrameLike): Promise<boolean> => {
    const start = now();
    for (let attempt = 0; attempt < 2; attempt++) {
      await navigate(target, "about:blank", blankMs);
      if (await navigate(target, page, loadMs)) {
        record(attempt ? "retried" : "loaded", start);
        return true;
      }
    }
    record("failed", start);
    hooks.onFailed();
    return false;
  };

  // whatever goes wrong, the reset settles, so the next click starts a new one
  const settle = (target: FrameLike): Promise<boolean> =>
    run(target).catch((error) => {
      console.warn("[reset] the reset failed", error);
      return false;
    });

  return {
    setHooks(next: ResetHooks): void {
      hooks = next;
    },
    // Clicks while a reset is in flight join it; true once the emulator page has loaded.
    reset(): Promise<boolean> {
      if (inFlight) return inFlight;
      const target = frame();
      if (!target) return Promise.resolve(false);
      const known = pageInfo();
      if (known.build) info = known;
      try {
        hooks.beforeReset();
      } catch (error) {
        console.warn("[reset] preparing the reset failed", error);
      }
      inFlight = settle(target).then((loaded) => {
        inFlight = null;
        return loaded;
      });
      return inFlight;
    },
    outcomes(): ResetOutcome[] {
      return outcomes.slice();
    },
    // the last emulator page a reset replaced
    pageInfo(): EmulatorInfo {
      return info;
    },
  };
}

const terminal = createTerminalReset({ frame: emulatorFrame, pageInfo: emulatorPageInfo });

export const resetTerminal = (): Promise<boolean> => terminal.reset();
export const setResetHooks = (hooks: ResetHooks): void => terminal.setHooks(hooks);
export const recentResets = (): ResetOutcome[] => terminal.outcomes();
export const resetPageInfo = (): EmulatorInfo => terminal.pageInfo();
