const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectImage: () => ipcRenderer.invoke('select-image'),
  removeBackground: (imageData) => ipcRenderer.invoke('remove-background', imageData),
  saveImage: (imageData, originalName) => ipcRenderer.invoke('save-image', imageData, originalName),
  onProgressUpdate: (callback) => {
    ipcRenderer.on('progress-update', (event, data) => callback(data));
  }
});
