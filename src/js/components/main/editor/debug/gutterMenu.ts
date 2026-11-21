// What a line's menu in the breakpoint gutter offers (the page's Windows 98 menu draws it).
import type { DebugController } from "../../debugger/session/debugController";
import { KEY_LABELS } from "../../debugger/keyboard/debugKeys.js";

export interface MenuItem {
  label?: string;
  onSelect?: () => void;
  disabled?: boolean;
  separator?: boolean;
}

const keyed = (label: string, command: string): string => label + " (" + (KEY_LABELS as { [name: string]: string })[command] + ")";

export function gutterMenuItems(controller: DebugController, file: string, line: number): MenuItem[] {
  const view = controller.view;
  const breakpoint = (view.breakpoints[file] || []).filter((entry) => entry.line === line)[0];
  const stopped = view.phase === "stopped";
  return [
    { label: keyed(breakpoint ? "Remove Breakpoint" : "Insert Breakpoint", "toggleBreakpoint"), onSelect: () => controller.breakpoints.toggle(file, line) },
    { label: keyed(breakpoint && breakpoint.enabled ? "Disable Breakpoint" : "Enable Breakpoint", "enableBreakpoint"), disabled: !breakpoint, onSelect: () => controller.breakpoints.enable(file, line) },
    { label: "Properties…", onSelect: () => controller.openProperties(file, line) },
    { separator: true },
    { label: keyed("Run to Cursor", "runToCursor"), disabled: view.phase === "running" || view.phase === "launching", onSelect: () => void controller.runTo({ file, line }) },
    { label: keyed("Set Next Statement", "setNext"), disabled: !stopped, onSelect: () => void controller.setNext(file, line) },
  ];
}
