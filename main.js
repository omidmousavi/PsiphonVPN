// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const exec = require('child_process').exec;

var config = {
  isDev: false,
  psiphonDevPath: path.join(__dirname, "psiphon", "psiphon"),
  psiphonPath: path.join(process.resourcesPath, "psiphon", "psiphon"),
  psiphonConfigPath: path.join(app.getPath("appData"), "psiphon.config"),
  proxyHost: "127.0.0.1",
  proxyPort: 1080
}

let psiphonProcess;

var mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 300,
    height: 400,
    resizable: false,
    title: "Psiphon VPN",
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
    }
  })

  mainWindow.removeMenu()

  mainWindow.loadFile('./index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
});


app.on('before-quit', function () {
  stopPsiphonProcess();
});


function startPsiphonProcess() {

  if (!fs.existsSync(config.psiphonConfigPath)) {
    dialog.showErrorBox("Psiphon config error", "Please import psiphon config file");
    mainWindow.webContents.send('process-exit', 0);
    return;
  }
  
  let data = fs.readFileSync(config.psiphonConfigPath);
  try {
    data = JSON.parse(data);
    config.proxyPort = data["LocalSocksProxyPort"];
  } catch (error) {
    dialog.showErrorBox("Psiphon config error", "psiphon config format error, it must be JSON");
    mainWindow.webContents.send('process-exit', 0);
    return;
  }

  if (config.isDev) {
    psiphonProcess = spawn(config.psiphonDevPath, ["-config", config.psiphonConfigPath]);
  } else {
    psiphonProcess = spawn(config.psiphonPath, ["-config", config.psiphonConfigPath]);
  }

  psiphonProcess.stderr.on('data', (data) => {
    try {
      console.log(data.toString());
      mainWindow.webContents.send('process-error', data.toString());
    } catch (e) { return }
  });

  psiphonProcess.on('close', (code) => {
    try {
      mainWindow.webContents.send('process-exit', code);
      disableLinuxProxy();
    } catch (e) { return }
  });

  setLinuxProxy(config.proxyHost, config.proxyPort);
}

function stopPsiphonProcess() {
  if (psiphonProcess) {
    psiphonProcess.kill();
    psiphonProcess = null;
  }
}

function setLinuxProxy(host, port) {
  exec(`gsettings set org.gnome.system.proxy mode 'manual' && gsettings set org.gnome.system.proxy.socks host '${host}' && gsettings set org.gnome.system.proxy.socks port ${port}`);
}

function disableLinuxProxy() {
  exec(`gsettings set org.gnome.system.proxy mode none`);
}

ipcMain.handle('start-process', () => {
  startPsiphonProcess();
});

ipcMain.handle('stop-process', () => {
  stopPsiphonProcess();
});

ipcMain.handle('open-file-dialog', async (event) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile']
  });
  return result.filePaths;
});

ipcMain.handle('write-config', (event, filePath) => {
  try {
    fs.copyFile(filePath, config.psiphonConfigPath, function () { })
  } catch (error) {
    dialog.showMessageBox(error);
  }
  return;
});