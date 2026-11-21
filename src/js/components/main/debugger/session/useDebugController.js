import React, { useEffect, useMemo, useRef, useState } from "react";

import ConfirmWindow from "../../filedrawer/dialogs/ConfirmWindow.jsx";
import FileSystem from "../../utility/FileSystem.js";
import { isWithin } from "../../utility/filesystem/paths";
import { focusTerminal } from "../../../../utility/utilityFunctions.ts";
import { DebugController } from "./debugController";
import { DEBUG_KEY } from "./debugStorage";

// One DebugController for the page's life. `on` is the banner's Debug switch; `element` is the open message box.
export default function useDebugController({ on, filename, switchFile, viewMode, terminalDown }) {
  const app = useRef(null);
  app.current = { filename, switchFile, viewMode, terminalDown };
  const [box, setBox] = useState(null);

  const controller = useMemo(
    () =>
      new DebugController({
        openFile: () => app.current.filename,
        showTerminal: (focus) => {
          app.current.viewMode.showTerminal();
          if (focus) focusTerminal();
        },
        showBox: (message) => setBox({ ...message, choices: [{ label: "OK" }] }),
        ask: (message, choices) => setBox({ ...message, choices }),
        follow: (file) => {
          if (file !== app.current.filename) app.current.switchFile(file);
        },
        terminalDown: () => !!app.current.terminalDown,
      }),
    [],
  );

  // switched on, the adapter is greeted and told the page's breakpoints; switched off, a session ends
  useEffect(() => {
    if (on) controller.ready().catch((error) => console.error("[debugger] the adapter did not start", error));
    else controller.endQuietly("Debugging stopped");
  }, [on, controller]);

  // what is kept, when another tab changed it; and the files the drawer renames, moves and deletes
  useEffect(() => {
    const reread = () => document.visibilityState === "visible" && controller.rereadStored();
    const onStorage = (event) => (event.key === DEBUG_KEY || event.key === null) && reread();
    const onFile = (change) =>
      controller.breakpoints.relocate(
        (path) => (change.from !== undefined && (path === change.from || isWithin(path, change.from)) ? change.to + path.slice(change.from.length) : null),
        (path) => path === change.gone,
      );
    document.addEventListener("visibilitychange", reread);
    window.addEventListener("storage", onStorage);
    FileSystem.changeListeners.add(onFile);
    return () => {
      document.removeEventListener("visibilitychange", reread);
      window.removeEventListener("storage", onStorage);
      FileSystem.changeListeners.delete(onFile);
    };
  }, [controller]);

  const element = box && (
    <ConfirmWindow title={box.title} icon={box.icon} message={box.message} details={box.details} choices={box.choices} close={() => setBox(null)} />
  );
  return { controller, element };
}
