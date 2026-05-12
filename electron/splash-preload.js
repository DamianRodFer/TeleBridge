const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onLoadStatus: (callback) => {
    ipcRenderer.on('load-status', (event, msg) => callback(msg))
  },
})
