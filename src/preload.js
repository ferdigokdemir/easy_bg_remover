const { contextBridge, ipcRenderer } = require('electron');

// Store listener references for cleanup
let progressListener = null;

contextBridge.exposeInMainWorld('electronAPI', {
  selectImage: () => ipcRenderer.invoke('select-image'),
  removeBackground: (imageData) => ipcRenderer.invoke('remove-background', imageData),
  saveImage: (imageData, originalName) => ipcRenderer.invoke('save-image', imageData, originalName),
  showAlert: (message, type) => ipcRenderer.invoke('show-alert', message, type),
  showContextMenu: (hasImage) => ipcRenderer.invoke('show-context-menu', hasImage),
  onProgressUpdate: (callback) => {
    // Remove existing listener to prevent memory leaks
    if (progressListener) {
      ipcRenderer.removeListener('progress-update', progressListener);
    }
    progressListener = (event, data) => callback(data);
    ipcRenderer.on('progress-update', progressListener);
  },
  removeProgressListener: () => {
    if (progressListener) {
      ipcRenderer.removeListener('progress-update', progressListener);
      progressListener = null;
    }
  }
});
