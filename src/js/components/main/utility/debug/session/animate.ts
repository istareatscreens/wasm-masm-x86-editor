// Animate repeats one step at a chosen pace; every step is an ordinary stop. It ends at anything that is not
// the end of one of its own steps: a breakpoint, an exception, the program's end, a Break, or stop().
import { Timers } from "../engine/emulator/emulatorEngine";
import { DebugSession } from "./debugSession";
import { SessionEvent } from "./sessionEvents";
import { StepRequest } from "./stepping";

export const ANIMATE_SPEEDS = [1, 2, 5, 10]; // steps a second

export class Animator {
  active = false;
  private request: StepRequest | null = null;
  private interval = 0;
  private issuedAt = 0;
  private timer: unknown = null;

  constructor(readonly session: DebugSession, private readonly timers: Timers, private readonly now: () => number, private readonly changed: (active: boolean) => void) {
    session.listen((event) => this.onEvent(event));
  }

  // Starts stepping from a stopped program. An unknown speed is taken as the slowest.
  async start(stepsPerSecond: number, request: StepRequest): Promise<void> {
    this.stop();
    this.request = request;
    this.interval = 1000 / (ANIMATE_SPEEDS.indexOf(stepsPerSecond) >= 0 ? stepsPerSecond : ANIMATE_SPEEDS[0]);
    this.active = true;
    this.changed(true);
    try {
      await this.next();
    } catch (error) {
      this.stop();
      throw error;
    }
  }

  stop(): void {
    this.timers.clear(this.timer);
    this.timer = null;
    if (!this.active) return;
    this.active = false;
    this.changed(false);
  }

  private next(): Promise<void> {
    this.issuedAt = this.now();
    return this.session.step(this.request);
  }

  private onEvent(event: SessionEvent): void {
    if (!this.active) return;
    if (event.type === "stopped" && event.stop.reason === "step" && !event.stop.text) {
      this.timer = this.timers.set(() => {
        // the step is refused when the program can no longer step: the animation is over, not broken
        if (this.active) this.next().catch(() => this.stop());
      }, Math.max(0, this.interval - (this.now() - this.issuedAt)));
    } else if (event.type === "stopped" || event.type === "exited" || event.type === "ended") {
      this.stop();
    }
  }
}
