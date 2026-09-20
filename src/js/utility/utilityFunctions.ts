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

//Direct control API published by the iframe (Boxedwine.jsx: window.bwApp). The
//iframe is same-origin, so the parent can call these embind-backed handlers as
//plain cross-frame function calls — no JSON (de)serialization, no CustomEvent hop,
//and no entanglement with BoxedWine's own internal postMessage traffic. Returns
//null until the iframe has booted far enough to publish the API, in which case the
//callers fall back to the postMessage bridge (which drives the identical handlers).
const getBwApp = (): any => {
  try {
    const iframe = <HTMLIFrameElement>document.getElementById("boxedwine");
    return iframe && iframe.contentWindow ? (<any>iframe.contentWindow).bwApp : null;
  } catch {
    return null;
  }
};

//Send a command to the console. Delivered as a raw string into the emulator's
//direct-input embind API (Module.sendText) — no synthetic DOM KeyboardEvents, no
//per-character key map. Prefers the direct bwApp call; falls back to postMessage.
// Quote a file name for a cmd command line when it needs it (spaces or characters
// cmd treats specially); a plain name is passed through unchanged.
export const quoteForCmd = (name: string): string =>
  /[\s&()^;,=|<>]/.test(name) ? '"' + name + '"' : name;

export const writeCommandToCMD = (command: string): void => {
  const app = getBwApp();
  if (app && typeof app.writeCommand === "function") return app.writeCommand(command);
  postMessage("write-command", { data: command });
};

//Sync a file's content directly into the guest filesystem (writable D: drive)
//via Module.bwWriteFile (text) / bwWriteFileBytes (isBinary: base64 content), so
//the running cmd sees it in `dir` with NO echo. The iframe verifies the guest
//tree afterwards and posts "file-synced" {op, filename, ok}.
export const syncFileToEmulator = (filename: string, content: string, isBinary: boolean = false): void => {
  const app = getBwApp();
  if (app && typeof app.syncFile === "function") return app.syncFile(filename, content, isBinary);
  postMessage("sync-file", { data: { filename, content, isBinary } });
};

//Hand the WHOLE drawer to the emulator: the iframe rebuilds D: from
//it, verifies the tree and only then opens its input gate. Called on every
//"emulator-ready" (cold boot or restore — the factory image holds no user file).
//files: [{filename, content, isBinary}] (content = text, or base64 when isBinary).
export const reconcileEmulatorFiles = (files: { filename: string; content: string; isBinary: boolean }[]): void => {
  const app = getBwApp();
  if (app && typeof app.reconcile === "function") return app.reconcile(files);
  postMessage("reconcile-files", { data: { files } });
};

//Rename a file inside the guest filesystem (Module.bwRenameFile — the node's own
//rename, so cmd's next `dir` shows the new name and not the old one; falls back
//to delete+write with `content`). No `ren`/`echo` keystrokes.
export const renameFileInEmulator = (oldName: string, newName: string, content: string, isBinary: boolean = false): void => {
  const app = getBwApp();
  if (app && typeof app.renameFile === "function") return app.renameFile(oldName, newName, content, isBinary);
  postMessage("rename-file", { data: { oldName, newName, content, isBinary } });
};

//Guest D: listing [{name,size}] for sync checks (null before the emulator is up).
export const getEmulatorFileTree = (): any[] | null => {
  const app = getBwApp();
  try { return app && typeof app.verifyTree === "function" ? app.verifyTree() : null; } catch { return null; }
};

//Atomically place a .asm on D: and assemble->link->run it. Sequenced in the
//iframe (write then type the assemble command) so there is no write/run race, and
//the .obj/.exe readback runs in the iframe where Module.FS is local. Toolchain
//lives read-only at C:\files (drive-agnostic assemble.bat via %~dp0); cwd is D:.
export const assembleAndRun = (filename: string, content: string): void => {
  const app = getBwApp();
  if (app && typeof app.build === "function") return app.build(filename, content);
  postMessage("build-file", { data: { filename, content } });
};

//Delete a file directly from the guest filesystem via Module.bwDeleteFile so the
//running cmd's `dir` stops showing it — WITHOUT typing a `del` command (keystrokes).
//More efficient + reliable, and stays cmd-synced (the FsNode leaves the parent tree).
//Direct call with postMessage fallback, matching the other controls.
export const deleteFileFromEmulator = (filename: string): void => {
  const app = getBwApp();
  if (app && typeof app.deleteFile === "function") return app.deleteFile(filename);
  postMessage("delete-file", { data: filename });
};

//Interrupt whatever runs in the terminal (Ctrl+C): the emulator injects the key
//transitions through the same X11 path as the keyboard, conhost turns them into a
//CTRL_C_EVENT for the console's processes (a MASM program without a handler exits,
//cmd returns to the prompt). Nothing is reloaded, nothing is lost.
export const interruptEmulator = (): void => {
  const app = getBwApp();
  if (app && typeof app.interrupt === "function") return app.interrupt();
  postMessage("interrupt", {});
};

//Reset the terminal by RELOADING the emulator iframe from the parent.
//One implementation for ST and MT that works even when the emulator's JS is wedged
//(the browser tears the wasm instance down); the reload lands on the watchdog-
//protected instant-restore / cold-boot path. Data-safe: the user's files live in
//this parent app's IndexedDB, never inside the iframe. The old in-iframe
//restartBW()+callMain() path deadlocked thread 0 under PROXY_TO_PTHREAD (MT).
export const resetEmulator = (): void => {
  const iframe = <HTMLIFrameElement>document.getElementById("boxedwine");
  if (!iframe) return;
  try { iframe.contentWindow.location.reload(); }
  catch { try { iframe.src = iframe.src; } catch { postMessage("reset", {}); } }
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

// Windows file-name rules (the files live on the guest's D: drive and are typed
// into cmd): spaces are fine anywhere inside the name; not allowed are the
// characters \ / : * ? " < > |, control characters, a leading/trailing space, a
// trailing dot, the reserved device names (CON, PRN, AUX, NUL, COM1-9, LPT1-9,
// with or without an extension) and names over 255 characters. Returns null for
// a valid name, else a short reason for the UI.
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
