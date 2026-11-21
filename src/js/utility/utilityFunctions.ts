//Remove and add scripts for react
export const removeScript = (scriptToremove: string): void => {
  let allsuspects = <HTMLCollectionOf<HTMLScriptElement>>(
    document.getElementsByTagName("script")
  );
  for (let i = allsuspects.length; i >= 0; i--) {
    if (
      allsuspects[i] &&
      allsuspects[i].getAttribute("src") !== null &&
      allsuspects[i].getAttribute("src").indexOf(`${scriptToremove}`) !== -1
    ) {
      allsuspects[i].parentNode.removeChild(allsuspects[i]);
    }
  }
};

export const addScript = (scriptName: string) => {
  const script = <HTMLScriptElement>document.createElement("script");
  script.src = scriptName;
  script.async = true;
  script.type = "text/javascript";
  document.body.appendChild(script);
};

//Handle post messages and rethrow in document as event
export const createMessageListner = () => {
  window.addEventListener("message", handleMessage, true);
};

const handleMessage = (event: MessageEvent) => {
  //prevent acting on boxedwine execution code
  if (event.data != "zero-timeout-message" && event.data != "") {
    //prevent errors thrown for boxedwine events
    try {
      const { eventName, data } = <{ eventName: string; data: any }>(
        JSON.parse(event.data)
      );
      window.dispatchEvent(new CustomEvent(eventName, { detail: data.data }));
    } catch { }
  }
};

//send post messages
export const postMessage = (eventName: string, data: any) => {
  (<HTMLIFrameElement>(
    document.getElementById("boxedwine")
  )).contentWindow.postMessage(
    JSON.stringify({ eventName: eventName, data: data }),
    "/"
  );
};

//Generate UUID
export const generateRandomID = (): string => {
  // From http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0;
    var v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

//Wait for event and then time out
//TODO use this with FileSystem operations to enusre proper handling of files
//even when console is not accessible, or error has occured
export const sleepUntil = async () => (
  callback: () => any,
  timeoutMs: number,
  resolutionCallback: () => any = () => { },
  rejectionCallback: () => any = () => { },
  delayBetweenChecks: number = 20
): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    if (callback()) resolve(resolutionCallback());
    const timeWas: number = new Date().getTime();
    let wait = setInterval(function () {
      if (callback()) {
        clearInterval(wait);
        resolve(resolutionCallback());
      } else if (new Date().getTime() - timeWas > timeoutMs) {
        // Timeout
        clearInterval(wait);
        reject(rejectionCallback());
      }
    }, delayBetweenChecks);
  });
};

//The iframe's direct control API (Boxedwine.jsx: window.bwApp), called cross-frame (same origin). null until the
//iframe publishes it; the callers then fall back to the postMessage bridge, which runs the same handlers.
export const getBwApp = (): any => {
  try {
    const iframe = <HTMLIFrameElement>document.getElementById("boxedwine");
    return iframe && iframe.contentWindow ? (<any>iframe.contentWindow).bwApp : null;
  } catch {
    return null;
  }
};

// Quote a file name for a cmd command line when it needs it (spaces or characters
// cmd treats specially); a plain name is passed through unchanged.
export const quoteForCmd = (name: string): string =>
  /[\s&()^;,=|<>]/.test(name) ? '"' + name + '"' : name;

export const writeCommandToCMD = (command: string): void => {
  const app = getBwApp();
  if (app && typeof app.writeCommand === "function") return app.writeCommand(command);
  postMessage("write-command", { data: command });
};

//Writes a file into the guest (content is base64 when isBinary); the iframe verifies it and posts "file-synced"
//{op, filename, ok}.
export const syncFileToEmulator = (filename: string, content: string, isBinary: boolean = false): void => {
  const app = getBwApp();
  if (app && typeof app.syncFile === "function") return app.syncFile(filename, content, isBinary);
  postMessage("sync-file", { data: { filename, content, isBinary } });
};

//Hands the whole drawer to the emulator on every "emulator-ready": the iframe rebuilds D: from it, then opens its
//input gate. files: [{filename, content, isBinary}] (base64 when isBinary); folders: every folder path, empty ones
//included; drives: the other drives [{id, letter, label}], mapped before the files are written (D: has no label).
export const reconcileEmulatorFiles = (files: { filename: string; content: string; isBinary: boolean }[], folders: string[] = [], drives: GuestDrive[] = []): void => {
  const app = getBwApp();
  if (app && typeof app.reconcile === "function") return app.reconcile(files, folders, drives);
  postMessage("reconcile-files", { data: { files, folders, drives } });
};

export interface GuestDrive {
  id: string;
  letter: string;
  label: string;
}

//A drive in the terminal: its folder of the drive store, its label (.windows-label, `vol E:`) and its
//letter mapped (Module.bwMapDrive). Mapping again writes the label again, and moves the drive when its letter
//changed (another tab took that letter at the same time).
export const mapDriveInEmulator = (drive: GuestDrive): void => {
  const app = getBwApp();
  if (app && typeof app.mapDrive === "function") return app.mapDrive(drive);
  postMessage("map-drive", { data: drive });
};

//A deleted drive: its letter unmapped and its folder of the drive store removed.
export const removeDriveFromEmulator = (drive: GuestDrive): void => {
  const app = getBwApp();
  if (app && typeof app.removeDrive === "function") return app.removeDrive(drive);
  postMessage("remove-drive", { data: drive });
};

//Renames a file in the guest (Module.bwRenameFile; falls back to delete + write of `content`).
export const renameFileInEmulator = (oldName: string, newName: string, content: string, isBinary: boolean = false): void => {
  const app = getBwApp();
  if (app && typeof app.renameFile === "function") return app.renameFile(oldName, newName, content, isBinary);
  postMessage("rename-file", { data: { oldName, newName, content, isBinary } });
};

//Guest D: listing [{name,size,dir}], recursive with "/" paths, for sync checks (null
//before the emulator is up).
export const getEmulatorFileTree = (): any[] | null => {
  const app = getBwApp();
  try { return app && typeof app.verifyTree === "function" ? app.verifyTree() : null; } catch { return null; }
};

//Writes the .asm to D: and types the build in one step in the iframe (no write/run race); content is the
//source's stored bytes as base64 when isBase64, else text.
export const assembleAndRun = (filename: string, content: string, isBase64: boolean = false): void => {
  const app = getBwApp();
  if (app && typeof app.build === "function") return app.build(filename, content, isBase64);
  postMessage("build-file", { data: { filename, content, isBase64 } });
};

//Run the program a build of the .asm `filename` made (bin\<name>.exe), from the source's folder on its own drive
//(the emulator page composes the command from its own drive map).
export const runInEmulator = (filename: string): void => {
  const app = getBwApp();
  if (app && typeof app.run === "function") return app.run(filename);
  postMessage("run-file", { data: filename });
};

//Build a program by its build plan (components/main/banner/build/buildRequest.ts): the emulator page writes the
//plan's files as stored, deletes their stale outputs, types assemble in the program's folder and reads the outputs
//back.
export const buildPlanInEmulator = (request: object): void => {
  const app = getBwApp();
  if (app && typeof app.buildPlan === "function") return app.buildPlan(request);
  postMessage("build-plan", { data: request });
};

//A question the emulator page answers once its input is open. It fails as soon as the frame shows another page (a
//reset): the page that would answer is gone, and its promise would never settle.
const askPage = <T>(method: string, args: unknown[]): Promise<T> => {
  const frame = <HTMLIFrameElement>document.getElementById("boxedwine");
  const app = getBwApp();
  if (!frame || !app || typeof app[method] !== "function") return Promise.reject(new Error("the emulator page is not loaded"));
  return new Promise<T>((resolve, reject) => {
    const settle = () => frame.removeEventListener("load", onLoad);
    const onLoad = () => {
      let same = false;
      try { same = (<any>frame.contentWindow).bwApp === app; } catch {}
      if (same) return; // the asking page's own load event
      settle();
      reject(new Error("the emulator page was reloaded"));
    };
    frame.addEventListener("load", onLoad);
    app[method](...args).then(
      (value: T) => { settle(); resolve(value); },
      (error: unknown) => { settle(); reject(error); }
    );
  });
};

//The bytes of entries of a toolchain archive (the toolchain's, at C:\files in the guest, by default; or
//"/irvine.zip"): { [entry name]: Uint8Array }.
export const readToolchainFiles = (names: string[], archive?: string): Promise<{ [name: string]: Uint8Array }> =>
  askPage("readToolchainFiles", [names, archive]);

//The toolchain's folders' file names: C:\files\irvine (and C:\Irvine) and C:\files\lib.
export const listToolchain = (): Promise<{ irvine: string[]; lib: string[] }> => askPage("listToolchain", []);

//Give the terminal the keyboard: SDL reads keys on the emulator page's window.
export const focusTerminal = (): void => {
  try {
    const iframe = <HTMLIFrameElement>document.getElementById("boxedwine");
    if (iframe && iframe.contentWindow) iframe.contentWindow.focus();
  } catch {}
};

//Deletes a file from the guest (Module.bwDeleteFile): cmd's next `dir` no longer shows it.
export const deleteFileFromEmulator = (filename: string): void => {
  const app = getBwApp();
  if (app && typeof app.deleteFile === "function") return app.deleteFile(filename);
  postMessage("delete-file", { data: filename });
};

//Create a folder (and its parents) on the guest D: via Module.bwMakeDir, so the running
//cmd's `dir` lists it at once - no `mkdir` typed. path: drawer path ("lab1/io").
export const makeDirInEmulator = (path: string): void => {
  const app = getBwApp();
  if (app && typeof app.makeDir === "function") return app.makeDir(path);
  postMessage("make-dir", { data: path });
};

//Remove an EMPTY folder from the guest D: via Module.bwRemoveDir (the drawer deletes
//its files first, then the folders deepest first) - no `rd` typed.
export const removeDirFromEmulator = (path: string): void => {
  const app = getBwApp();
  if (app && typeof app.removeDir === "function") return app.removeDir(path);
  postMessage("remove-dir", { data: path });
};

//Ctrl+C in the terminal: conhost raises CTRL_C_EVENT (a MASM program without a handler exits, cmd returns to the
//prompt). Nothing is reloaded or lost.
export const interruptEmulator = (): void => {
  const app = getBwApp();
  if (app && typeof app.interrupt === "function") return app.interrupt();
  postMessage("interrupt", {});
};

//Is the emulator currently detected as frozen/hardlocked? (heartbeat stalled).
//Returns false if unknown/healthy. See Boxedwine.jsx startFreezeDetector.
export const isEmulatorFrozen = (): boolean => {
  const app = getBwApp();
  try { return !!(app && typeof app.isFrozen === "function" && app.isFrozen()); }
  catch { return false; }
};

//Check if two arrays contain the same elements (unordered, no duplicate elements)
export const checkIfEqualArraysNoDuplicateElements = (
  array1: [any],
  array2: [any]
) =>
  array1.length === array2.length &&
  array1.every((val) => array2.includes(val));

//Cancelable promise
export const cancellablePromise = (promise: Promise<any>) => {
  let isCanceled = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      (value) => (isCanceled ? reject({ isCanceled, value }) : resolve(value)),
      (error) => reject({ isCanceled, error })
    );
  });

  return {
    promise: wrappedPromise,
    cancel: () => (isCanceled = true),
  };
};

//Rename object key
//Source: https://jetrockets.pro/blog/rmvzzosmz9-rename-the-key-name-in-the-javascript-object
export const renameObjectKey = (object: any, key: string, newKey: string) => {
  const clone = (obj: any) => Object.assign({}, obj);
  const clonedObj = clone(object);

  const targetKey = clonedObj[key];

  delete clonedObj[key];

  clonedObj[newKey] = targetKey;

  return clonedObj;
};

// Windows file-name rules (the files live on the guest's D: and are typed into cmd; spaces inside a name are fine).
// Returns null for a valid name, else a short reason for the UI.
export const invalidFilenameReason = (name: string): string | null => {
  if (!name) return "enter a name";
  if (name.length > 255) return "name is too long";
  if (/[\\/:*?"<>|]/.test(name)) return 'a name cannot contain \\ / : * ? " < > |';
  if (/[\x00-\x1f]/.test(name)) return "a name cannot contain control characters";
  if (name !== name.trim()) return "a name cannot start or end with a space";
  if (/\.$/.test(name)) return "a name cannot end with a dot";
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(\.|$)/i.test(name)) return "that name is reserved by Windows";
  return null;
};

export const checkFileExtension = (fileExtension: string, filename: string) => {
  return new RegExp(`${fileExtension}$`).test(filename);
};

export const getFileExtension = (filename: string) => {
  const extension = filename.match(/\.[0-9a-z]+$/i);
  if (extension) {
    return extension[0];
  } else {
    return "";
  }
};
