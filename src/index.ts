import { app, Menu, ipcMain, BrowserWindow } from "electron";
import { createCapacitorElectronApp } from "@capacitor-community/electron";
import { autoUpdater } from "electron-updater";
import { log } from "electron-log";

let updater;
autoUpdater.autoDownload = false
// The MainWindow object can be accessed via myCapacitorApp.getMainWindow()
const myCapacitorApp = createCapacitorElectronApp({
  mainWindow: {
    windowOptions: { minHeight: 768, minWidth: 1024, modal:true, 
    webPreferences:{
      nodeIntegration: true,
      nativeWindowOpen:true
    }
   }
  }
});

let win: BrowserWindow;
function createDefaultWindow() {
  return new Promise((resolve) => {
    win = new BrowserWindow({
      height: 400,
      width: 400,
      resizable: false,
      minimizable: false,
      maximizable: false,
      show: true,
      parent: myCapacitorApp.getMainWindow(),
      webPreferences: {
        nodeIntegration: true
      }

    });
    win.setMenu(null)
    win.setTitle("")

    win.loadURL(`file://${__dirname}/version.html`)
    win.webContents.on('dom-ready', () => {
      win.show();
      ipcMain.on("updateAction", function (event, data) {
        switch (data) {
          case "success": autoUpdater.quitAndInstall(); break;
          case "start": autoUpdater.downloadUpdate(); break;
          default: win.close(); break;
        }
      })

      resolve(win)
    });

    win.on('closed', () => {
      win = null;
    });
  });
}



autoUpdater.on('checking-for-update', () => {
  //log('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  //log('Update available.');
  createDefaultWindow().then(() => {
    win.webContents.send('message', info)
  });
})
autoUpdater.on('update-not-available', (info) => {
  // log('Update not available.');
})
autoUpdater.on('error', (err) => {
  log('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Tốc độ tải xuống: " + Math.round(progressObj.bytesPerSecond / (1024 * 1024)) + "MB/s";
  log_message = log_message + ' - Đã tải xuống ' + Math.round(progressObj.percent) + '%';
  log_message = log_message + ' (' + Math.round(progressObj.transferred / (1024 * 1024)) + "MB/" + Math.round(progressObj.total / (1024 * 1024)) + 'MB)';
  // log(log_message);
  win.webContents.send('download_progress', log_message)
})
autoUpdater.on('update-downloaded', (info) => {
  // log('Update downloaded');
  win.webContents.send('download_progress', 'success')
});


app.on('ready', function () {
  myCapacitorApp.init()
  // Create the Menu
  Menu.setApplicationMenu(null);
  autoUpdater.checkForUpdates();
});
app.on('window-all-closed', () => {
  app.quit();
});

app.on("activate", function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (myCapacitorApp.getMainWindow().isDestroyed()) myCapacitorApp.init();
});

