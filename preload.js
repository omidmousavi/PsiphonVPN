const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  writeConfig: (filePath) => ipcRenderer.invoke('write-config', filePath),
  startProcess: () => ipcRenderer.invoke('start-process'),
  stopProcess: () => ipcRenderer.invoke('stop-process'),
  onProcessError: (callback) => ipcRenderer.on('process-error', (event, data) => callback(data)),
  onProcessExit: (callback) => ipcRenderer.on('process-exit', (event, code) => callback(code)),
});
