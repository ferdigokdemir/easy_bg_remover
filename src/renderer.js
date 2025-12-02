// DOM Elements
const removeBtn = document.getElementById('remove-btn');
const saveBtn = document.getElementById('save-btn');
const originalImage = document.getElementById('original-image');
const resultImage = document.getElementById('result-image');
const originalPlaceholder = document.getElementById('original-placeholder');
const resultPlaceholder = document.getElementById('result-placeholder');
const progressContainer = document.getElementById('progress-container');
const progressText = document.getElementById('progress-text');
const spinner = document.getElementById('spinner');
const originalPreview = document.getElementById('original-preview');
const dragOverlay = document.getElementById('drag-overlay');

// State
let currentImage = null;
let processedImage = null;

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
    spinner.classList.add('active');
    updateProgress(0);
  } else {
    spinner.classList.remove('active');
    updateProgress(0);
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
    
    originalImage.src = dataUrl;
    originalImage.classList.remove('hidden');
    originalPlaceholder.classList.add('hidden');
    
    // Reset result
    resultImage.classList.add('hidden');
    resultPlaceholder.classList.remove('hidden');
    processedImage = null;
    
    removeBtn.disabled = false;
    saveBtn.disabled = true;
  } catch (error) {
    showAlert('Error loading image: ' + error.message, 'error');
  }
}

// Click on original preview to select image
originalPreview.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectImage();
    
    if (result) {
      if (result.error) {
        showAlert(result.error, 'error');
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
    }
  } catch (error) {
    showAlert('Error selecting image: ' + error.message, 'error');
  }
});

// Remove background button click
removeBtn.addEventListener('click', async () => {
  if (!currentImage) {
    showAlert('Please select an image first.', 'error');
    return;
  }

  try {
    removeBtn.disabled = true;
    showProgress(true);

    const result = await window.electronAPI.removeBackground(currentImage.path);

    showProgress(false);

    if (result.success) {
      processedImage = result.data;
      resultImage.src = result.data;
      resultImage.classList.remove('hidden');
      resultPlaceholder.classList.add('hidden');
      
      saveBtn.disabled = false;
      removeBtn.disabled = false;
    } else {
      removeBtn.disabled = false;
      showAlert('Error: ' + result.error, 'error');
    }
  } catch (error) {
    showProgress(false);
    removeBtn.disabled = false;
    showAlert('An error occurred: ' + error.message, 'error');
  }
});

// Save button click
saveBtn.addEventListener('click', async () => {
  if (!processedImage) {
    showAlert('No image to save.', 'error');
    return;
  }

  try {
    const originalName = currentImage ? currentImage.name : null;
    const result = await window.electronAPI.saveImage(processedImage, originalName);

    if (result.success) {
      // Image saved successfully, no alert needed
    } else if (!result.canceled) {
      showAlert('Save error: ' + result.error, 'error');
    }
  } catch (error) {
    showAlert('An error occurred: ' + error.message, 'error');
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
