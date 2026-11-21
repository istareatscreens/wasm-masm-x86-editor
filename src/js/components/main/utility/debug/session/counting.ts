// Instruction counts, when the user has switched counting on: how many instructions the program ran since the
// previous stop, and in all. The engine counts; this keeps the two readings and takes undone steps off them.
import { DebugEngine } from "../engine/engine";

const ZERO = BigInt(0);

export const COUNTING_OFF = "Instruction counting is off";
export const COUNTING_UNAVAILABLE = "Instruction counting needs the MASM Runner terminal";

export class Counting {
  on = false;
  private engineCount = ZERO; // the engine's own figure at the latest stop
  private base = ZERO; // its figure when counting was switched on, or at the program's entry point
  private atPreviousStop = ZERO;
  private undone = ZERO;

  constructor(private readonly engine: DebugEngine) {}

  get available(): boolean {
    return this.engine.features.counting;
  }

  async set(on: boolean): Promise<void> {
    if (!this.available) return;
    await this.engine.setCounting(on);
    this.on = on;
    this.base = this.atPreviousStop = this.engineCount;
    this.undone = ZERO;
  }

  // the program's own code starts here: the total counts from the entry point
  restart(): void {
    this.base = this.atPreviousStop = this.engineCount;
    this.undone = ZERO;
  }

  // An engine stop with its count. Stops the user never sees do not move "since the previous stop".
  note(count: string | undefined): void {
    if (count !== undefined && /^\d+$/.test(count)) this.engineCount = BigInt(count);
  }

  // the user lets the program run again: "since the previous stop" starts from here
  resumed(): void {
    this.atPreviousStop = this.current();
  }

  private current(): bigint {
    return this.engineCount - this.undone;
  }

  // Step Back took these instructions back.
  undo(instructions: number): void {
    this.undone += BigInt(instructions);
  }

  // $instructions and $total; null while counting is off
  get sincePreviousStop(): bigint | null {
    return this.on ? this.current() - this.atPreviousStop : null;
  }

  get total(): bigint | null {
    return this.on ? this.current() - this.base : null;
  }
}
