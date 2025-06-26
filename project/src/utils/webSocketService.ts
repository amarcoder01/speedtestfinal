import { SpeedTestResult } from '../types/speedTest';

// WebSocket connection states
export enum WebSocketState {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  ERROR = 'error'
}

// WebSocket message types
export enum MessageType {
  PING = 'ping',
  PONG = 'pong',
  DOWNLOAD_START = 'download_start',
  DOWNLOAD_STARTED = 'download_started',
  DOWNLOAD_PROGRESS = 'download_progress',
  DOWNLOAD_COMPLETE = 'download_complete',
  UPLOAD_START = 'upload_start',
  UPLOAD_READY = 'upload_ready',
  UPLOAD_DATA = 'upload_data',
  UPLOAD_ACK = 'upload_ack',
  TEST_COMPLETE = 'test_complete',
  TEST_COMPLETE_ACK = 'test_complete_ack',
  ERROR = 'error'
}

// WebSocket service configuration
interface WebSocketServiceConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  debug?: boolean;
  testConfig?: {
    protocolOverheadFactor?: number;
    gracePeriodEnabled?: boolean;
    enableDynamicGracePeriod?: boolean;
    enableDynamicDuration?: boolean;
    duration?: number;
  };
}

// Progress update callback type
type ProgressCallback = (phase: string, progress: number, currentSpeed: number) => void;

// WebSocket service for speed testing
class WebSocketService {
  private socket: WebSocket | null = null;
  private state: WebSocketState = WebSocketState.CLOSED;
  private config: WebSocketServiceConfig;
  private reconnectAttempt = 0;
  private clientId: string | null = null;
  private progressCallback: ProgressCallback | null = null;
  private testPhase: string | null = null;
  private testStartTime = 0;
  private pingResults: number[] = [];
  private downloadResults: number[] = [];
  private uploadResults: number[] = [];
  private testComplete = false;
  private testData: Partial<SpeedTestResult> = {};
  private debug: boolean;
  
  // Grace period and measurement variables
  private inGracePeriod = true;
  private gracePeriodMs = 2000; // Default 2 seconds
  private totalBytesReceived = 0;
  private measuredBytesReceived = 0;
  private measurementStartTime = 0;
  private enableDynamicGracePeriod = true;
  private enableDynamicDuration = true;
  private earlySpeedSamples: number[] = [];
  private lastSpeedCheck = 0;
  private bonusT = 0; // Time adjustment for dynamic duration
  private testDuration = 10; // Default 10 seconds
  private protocolOverheadFactor = 1.06; // Default LibreSpeed value

  constructor(config: WebSocketServiceConfig) {
    this.config = {
      reconnectAttempts: 3,
      reconnectInterval: 2000,
      debug: false,
      ...config
    };
    this.debug = this.config.debug || false;
    
    // Initialize grace period and protocol overhead settings from config
    if (config.testConfig) {
      // Set protocol overhead factor
      if (config.testConfig.protocolOverheadFactor !== undefined) {
        this.protocolOverheadFactor = config.testConfig.protocolOverheadFactor;
      }
      
      // Set grace period settings
      if (config.testConfig.gracePeriodEnabled !== undefined) {
        this.inGracePeriod = config.testConfig.gracePeriodEnabled;
      }
      
      // Set dynamic grace period settings
      if (config.testConfig.enableDynamicGracePeriod !== undefined) {
        this.enableDynamicGracePeriod = config.testConfig.enableDynamicGracePeriod;
      }
      
      // Set dynamic duration settings
      if (config.testConfig.enableDynamicDuration !== undefined) {
        this.enableDynamicDuration = config.testConfig.enableDynamicDuration;
      }
      
      // Set test duration
      if (config.testConfig.duration) {
        this.testDuration = config.testConfig.duration;
      }
    }
  }

  // Connect to WebSocket server
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket && (this.state === WebSocketState.OPEN || this.state === WebSocketState.CONNECTING)) {
        this.log('WebSocket already connected or connecting');
        resolve();
        return;
      }

      this.state = WebSocketState.CONNECTING;
      this.log(`Connecting to WebSocket server at ${this.config.url}`);

      try {
        this.socket = new WebSocket(this.config.url);

        // Connection opened
        this.socket.addEventListener('open', () => {
          this.state = WebSocketState.OPEN;
          this.reconnectAttempt = 0;
          this.log('WebSocket connection established');
          resolve();
        });

        // Connection error
        this.socket.addEventListener('error', (event) => {
          this.state = WebSocketState.ERROR;
          this.log('WebSocket connection error:', event);
          if (this.state === WebSocketState.CONNECTING) {
            reject(new Error('Failed to connect to WebSocket server'));
          }
          this.attemptReconnect();
        });

        // Connection closed
        this.socket.addEventListener('close', () => {
          this.state = WebSocketState.CLOSED;
          this.log('WebSocket connection closed');
          this.attemptReconnect();
        });

        // Listen for messages
        this.socket.addEventListener('message', (event) => {
          this.handleMessage(event);
        });
      } catch (error) {
        this.state = WebSocketState.ERROR;
        this.log('Error creating WebSocket:', error);
        reject(error);
        this.attemptReconnect();
      }
    });
  }

  // Attempt to reconnect to the server
  private attemptReconnect(): void {
    if (
      this.state !== WebSocketState.CLOSED && 
      this.state !== WebSocketState.ERROR
    ) {
      return;
    }

    if (this.reconnectAttempt >= (this.config.reconnectAttempts || 3)) {
      this.log(`Maximum reconnect attempts (${this.config.reconnectAttempts}) reached`);
      return;
    }

    this.reconnectAttempt++;
    this.log(`Attempting to reconnect (${this.reconnectAttempt}/${this.config.reconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnection attempt failed:', error);
      });
    }, this.config.reconnectInterval);
  }

  // Close the WebSocket connection
  disconnect(): void {
    if (!this.socket || this.state === WebSocketState.CLOSED) {
      return;
    }

    this.state = WebSocketState.CLOSING;
    this.socket.close();
    this.socket = null;
    this.clientId = null;
  }

  // Send a message to the server
  private send(type: MessageType, data: any = {}): boolean {
    if (!this.socket || this.state !== WebSocketState.OPEN) {
      this.log('Cannot send message, WebSocket is not open');
      return false;
    }

    try {
      const message = JSON.stringify({
        type,
        timestamp: Date.now(),
        clientId: this.clientId,
        ...data
      });

      this.socket.send(message);
      return true;
    } catch (error) {
      this.log('Error sending message:', error);
      return false;
    }
  }

  // Send binary data to the server
  private sendBinary(data: ArrayBuffer): boolean {
    if (!this.socket || this.state !== WebSocketState.OPEN) {
      this.log('Cannot send binary data, WebSocket is not open');
      return false;
    }

    try {
      this.socket.send(data);
      return true;
    } catch (error) {
      this.log('Error sending binary data:', error);
      return false;
    }
  }

  // Handle incoming messages
  private handleMessage(event: MessageEvent): void {
    // Handle binary messages (for upload test)
    if (event.data instanceof ArrayBuffer) {
      if (this.testPhase === 'upload') {
        // For upload test, we receive binary data acknowledgments
        this.handleUploadAck(event.data);
      }
      return;
    }

    // Handle text messages
    try {
      const message = JSON.parse(event.data);
      this.log('Received message:', message);

      switch (message.type) {
        case MessageType.CONNECTED:
          this.clientId = message.clientId;
          this.log(`Connected with client ID: ${this.clientId}`);
          break;

        case MessageType.PONG:
          this.handlePong(message);
          break;

        case MessageType.DOWNLOAD_STARTED:
          this.testPhase = 'download';
          this.testStartTime = Date.now();
          this.log(`Download test started, total bytes: ${message.totalBytes}`);
          break;

        case MessageType.DOWNLOAD_PROGRESS:
          this.handleDownloadProgress(message);
          break;

        case MessageType.DOWNLOAD_COMPLETE:
          this.handleDownloadComplete(message);
          break;

        case MessageType.UPLOAD_READY:
          this.startUploadingData();
          break;

        case MessageType.UPLOAD_ACK:
          this.handleUploadProgress(message);
          break;

        case MessageType.TEST_COMPLETE_ACK:
          this.testComplete = true;
          this.log('Test completed and acknowledged by server');
          break;

        case MessageType.ERROR:
          this.log('Error from server:', message.message);
          break;

        default:
          this.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      this.log('Error parsing message:', error, event.data);
    }
  }

  // Handle pong response for ping measurement
  private handlePong(message: any): void {
    const roundTripTime = Date.now() - message.clientTimestamp;
    this.pingResults.push(roundTripTime);
    this.log(`Ping: ${roundTripTime}ms (server processing: ${message.serverProcessingTime}ms)`);

    // Update progress if callback is set
    if (this.progressCallback && this.testPhase === 'ping') {
      const progress = Math.min((this.pingResults.length / 10) * 100, 100);
      this.progressCallback('ping', progress, 0);
    }

    // If we have enough ping samples, calculate average
    if (this.pingResults.length >= 10) {
      const avgPing = this.calculateAveragePing();
      this.testData.ping = avgPing;
      this.log(`Average ping: ${avgPing}ms`);

      // Move to next test phase if we're in ping phase
      if (this.testPhase === 'ping') {
        this.testPhase = 'download';
        this.startDownloadTest();
      }
    } else if (this.testPhase === 'ping') {
      // Continue ping test
      setTimeout(() => this.measurePing(), 200);
    }
  }

  // Handle download progress updates
  private handleDownloadProgress(message: any): void {
    if (this.progressCallback && this.testPhase === 'download') {
      const now = Date.now();
      const elapsedTime = (now - this.testStartTime) / 1000;
      
      // Update total bytes received
      this.totalBytesReceived = message.bytesSent;
      
      // Check if we're in grace period
      if (this.inGracePeriod) {
        // Collect early speed samples for dynamic grace period
        if (elapsedTime > 0.5 && now - this.lastSpeedCheck > 200) { // Check every 200ms after 0.5s
          const earlySpeed = (this.totalBytesReceived * 8) / elapsedTime / 1000000;
          this.earlySpeedSamples.push(earlySpeed);
          this.lastSpeedCheck = now;
          
          // Dynamic grace period adjustment
          if (this.enableDynamicGracePeriod && this.earlySpeedSamples.length >= 3) {
            // Calculate average of early samples
            const avgEarlySpeed = this.earlySpeedSamples.reduce((a, b) => a + b, 0) / this.earlySpeedSamples.length;
            
            // Adjust grace period based on early speed (similar to LibreSpeed)
            if (avgEarlySpeed < 1) { // Less than 1 Mbps
              this.gracePeriodMs = Math.min(3000, this.gracePeriodMs + 1000); // Extend to max 3s
              this.log(`Slow connection detected (${avgEarlySpeed.toFixed(2)} Mbps), extending grace period to ${this.gracePeriodMs}ms`);
            }
          }
        }
        
        // Check if grace period has ended
        if (elapsedTime >= this.gracePeriodMs / 1000) {
          this.inGracePeriod = false;
          this.totalBytesReceived = 0; // Reset counter after grace period
          this.measurementStartTime = now;
          this.log('Download grace period ended, starting measurement');
        }
      }
      
      // Calculate current speed in Mbps
      let currentSpeed;
      if (!this.inGracePeriod) {
        const measuredTime = (now - this.measurementStartTime) / 1000;
        if (measuredTime > 0) {
          // Apply protocol overhead factor
          currentSpeed = (this.totalBytesReceived * 8 * this.protocolOverheadFactor) / measuredTime / 1000000;
          
          // Dynamic test duration adjustment (similar to LibreSpeed)
          if (this.enableDynamicDuration && measuredTime > 1) {
            // LibreSpeed formula: bonusT = 1.0 - 0.5 * Math.pow(Math.log10(currentSpeed + 1), 2);
            this.bonusT = Math.max(0, 1.0 - 0.5 * Math.pow(Math.log10(currentSpeed + 1), 2));
          }
        } else {
          currentSpeed = 0;
        }
      } else {
        // During grace period, show raw speed
        currentSpeed = (this.totalBytesReceived * 8) / elapsedTime / 1000000;
      }
      
      // Update progress
      let progress;
      if (this.inGracePeriod) {
        // During grace period, progress is based on grace period duration
        progress = Math.min((elapsedTime / (this.gracePeriodMs / 1000)) * 50, 50); // Max 50% during grace period
      } else {
        // After grace period, progress is based on test duration
        const measuredTime = (now - this.measurementStartTime) / 1000;
        const adjustedDuration = this.testDuration + this.bonusT;
        progress = 50 + Math.min((measuredTime / adjustedDuration) * 50, 50); // 50-100%
      }
      
      this.progressCallback('download', progress, currentSpeed);
    }
  }

  // Handle download completion
  private handleDownloadComplete(message: any): void {
    let downloadSpeed;
    
    // If we're using our own measurement (after grace period)
    if (!this.inGracePeriod && this.measurementStartTime > 0) {
      const measuredTime = (Date.now() - this.measurementStartTime) / 1000;
      // Apply protocol overhead factor to get more accurate speed
      downloadSpeed = (this.totalBytesReceived * 8 * this.protocolOverheadFactor) / measuredTime / 1000000;
      this.log(`Download measured with grace period: ${downloadSpeed.toFixed(2)} Mbps over ${measuredTime.toFixed(1)}s`);
    } else {
      // Fallback to server-reported speed if grace period wasn't completed
      downloadSpeed = parseFloat(message.throughputMBps) * 8; // Convert to Mbps
      this.log(`Download using server-reported speed: ${downloadSpeed.toFixed(2)} Mbps`);
    }
    
    this.downloadResults.push(downloadSpeed);
    this.testData.download = downloadSpeed;
    
    // Add protocol overhead information to test data
    this.testData.protocolOverhead = {
      detectionMode: 'fixed', // Using fixed overhead factor
      factor: this.protocolOverheadFactor,
      percentage: ((this.protocolOverheadFactor - 1) * 100).toFixed(1) + '%'
    };

    this.log(`Download test complete: ${downloadSpeed.toFixed(2)} Mbps`);

    // Move to upload test
    this.testPhase = 'upload';
    this.startUploadTest();
  }

  // Handle upload acknowledgments
  private handleUploadAck(message: any): void {
    // For binary upload acks
  }

  // Handle upload progress
  private handleUploadProgress(message: any): void {
    if (this.progressCallback && this.testPhase === 'upload') {
      // This method is now primarily for progress updates, as the actual upload
      // measurement is handled in startUploadingData with grace period and dynamic duration
      
      // We still update the UI based on the server's acknowledgment
      const now = Date.now();
      const elapsedTime = (now - this.testStartTime) / 1000;
      
      // Calculate current speed in Mbps
      let currentSpeed;
      let progress;
      
      // If we're still in the upload test (not completed by startUploadingData)
      if (!this.testComplete) {
        // Get the server-reported bytes
        const serverReportedBytes = message.totalBytesReceived;
        
        // Calculate speed based on grace period state
        if (this.inGracePeriod) {
          // During grace period, show raw speed
          currentSpeed = (serverReportedBytes * 8) / elapsedTime / 1000000;
          
          // Progress during grace period (0-50%)
          progress = Math.min((elapsedTime / (this.gracePeriodMs / 1000)) * 50, 50);
        } else {
          // After grace period, use adjusted measurement
          const measuredTime = (now - this.measurementStartTime) / 1000;
          if (measuredTime > 0) {
            // Apply protocol overhead factor
            currentSpeed = (serverReportedBytes * 8 * this.protocolOverheadFactor) / measuredTime / 1000000;
          } else {
            currentSpeed = 0;
          }
          
          // Progress after grace period (50-100%)
          const adjustedDuration = this.testDuration + this.bonusT;
          progress = 50 + Math.min((measuredTime / adjustedDuration) * 50, 50);
        }
        
        // Update the UI
        this.progressCallback('upload', progress, currentSpeed);
      }
    }
  }

  // Calculate average ping from collected samples
  private calculateAveragePing(): number {
    if (this.pingResults.length === 0) return 0;

    // Sort ping results and remove outliers
    const sortedPings = [...this.pingResults].sort((a, b) => a - b);
    let filteredPings = sortedPings;

    // If we have enough samples, remove outliers
    if (sortedPings.length >= 5) {
      filteredPings = sortedPings.slice(1, -1); // Remove highest and lowest
    }

    // Calculate average
    const sum = filteredPings.reduce((acc, ping) => acc + ping, 0);
    return Math.round(sum / filteredPings.length);
  }

  // Start ping measurement
  measurePing(): void {
    this.testPhase = 'ping';
    this.pingResults = [];
    this.log('Starting ping measurement');

    // Send ping message
    this.send(MessageType.PING);
  }

  // Start download test
  startDownloadTest(): void {
    this.testPhase = 'download';
    this.downloadResults = [];
    this.testStartTime = Date.now();
    this.log('Starting download test');

    // Initialize grace period variables
    this.inGracePeriod = true;
    this.gracePeriodMs = 2000; // Default 2 seconds
    this.totalBytesReceived = 0;
    this.measuredBytesReceived = 0;
    this.measurementStartTime = 0;

    // Request download test
    this.send(MessageType.DOWNLOAD_START, {
      size: 10 * 1024 * 1024, // 10MB
      chunkSize: 64 * 1024, // 64KB chunks
      enableGracePeriod: true
    });
  }

  // Start upload test
  startUploadTest(): void {
    this.testPhase = 'upload';
    this.uploadResults = [];
    this.testStartTime = Date.now();
    this.log('Starting upload test');

    // Initialize grace period variables
    this.inGracePeriod = true;
    this.gracePeriodMs = 3000; // Default 3 seconds for upload (same as LibreSpeed)
    this.totalBytesReceived = 0;
    this.measuredBytesReceived = 0;
    this.measurementStartTime = 0;
    this.earlySpeedSamples = [];
    this.lastSpeedCheck = 0;
    this.bonusT = 0;

    // Request upload test
    this.send(MessageType.UPLOAD_START, {
      size: 10 * 1024 * 1024, // 10MB
      enableGracePeriod: true,
      protocolOverheadFactor: this.protocolOverheadFactor
    });
  }

  // Start uploading data for upload test
  private startUploadingData(): void {
    const chunkSize = 64 * 1024; // 64KB chunks
    const buffer = new ArrayBuffer(chunkSize);
    const view = new Uint8Array(buffer);

    // Fill buffer with random data
    for (let i = 0; i < chunkSize; i++) {
      view[i] = Math.floor(Math.random() * 256);
    }

    // Initialize test variables
    const startTime = Date.now();
    let totalUploaded = 0;
    let measuredUploaded = 0;
    let measurementStartTime = 0;
    let inGracePeriod = true;
    
    // Dynamic test duration (default 10s)
    const baseDuration = this.testDuration * 1000; // Convert to ms
    let bonusTime = 0;

    const uploadChunk = () => {
      const now = Date.now();
      const elapsedTime = (now - startTime) / 1000; // in seconds
      
      // Check if we're in grace period
      if (inGracePeriod && elapsedTime >= this.gracePeriodMs / 1000) {
        // Grace period ended, reset counters
        inGracePeriod = false;
        totalUploaded = 0;
        measurementStartTime = now;
        this.log('Upload grace period ended, starting measurement');
        
        // If dynamic grace period is enabled, adjust based on early samples
        if (this.enableDynamicGracePeriod && this.earlySpeedSamples.length > 0) {
          // Calculate average of early samples
          const avgEarlySpeed = this.earlySpeedSamples.reduce((a, b) => a + b, 0) / this.earlySpeedSamples.length;
          
          // Adjust grace period based on early speed (similar to LibreSpeed)
          if (avgEarlySpeed < 1) { // Less than 1 Mbps
            this.log('Slow connection detected, extending grace period');
            // Already passed grace period, but note for future tests
          }
        }
      }
      
      // Check if test duration has elapsed (including bonus time for dynamic duration)
      if (!inGracePeriod && (now - measurementStartTime) >= (baseDuration + bonusTime)) {
        // Upload test complete
        const measuredTime = (now - measurementStartTime) / 1000;
        // Apply protocol overhead factor to get more accurate speed
        const uploadSpeed = (totalUploaded * 8 * this.protocolOverheadFactor) / measuredTime / 1000000;
        this.uploadResults.push(uploadSpeed);
        this.testData.upload = uploadSpeed;

        this.log(`Upload test complete: ${uploadSpeed.toFixed(2)} Mbps (measured over ${measuredTime.toFixed(1)}s)`);
        this.completeTest();
        return;
      }

      // Send binary data
      if (this.sendBinary(buffer)) {
        totalUploaded += chunkSize;

        // Send metadata about the chunk
        this.send(MessageType.UPLOAD_DATA, {
          byteLength: chunkSize,
          totalUploaded
        });
        
        // If we're not in grace period, collect speed samples for dynamic duration
        if (!inGracePeriod && this.enableDynamicDuration) {
          const measuredTime = (now - measurementStartTime) / 1000;
          if (measuredTime > 0) {
            const currentSpeed = (totalUploaded * 8) / measuredTime / 1000000;
            
            // Check if we should adjust test duration (similar to LibreSpeed)
            if (measuredTime > 1) { // Only after 1 second of measurement
              // LibreSpeed formula: bonusT = 1.0 - 0.5 * Math.pow(Math.log10(currentSpeed + 1), 2);
              bonusTime = Math.max(0, 1000 * (1.0 - 0.5 * Math.pow(Math.log10(currentSpeed + 1), 2)));
            }
            
            // If in grace period, collect early speed samples
            if (inGracePeriod && now - this.lastSpeedCheck > 200) { // Check every 200ms
              this.earlySpeedSamples.push(currentSpeed);
              this.lastSpeedCheck = now;
            }
          }
        }

        // Schedule next chunk
        setTimeout(uploadChunk, 50); // Upload a chunk every 50ms
      } else {
        // If send failed, try again after a short delay
        setTimeout(uploadChunk, 100);
      }
    };

    // Start uploading
    uploadChunk();
  }

  // Complete the speed test
  private completeTest(): void {
    this.testPhase = null;
    this.send(MessageType.TEST_COMPLETE, this.testData);
    this.log('Speed test complete', this.testData);
  }

  // Run a complete speed test
  runSpeedTest(progressCallback: ProgressCallback): Promise<SpeedTestResult> {
    return new Promise(async (resolve, reject) => {
      try {
        // Set progress callback
        this.progressCallback = progressCallback;
        this.testComplete = false;
        this.testData = {};
        
        // Reset test variables
        this.inGracePeriod = true;
        this.earlySpeedSamples = [];
        this.lastSpeedCheck = 0;
        this.bonusT = 0;
        
        // Initialize protocol overhead factor (default to LibreSpeed value)
        if (!this.protocolOverheadFactor) {
          this.protocolOverheadFactor = 1.06; // Default LibreSpeed value
        }

        // Connect to WebSocket server if not connected
        if (this.state !== WebSocketState.OPEN) {
          await this.connect();
        }

        // Start with ping test
        this.measurePing();

        // Wait for test to complete
        const checkCompletion = () => {
          if (this.testComplete) {
            // Test is complete, resolve with results
            const result: SpeedTestResult = {
              download: this.testData.download || 0,
              upload: this.testData.upload || 0,
              ping: this.testData.ping || 0,
              jitter: 0, // Not implemented in WebSocket version yet
              packetLoss: { percentage: 0, sent: 0, received: 0 }, // Not implemented in WebSocket version yet
              bufferbloat: { rating: 'A', latencyIncrease: 0 }, // Not implemented in WebSocket version yet
              timestamp: Date.now(),
              server: {
                name: 'WebSocket Server',
                location: 'Local',
                distance: 0
              },
              protocolOverhead: this.testData.protocolOverhead || {
                detectionMode: 'fixed',
                factor: this.protocolOverheadFactor,
                percentage: ((this.protocolOverheadFactor - 1) * 100).toFixed(1) + '%'
              }
            };
            
            // Add test configuration details
            result.testConfig = {
              gracePeriodEnabled: true,
              downloadGracePeriod: this.gracePeriodMs / 1000,
              uploadGracePeriod: 3, // 3 seconds for upload
              dynamicDurationEnabled: this.enableDynamicDuration,
              protocolOverheadFactor: this.protocolOverheadFactor
            };
            
            resolve(result);
          } else {
            // Check again after a short delay
            setTimeout(checkCompletion, 500);
          }
        };

        checkCompletion();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Get the current connection state
  getState(): WebSocketState {
    return this.state;
  }

  // Logging helper
  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[WebSocketService]', ...args);
    }
  }
}

export default WebSocketService;