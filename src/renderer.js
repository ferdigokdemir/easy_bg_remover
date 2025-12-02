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

// State
let currentImage = null;
let processedImage = null;

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

// Click on original preview to select image
originalPreview.addEventListener('click', async () => {
  try {
    const result = await window.electronAPI.selectImage();
    
    if (result) {
      currentImage = result;
      originalImage.src = result.data;
      originalImage.classList.remove('hidden');
      originalPlaceholder.classList.add('hidden');
      
      // Reset result
      resultImage.classList.add('hidden');
      resultPlaceholder.classList.remove('hidden');
      processedImage = null;
      
      // Enable remove button, disable save
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
