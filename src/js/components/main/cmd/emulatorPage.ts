// The emulator's page in the terminal's frame, as the app reaches it.
import { EmulatorInfo } from "../crash/bugReport";

export const EMULATOR_PAGE = "boxedwine.html";

export const emulatorFrame = (): HTMLIFrameElement | null => document.getElementById("boxedwine") as HTMLIFrameElement | null;

// what the page says of itself, for a report; empty while no emulator page is loaded
export function emulatorPageInfo(): EmulatorInfo {
  try {
    const frame = emulatorFrame();
    const page = frame && (frame.contentWindow as any);
    return page && page.BW_BUILD_ID ? { build: page.BW_BUILD_ID, runtime: page.BW_USE_MT ? "mt" : "st" } : {};
  } catch (error) {
    return {};
  }
}
