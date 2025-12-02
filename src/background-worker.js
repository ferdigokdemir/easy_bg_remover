const { parentPort, workerData } = require('worker_threads');

async function processImage() {
  try {
    const { imagePath } = workerData;
    const { removeBackground } = await import('@imgly/background-removal-node');
    
    // Use file:// URL format
    const fileUrl = `file://${imagePath}`;
    
    // Remove background
    const resultBlob = await removeBackground(fileUrl, {
      progress: (key, current, total) => {
        const progress = Math.round((current / total) * 100);
        parentPort.postMessage({ type: 'progress', key, progress });
      }
    });

    // Convert result to base64
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBuffer = Buffer.from(arrayBuffer);
    const resultBase64 = resultBuffer.toString('base64');

    parentPort.postMessage({ 
      type: 'complete',
      success: true,
      data: `data:image/png;base64,${resultBase64}`
    });
  } catch (error) {
    parentPort.postMessage({ 
      type: 'complete',
      success: false,
      error: error.message
    });
  }
}

processImage();
