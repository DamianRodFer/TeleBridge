const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isElectron: true,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
  getNgrokUrl: () => ipcRenderer.invoke('ngrok:get-url'),
  restartNgrok: () => ipcRenderer.invoke('ngrok:restart'),
})

// Expose window control functions
contextBridge.exposeInMainWorld('___minimize', () => {
  ipcRenderer.send('window-minimize')
})

contextBridge.exposeInMainWorld('___maximize', () => {
  ipcRenderer.send('window-maximize')
})

contextBridge.exposeInMainWorld('___close', () => {
  ipcRenderer.send('window-close')
})
