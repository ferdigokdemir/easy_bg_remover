// DOM Elements
const removeBtn = document.getElementById('remove-btn');
const saveBtn = document.getElementById('save-btn');
const originalImage = document.getElementById('original-image');
const resultImage = document.getElementById('result-image');
const originalPlaceholder = document.getElementById('original-placeholder');
const resultPlaceholder = document.getElementById('result-placeholder');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const statusMessage = document.getElementById('status-message');
const originalPreview = document.getElementById('original-preview');
const dragOverlay = document.getElementById('drag-overlay');

// State
let currentImage = null;
let processedImage = null;

// Constants
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// ==================== Utility Functions ====================

// Show status message
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.classList.remove('hidden');
  
  if (type !== 'loading') {
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 5000);
  }
}

// Hide status message
function hideStatus() {
  statusMessage.classList.add('hidden');
}

// Update progress bar
function updateProgress(progress, text) {
  progressFill.style.width = `${progress}%`;
  progressText.textContent = text || `Processing... ${progress}%`;
}

// Show/hide progress
function showProgress(show) {
  if (show) {
    progressContainer.classList.remove('hidden');
    updateProgress(0, 'Starting...');
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
    showStatus('No valid image files found. Use JPG, PNG, or WebP.', 'error');
    return;
  }

  await handleFileDrop(files[0]);
});

// Single preview drop zone
originalPreview.addEventListener('dragover', (e) => {
  originalPreview.classList.add('drag-over');
});

originalPreview.addEventListener('dragleave', (e) => {
  originalPreview.classList.remove('drag-over');
});

originalPreview.addEventListener('drop', async (e) => {
  originalPreview.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => SUPPORTED_TYPES.includes(f.type));
  if (files.length > 0) {
    await handleFileDrop(files[0]);
  }
});

// ==================== File Handling ====================

async function handleFileDrop(file) {
  const validation = validateFile(file);
  if (!validation.valid) {
    showStatus(validation.error, 'error');
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
    
    originalImage.src = dataUrl;
    originalImage.classList.remove('hidden');
    originalPlaceholder.classList.add('hidden');
    
    // Reset result
    resultImage.classList.add('hidden');
    resultPlaceholder.classList.remove('hidden');
    processedImage = null;
    
    removeBtn.disabled = false;
    saveBtn.disabled = true;
    
    showStatus('Image loaded. Click the button to remove background.', 'success');
  } catch (error) {
    showStatus('Error loading image: ' + error.message, 'error');
  }
}

// Click on original preview to select image
originalPreview.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectImage();
    
    if (result) {
      if (result.error) {
        showStatus(result.error, 'error');
        return;
      }
      
      currentImage = result;
      originalImage.src = result.data;
      originalImage.classList.remove('hidden');
      originalPlaceholder.classList.add('hidden');
      
      // Reset result
      resultImage.classList.add('hidden');
      resultPlaceholder.classList.remove('hidden');
      processedImage = null;
      
      removeBtn.disabled = false;
      saveBtn.disabled = true;
      
      showStatus('Image loaded. Click the button to remove background.', 'success');
    }
  } catch (error) {
    showStatus('Error selecting image: ' + error.message, 'error');
  }
});

// Remove background button click
removeBtn.addEventListener('click', async () => {
  if (!currentImage) {
    showStatus('Please select an image first.', 'error');
    return;
  }

  try {
    removeBtn.disabled = true;
    showProgress(true);
    showStatus('Removing background... This may take a moment.', 'loading');

    const result = await window.electronAPI.removeBackground(currentImage.path);

    showProgress(false);

    if (result.success) {
      processedImage = result.data;
      resultImage.src = result.data;
      resultImage.classList.remove('hidden');
      resultPlaceholder.classList.add('hidden');
      
      saveBtn.disabled = false;
      removeBtn.disabled = false;
      
      showStatus('Background removed successfully!', 'success');
    } else {
      removeBtn.disabled = false;
      showStatus('Error: ' + result.error, 'error');
    }
  } catch (error) {
    showProgress(false);
    removeBtn.disabled = false;
    showStatus('An error occurred: ' + error.message, 'error');
  }
});

// Save button click
saveBtn.addEventListener('click', async () => {
  if (!processedImage) {
    showStatus('No image to save.', 'error');
    return;
  }

  try {
    const originalName = currentImage ? currentImage.name : null;
    const result = await window.electronAPI.saveImage(processedImage, originalName);

    if (result.success) {
      showStatus('Image saved successfully: ' + result.path, 'success');
    } else if (!result.canceled) {
      showStatus('Save error: ' + result.error, 'error');
    }
  } catch (error) {
    showStatus('An error occurred: ' + error.message, 'error');
  }
});

// ==================== Progress Updates ====================

// Listen for progress updates from main process
window.electronAPI.onProgressUpdate((data) => {
  const { key, progress } = data;
  let statusText = 'Processing...';
  
  if (key.includes('download')) {
    statusText = 'Downloading model...';
  } else if (key.includes('compute')) {
    statusText = 'Analyzing background...';
  }
  
  updateProgress(progress, `${statusText} ${progress}%`);
});

// Cleanup on window unload
window.addEventListener('beforeunload', () => {
  window.electronAPI.removeProgressListener();
});
