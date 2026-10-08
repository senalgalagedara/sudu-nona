const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sudu', {
  clearProfile: id => ipcRenderer.invoke('clear-profile', id)
});
