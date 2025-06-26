// Wrapper for LibreSpeed's speedtest_worker.js
// This replaces all previous logic in this file

// Path to the competitor's worker (placed in public directory)
const LIBRESPEED_WORKER_PATH = '/speedtest_worker.js';

let worker: Worker | null = null;
let onMessageCallback: ((data: any) => void) | null = null;

// Start the speed test
export function startSpeedTest(settings: any, onMessage: (data: any) => void) {
  if (worker) {
    worker.terminate();
  }
  worker = new Worker(LIBRESPEED_WORKER_PATH);
  onMessageCallback = onMessage;
  worker.onmessage = (e) => {
    if (onMessageCallback) {
      try {
        const data = JSON.parse(e.data);
        onMessageCallback(data);
      } catch (err) {
        // fallback for non-JSON messages
        onMessageCallback(e.data);
      }
    }
  };
  worker.postMessage('start ' + JSON.stringify(settings));
}

// Abort the speed test
export function abortSpeedTest() {
  if (worker) {
    worker.postMessage('abort');
  }
}

// Get current status
export function getSpeedTestStatus() {
  if (worker) {
    worker.postMessage('status');
  }
}

// Clean up
export function terminateSpeedTest() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}