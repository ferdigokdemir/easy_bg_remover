const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { Worker } = require('worker_threads');

let mainWindow;

// Constants
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 360,
    minWidth: 700,
    minHeight: 300,
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
      { name: 'Images', extensions: SUPPORTED_EXTENSIONS }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  return processImageFile(filePath);
});

// Process a single image file with size validation
function processImageFile(filePath) {
  try {
    const stats = fs.statSync(filePath);
    
    // File size check
    if (stats.size > MAX_FILE_SIZE) {
      return {
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        path: filePath,
        name: path.basename(filePath)
      };
    }

    const imageBuffer = fs.readFileSync(filePath);
    const base64 = imageBuffer.toString('base64');
    const ext = path.extname(filePath).slice(1).toLowerCase();
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    return {
      path: filePath,
      data: `data:${mimeType};base64,${base64}`,
      name: path.basename(filePath),
      size: stats.size
    };
  } catch (error) {
    return {
      error: error.message,
      path: filePath,
      name: path.basename(filePath)
    };
  }
}

// Handle background removal using Worker Thread
ipcMain.handle('remove-background', async (event, imagePath) => {
  return new Promise((resolve) => {
    const worker = new Worker(path.join(__dirname, 'background-worker.js'), {
      workerData: { imagePath }
    });

    worker.on('message', (message) => {
      if (message.type === 'progress') {
        mainWindow.webContents.send('progress-update', { 
          key: message.key, 
          progress: message.progress 
        });
      } else if (message.type === 'complete') {
        resolve(message);
      }
    });

    worker.on('error', (error) => {
      console.error('Worker error:', error);
      resolve({
        success: false,
        error: error.message
      });
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`Worker stopped with exit code ${code}`);
      }
    });
  });
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
