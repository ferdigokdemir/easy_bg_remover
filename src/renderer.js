// DOM Elements
const previewImage = document.getElementById('preview-image');
const placeholder = document.getElementById('placeholder');
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const imagePreview = document.getElementById('image-preview');
const dragOverlay = document.getElementById('drag-overlay');

// State
let currentImage = null;
let processedImage = null;
let isProcessing = false;

// Constants
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// ==================== Utility Functions ====================

// Show alert message
function showAlert(message, type = 'info') {
  window.electronAPI.showAlert(message, type);
}

// Update progress
function updateProgress(progress) {
  progressText.textContent = `${progress}%`;
}

// Show/hide spinner
function showProgress(show) {
  if (show) {
    progressContainer.classList.remove('hidden');
    placeholder.classList.add('hidden');
    previewImage.classList.add('hidden');
    updateProgress(0);
  } else {
    progressContainer.classList.add('hidden');
  }
}

// Validate file
function validateFile(file) {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported file type. Use JPG, PNG, or WebP.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 20MB.' };
  }
  return { valid: true };
}

// Read file as data URL
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

// ==================== Drag & Drop ====================

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  document.body.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
});

// Show overlay on drag enter
document.body.addEventListener('dragenter', (e) => {
  if (e.dataTransfer.types.includes('Files')) {
    dragOverlay.classList.remove('hidden');
  }
});

// Hide overlay on drag leave (only when leaving the window)
dragOverlay.addEventListener('dragleave', (e) => {
  if (e.relatedTarget === null) {
    dragOverlay.classList.add('hidden');
  }
});

// Handle drop on overlay
dragOverlay.addEventListener('drop', async (e) => {
  dragOverlay.classList.add('hidden');
  const files = Array.from(e.dataTransfer.files).filter(f => SUPPORTED_TYPES.includes(f.type));
  
  if (files.length === 0) {
    showAlert('No valid image files found. Use JPG, PNG, or WebP.', 'error');
    return;
  }

  await handleFileDrop(files[0]);
});

// Single preview drop zone
imagePreview.addEventListener('dragover', (e) => {
  imagePreview.classList.add('drag-over');
});

imagePreview.addEventListener('dragleave', (e) => {
  imagePreview.classList.remove('drag-over');
});

imagePreview.addEventListener('drop', async (e) => {
  imagePreview.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => SUPPORTED_TYPES.includes(f.type));
  if (files.length > 0) {
    await handleFileDrop(files[0]);
  }
});

// ==================== File Handling ====================

async function handleFileDrop(file) {
  if (isProcessing) return;
  
  const validation = validateFile(file);
  if (!validation.valid) {
    showAlert(validation.error, 'error');
    return;
  }

  try {
    const dataUrl = await readFileAsDataURL(file);
    currentImage = {
      path: file.path,
      data: dataUrl,
      name: file.name,
      size: file.size
    };
    
    // Auto process - remove background immediately
    await processImage();
  } catch (error) {
    showAlert('Error loading image: ' + error.message, 'error');
  }
}

// Process image - remove background
async function processImage() {
  if (!currentImage || isProcessing) return;
  
  try {
    isProcessing = true;
    showProgress(true);

    const result = await window.electronAPI.removeBackground(currentImage.path);

    showProgress(false);
    isProcessing = false;

    if (result.success) {
      processedImage = result.data;
      previewImage.src = result.data;
      previewImage.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      placeholder.classList.remove('hidden');
      showAlert('Error: ' + result.error, 'error');
    }
  } catch (error) {
    showProgress(false);
    isProcessing = false;
    placeholder.classList.remove('hidden');
    showAlert('An error occurred: ' + error.message, 'error');
  }
}

// Click on preview to select image (always opens file picker)
imagePreview.addEventListener('click', async () => {
  if (isProcessing) return;
  
  try {
    const result = await window.electronAPI.selectImage();
    
    if (result) {
      if (result.error) {
        showAlert(result.error, 'error');
        return;
      }
      
      currentImage = result;
      
      // Auto process - remove background immediately
      await processImage();
    }
  } catch (error) {
    showAlert('Error selecting image: ' + error.message, 'error');
  }
});

// Right-click to show context menu
imagePreview.addEventListener('contextmenu', async (e) => {
  e.preventDefault();
  
  if (isProcessing) return;
  
  const hasImage = !!processedImage;
  const action = await window.electronAPI.showContextMenu(hasImage);
  
  if (action === 'download' && processedImage) {
    try {
      const originalName = currentImage ? currentImage.name : null;
      const result = await window.electronAPI.saveImage(processedImage, originalName);
      if (!result.success && !result.canceled) {
        showAlert('Save error: ' + result.error, 'error');
      }
    } catch (error) {
      showAlert('An error occurred: ' + error.message, 'error');
    }
  } else if (action === 'clear') {
    // Clear current image
    currentImage = null;
    processedImage = null;
    previewImage.src = '';
    previewImage.classList.add('hidden');
    placeholder.classList.remove('hidden');
  }
});

// ==================== Progress Updates ====================

// Listen for progress updates from main process
window.electronAPI.onProgressUpdate((data) => {
  const { progress } = data;
  updateProgress(progress);
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeProgressListener();
});
