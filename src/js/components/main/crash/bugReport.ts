// A GitHub issue for the project, filled in for the user to read, edit and submit.
import { EMULATED_CPU } from "./invalidOpcode";

export const ISSUES_URL = "https://github.com/istareatscreens/wasm-masm-x86-editor/issues/new";

// what the emulator page reports with a crash (boxedwine-shell.js)
export type EmulatorInfo = { build?: string; runtime?: string };

const PROGRAM_PROMPT = "<!-- Please paste the program, or the lines around this instruction, if you can. -->";

const environment = (info: EmulatorInfo, file: string) =>
  [
    "- Emulator build: " + (info.build || "unknown") + (info.runtime ? " (" + (info.runtime === "mt" ? "multi-threaded" : "single-threaded") + ")" : ""),
    "- Browser: " + (typeof navigator !== "undefined" ? navigator.userAgent : "unknown"),
    file ? "- File open in the editor: " + file : "",
  ].filter(Boolean);

export function issueUrl(title: string, body: string): string {
  return ISSUES_URL + "?labels=bug&title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body);
}

// an instruction the emulated CPU should run raised the invalid-opcode exception
export function invalidOpcodeIssue(found: { text: string; bytes: string; features: string[] }, address: string, info: EmulatorInfo, file: string): string {
  return issueUrl(
    "Emulator: " + found.text + " stops a program with an illegal instruction",
    [
      "A program stopped with \"illegal instruction\" at an instruction the emulated CPU (" + EMULATED_CPU + ") should run.",
      "",
      "- Instruction: `" + found.text + "` (bytes `" + found.bytes + "`, CPU feature " + found.features.join(", ") + ")",
      "- Address: " + address,
      ...environment(info, file),
      "",
      "**Program**",
      PROGRAM_PROMPT,
    ].join("\n")
  );
}

// a WebAssembly trap or an abort in the emulator
export function emulatorCrashIssue(crash: EmulatorInfo & { message?: string; stack?: string }, file: string): string {
  const message = String(crash.message || "unknown error").slice(0, 300);
  return issueUrl(
    "Emulator crash: " + message.split("\n")[0].slice(0, 100),
    [
      "The terminal stopped because of an emulator error.",
      "",
      "- Error: `" + message.replace(/`/g, "'") + "`",
      ...environment(crash, file),
      "",
      "**Stack**",
      "```",
      String(crash.stack || "").slice(0, 1500),
      "```",
      "",
      "**What was running**",
      "<!-- What did you run when it stopped? Please paste the program if you can. -->",
    ].join("\n")
  );
}
