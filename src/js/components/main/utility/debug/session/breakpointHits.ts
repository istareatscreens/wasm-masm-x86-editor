import { Breakpoint } from "./breakpoints";

// An expression's value where the program is now, as text, and whether it counts as true. Throws an Error
// whose message is for the user when the expression cannot be evaluated.
export type ConditionEvaluator = (expression: string) => Promise<{ text: string; truthy: boolean }>;

export interface HitDecision {
  stop: boolean;
  ids: number[]; // the breakpoints that stop the program
  logs: string[]; // lines for the console
  error: string; // a condition that could not be evaluated: the program stops, and this says why
}

const CHANGED = /^\s*changed\s*\(([\s\S]*)\)\s*$/i;

// "sum is {eax,d}": each {expression} gives its value, or its error in the braces
export async function formatLog(message: string, evaluate: ConditionEvaluator): Promise<string> {
  let text = "";
  let at = 0;
  for (const part = /\{([^{}]*)\}/g; ; ) {
    const match = part.exec(message);
    if (!match) break;
    text += message.slice(at, match.index);
    try {
      text += (await evaluate(match[1])).text;
    } catch (error) {
      text += "{" + (error instanceof Error ? error.message : String(error)) + "}";
    }
    at = match.index + match[0].length;
  }
  return text + message.slice(at);
}

export async function decideHit(breakpoints: Breakpoint[], evaluate: ConditionEvaluator): Promise<HitDecision> {
  const decision: HitDecision = { stop: false, ids: [], logs: [], error: "" };
  for (const breakpoint of breakpoints) {
    const { condition, logMessage } = breakpoint.options;
    if (condition && condition.trim()) {
      const changed = CHANGED.exec(condition);
      let passes: boolean;
      try {
        const value = await evaluate(changed ? changed[1] : condition);
        // "has changed": true from the second time on, when the value is not what it was the time before
        passes = changed ? breakpoint.lastValue !== undefined && breakpoint.lastValue !== value.text : value.truthy;
        if (changed) breakpoint.lastValue = value.text;
      } catch (error) {
        decision.stop = true;
        decision.ids.push(breakpoint.id);
        decision.error = decision.error || "Condition error: " + (error instanceof Error ? error.message : String(error));
        continue;
      }
      if (!passes) continue;
    }
    breakpoint.hits++;
    const hit = breakpoint.hit;
    if (hit && !(hit.test === "=" ? breakpoint.hits === hit.count : hit.test === ">=" ? breakpoint.hits >= hit.count : breakpoint.hits % hit.count === 0)) continue;
    if (logMessage) {
      decision.logs.push(await formatLog(logMessage, evaluate));
      continue;
    }
    decision.stop = true;
    decision.ids.push(breakpoint.id);
  }
  return decision;
}
