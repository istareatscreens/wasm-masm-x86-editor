const { app, BrowserWindow, Menu, ipcMain, MenuItem } = require("electron");
const path = require("path");
const url = require("url");
const { autoUpdater } = require("electron-updater");

app.commandLine.appendSwitch("enable-features", "isolate-extensions");

let mainWindow = null;

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    icon: path.join(__dirname, "icon.png"), // build/icon.png (src/images/masm-icon-512w.png)
    webPreferences: {
      // The renderer loads everything from file:// (fetch of the 112MB guest
      // zip + wasm needs webSecurity off) and index-update.js uses
      // require("electron"). Electron >= 12 defaults contextIsolation to true,
      // which would hide `require` from the page, so it is disabled explicitly.
      webSecurity: false,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });
  mainWindow = win;

  win.loadURL("file://" + __dirname + "/index.html");

  //add update listener
  win.once("ready-to-show", () => {
    try { autoUpdater.checkForUpdatesAndNotify(); } catch (e) { /* no update feed in dev */ }
  });
  win.on("closed", () => { if (mainWindow === win) mainWindow = null; });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

//Setup menus
const template = [
  {
    label: "Edit",
    submenu: [
      {
        role: "undo",
      },
      {
        role: "redo",
      },
      {
        type: "separator",
      },
      {
        role: "cut",
      },
      {
        role: "copy",
      },
      {
        role: "paste",
      },
    ],
  },

  {
    label: "View",
    submenu: [
      {
        role: "forceReload",
      },
      {
        role: "reload",
      },
      {
        role: "toggledevtools",
      },
      {
        type: "separator",
      },
      {
        role: "resetzoom",
      },
      {
        role: "zoomin",
      },
      {
        role: "zoomout",
      },
      {
        type: "separator",
      },
      {
        role: "togglefullscreen",
      },
    ],
  },

  {
    role: "window",
    submenu: [
      {
        role: "minimize",
      },
      {
        role: "close",
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);

app.on("activate", async () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

//Check for update
autoUpdater.on("update-available", () => {
  if (mainWindow) mainWindow.webContents.send("update_available");
});
autoUpdater.on("update-downloaded", () => {
  if (mainWindow) mainWindow.webContents.send("update_downloaded");
});

//Restart app
ipcMain.on("restart_app", () => {
  autoUpdater.quitAndInstall();
});
