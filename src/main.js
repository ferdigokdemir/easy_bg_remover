const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#ffffff'
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle file selection
ipcMain.handle('select-image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString('base64');
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

  return {
    path: filePath,
    data: `data:${mimeType};base64,${base64}`,
    name: path.basename(filePath)
  };
});

// Handle background removal
ipcMain.handle('remove-background', async (event, imagePath) => {
  try {
    const { removeBackground } = await import('@imgly/background-removal-node');
    
    // Use file:// URL format
    const fileUrl = `file://${imagePath}`;
    
    // Remove background
    const resultBlob = await removeBackground(fileUrl, {
      progress: (key, current, total) => {
        const progress = Math.round((current / total) * 100);
        mainWindow.webContents.send('progress-update', { key, progress });
      }
    });

    // Convert result to base64
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = resultBuffer.toString('base64');

    return {
      success: true,
      data: `data:image/png;base64,${resultBase64}`
    };
  } catch (error) {
    console.error('Background removal error:', error);
    return {
      success: false,
      error: error.message
    };
  }
});

// Handle save file
ipcMain.handle('save-image', async (event, imageData, originalName) => {
  const defaultName = originalName ? 
    originalName.replace(/\.[^/.]+$/, '') + '_no_bg.png' : 
    'image_no_bg.png';

  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: [
      { name: 'PNG Image', extensions: ['png'] }
    ]
  });

  if (result.canceled) {
    return { success: false, canceled: true };
  }

  try {
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(result.filePath, buffer);
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
