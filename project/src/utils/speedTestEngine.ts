import { startSpeedTest, abortSpeedTest, getSpeedTestStatus, terminateSpeedTest } from './speedTestWorker';
import { TestProgress, SpeedTestResult, GraphData, TestConfig, TestProtocol } from '../types/speedTest';


class SpeedTestEngine {
  private onProgress?: (progress: TestProgress) => void;
  private onGraphUpdate?: (data: GraphData[]) => void;
  private config: TestConfig;
  private workerActive: boolean = false;
  private testResult: SpeedTestResult | null = null;
  private testCompleted: boolean = false;
  private testStartTime: number = 0;

  constructor(
    onProgress?: (progress: TestProgress) => void,
    onGraphUpdate?: (data: GraphData[]) => void,
    config?: TestConfig
  ) {
    console.log('SpeedTestEngine constructor called with config:', config);
    this.onProgress = onProgress;
    this.onGraphUpdate = onGraphUpdate;
    this.config = config || {
      duration: 10,
      parallelConnections: 4,
      enableBufferbloat: true,
      enableStressTest: false,
      enableAutoProtocolOverhead: true,
      protocolOverheadFactor: 1.06,
      enableBrowserOptimizations: true,
      pingUsePerformanceAPI: true,
      uploadParallelConnections: 3,
      forceIE11Workaround: false,
      protocol: TestProtocol.XHR,
      enableDynamicDuration: true,
      tcpGracePeriod: 2,
      enableDynamicGracePeriod: true
    };
    console.log('SpeedTestEngine final config:', this.config);
  }

  start() {
    console.log('SpeedTestEngine.start() called');
    if (this.workerActive) {
      this.abort();
    }
    this.workerActive = true;
    this.testCompleted = false;
    this.testStartTime = Date.now();
    
    // Check if Speedtest constructor is available
    console.log('Checking Speedtest constructor availability:', typeof (window as Record<string, unknown>).Speedtest);
    
    // Try to load the Speedtest constructor if it's not available
    if (!(window as Record<string, unknown>).Speedtest) {
      console.warn('Speedtest constructor not found, attempting to load it dynamically');
      
      // Create a script element to load speedtest.js
      const script = document.createElement('script');
      script.src = '/speedtest.js';
      script.type = 'text/javascript';
      script.async = true;
      
      // Add an event listener to continue initialization once the script is loaded
      script.onload = () => {
        console.log('Speedtest.js loaded dynamically, continuing initialization');
        this.continueInitialization();
      };
      
      // Add an error handler in case the script fails to load
      script.onerror = () => {
        console.error('Failed to load Speedtest.js dynamically, using fallback approach');
        this.useFallbackServer();
      };
      
      // Append the script to the document head
      document.head.appendChild(script);
      return;
    }
    
    // Continue with normal initialization if Speedtest is already available
    this.continueInitialization();
  }
  
  private continueInitialization() {
    // Public speed test servers as fallback
    const PUBLIC_SPEEDTEST_SERVERS = this.getPublicSpeedTestServers();
    
    // For now, always use fallback server to avoid hanging on server selection
    console.log('Using fallback server configuration to avoid hanging');
    this.useDefaultServerConfiguration(PUBLIC_SPEEDTEST_SERVERS);
  }
  
  private getPublicSpeedTestServers() {
    return {
      librespeed: {
        server: 'https://librespeed.org/',
        dlURL: 'garbage.php',
        ulURL: 'empty.php',
        pingURL: 'empty.php',
        getIpURL: 'getIP.php'
      },
      openspeedtest: {
        server: 'https://openspeedtest.com/speedtest/',
        dlURL: 'garbage.php',
        ulURL: 'empty.php',
        pingURL: 'empty.php',
        getIpURL: 'getIP.php'
      }
    };
  }
  
  private useFallbackServer() {
    console.warn('Using fallback server approach');
    const PUBLIC_SPEEDTEST_SERVERS = this.getPublicSpeedTestServers();
    const fallbackServer = PUBLIC_SPEEDTEST_SERVERS.librespeed;
    
    const workerSettings = {
      ...this.config,
      url_dl: fallbackServer.server + fallbackServer.dlURL,
      url_ul: fallbackServer.server + fallbackServer.ulURL,
      url_ping: fallbackServer.server + fallbackServer.pingURL,
      url_getIp: fallbackServer.server + fallbackServer.getIpURL,
      test_order: 'IP_D_U_P'
    };
    
    this.startTest(workerSettings);
  }
    
  private handleAutoServerSelection() {
    console.log('Using automatic server selection for most accurate results');
    
    // Check if Speedtest constructor is available
    if (!(window as Record<string, unknown>).Speedtest) {
      console.error('Speedtest constructor not found. Make sure speedtest.js is loaded properly.');
      this.useFallbackServer();
      return;
    }
    
    console.log('Speedtest constructor found, proceeding with server selection...');
    
    // Create Speedtest instance with error handling
    let speedtest;
    try {
      speedtest = new (window as Record<string, unknown>).Speedtest();
    } catch (error) {
      console.error('Error creating Speedtest instance:', error);
      this.useFallbackServer();
      return;
    }
    
    if (!speedtest) {
      console.error('Failed to create Speedtest instance');
      this.useFallbackServer();
      return;
    }
    
    // Set test parameters
    Object.keys(this.config).forEach(key => {
      speedtest.setParameter(key, (this.config as Record<string, unknown>)[key]);
    });
    
    // Load server list from our JSON file
    console.log('Attempting to load server list from /servers.json...');
    speedtest.loadServerList('/servers.json', (servers: unknown[]) => {
      console.log('Server list callback received:', servers);
      if (servers && servers.length > 0) {
        console.log(`Loaded ${servers.length} speed test servers:`, servers);
        
        // Select the server with the lowest ping
        console.log('Starting server selection process...');
        speedtest.selectServer((server: Record<string, unknown>) => {
          console.log('Server selection callback received:', server);
          if (server) {
            console.log(`Selected server: ${server.name} with ping ${server.pingT}ms`);
            
            // Use the selected server
            const workerSettings = {
              ...this.config,
              url_dl: server.server + server.dlURL,
              url_ul: server.server + server.ulURL,
              url_ping: server.server + server.pingURL,
              url_getIp: server.server + server.getIpURL,
            };
            
            console.log('Starting test with selected server settings:', workerSettings);
            this.startTest(workerSettings);
          } else {
            console.warn('Server selection failed, using public fallback server');
            this.useFallbackServer();
          }
        });
      } else {
        console.warn('Failed to load server list, using public fallback server');
        this.useFallbackServer();
      }
    });
  }
  
  private useDefaultServerConfiguration(PUBLIC_SPEEDTEST_SERVERS: Record<string, unknown>) {
    console.log('Using default server configuration');
    
    // Use a public speed test server instead of local backend
    const fallbackServer = PUBLIC_SPEEDTEST_SERVERS.librespeed as Record<string, string>;
    const workerSettings = {
      ...this.config,
      url_dl: fallbackServer.server + fallbackServer.dlURL,
      url_ul: fallbackServer.server + fallbackServer.ulURL,
      url_ping: fallbackServer.server + fallbackServer.pingURL,
      url_getIp: fallbackServer.server + fallbackServer.getIpURL,
    };
    
    console.log('Starting test with default server settings:', workerSettings);
    this.startTest(workerSettings);
  }
  
  runTest() {
    console.log('Starting speed test with configuration:', this.config);
    
    // Get the list of public speed test servers
    const PUBLIC_SPEEDTEST_SERVERS = this.getPublicSpeedTestServers();
    
    // Determine server selection method
    if (this.config.serverSelection === 'auto') {
      this.handleAutoServerSelection();
    } else {
      this.useDefaultServerConfiguration(PUBLIC_SPEEDTEST_SERVERS);
    }
  }
  
  private startTest(workerSettings: Record<string, unknown>) {
    console.log('startTest called with settings:', workerSettings);
    try {
      // Sanitize URLs to ensure they're valid
      if (workerSettings.url_dl && !workerSettings.url_dl.startsWith('http')) {
        console.log('Fixing download URL to use HTTPS:', workerSettings.url_dl);
        workerSettings.url_dl = 'https:' + workerSettings.url_dl;
      }
      if (workerSettings.url_ul && !workerSettings.url_ul.startsWith('http')) {
        console.log('Fixing upload URL to use HTTPS:', workerSettings.url_ul);
        workerSettings.url_ul = 'https:' + workerSettings.url_ul;
      }
      if (workerSettings.url_ping && !workerSettings.url_ping.startsWith('http')) {
        console.log('Fixing ping URL to use HTTPS:', workerSettings.url_ping);
        workerSettings.url_ping = 'https:' + workerSettings.url_ping;
      }
      if (workerSettings.url_getIp && !workerSettings.url_getIp.startsWith('http')) {
        console.log('Fixing getIp URL to use HTTPS:', workerSettings.url_getIp);
        workerSettings.url_getIp = 'https:' + workerSettings.url_getIp;
      }
      
      console.log('Starting speed test with settings:', JSON.stringify(workerSettings));
      
      // Use the LibreSpeed demo server as a fallback
      const FALLBACK_SERVER = 'https://speedtest.fdossena.com/';
      
      // Ensure we have valid URLs
      if (!workerSettings.url_dl || !workerSettings.url_dl.includes('.')) {
        console.warn('Invalid download URL, using fallback');
        workerSettings.url_dl = FALLBACK_SERVER + 'garbage.php';
      }
      if (!workerSettings.url_ul || !workerSettings.url_ul.includes('.')) {
        console.warn('Invalid upload URL, using fallback');
        workerSettings.url_ul = FALLBACK_SERVER + 'empty.php';
      }
      if (!workerSettings.url_ping || !workerSettings.url_ping.includes('.')) {
        console.warn('Invalid ping URL, using fallback');
        workerSettings.url_ping = FALLBACK_SERVER + 'empty.php';
      }
      if (!workerSettings.url_getIp || !workerSettings.url_getIp.includes('.')) {
        console.warn('Invalid getIp URL, using fallback');
        workerSettings.url_getIp = FALLBACK_SERVER + 'getIP.php';
      }
      
      startSpeedTest(workerSettings, (data: Record<string, unknown>) => {
        // Map the worker's output to the expected progress/result format
        if (data.testState !== undefined) {
          // Progress update
          if (this.onProgress) {
            const phase = this.mapTestStateToPhase(data.testState) as TestProgress['phase'];
            const progress = this.calculateProgress(data);
            let currentSpeed = 0;
            
            // Extract current speed from data if available
            if (data.testState === 1 && data.dlStatus !== undefined) {
              currentSpeed = data.dlStatus;
              console.log(`Download test in progress: ${data.dlStatus.toFixed(2)} Mbps`);
            } else if (data.testState === 3 && data.ulStatus !== undefined) {
              currentSpeed = data.ulStatus;
              console.log(`Upload test in progress: ${data.ulStatus.toFixed(2)} Mbps`);
            } else if (data.testState === 2) {
              console.log(`Ping test in progress: ${data.pingStatus || 0}ms`);
            }
            
            const elapsedTime = (Date.now() - this.testStartTime) / 1000;
            
            this.onProgress({
              phase,
              progress,
              currentSpeed,
              elapsedTime
            });
            
            // Update graph data if callback is provided
            if (this.onGraphUpdate && (phase === 'download' || phase === 'upload')) {
              this.onGraphUpdate([{
                time: elapsedTime,
                speed: currentSpeed,
                phase,
                ping: data.pingStatus || 0
              }]);
            }
          }
        }
        
        if (data.testState === 4 && this.workerActive) {
          // Test finished
          console.log('Speed test completed successfully');
          console.log(`Results: Download: ${(data.dlStatus || 0).toFixed(2)} Mbps, Upload: ${(data.ulStatus || 0).toFixed(2)} Mbps, Ping: ${(data.pingStatus || 0).toFixed(2)} ms`);
          
          this.workerActive = false;
          this.testCompleted = true;
          
          // Create test result
          this.testResult = {
            id: this.generateTestId(),
            timestamp: Date.now(),
            downloadSpeed: data.dlStatus || 0,
            uploadSpeed: data.ulStatus || 0,
            ping: data.pingStatus || 0,
            jitter: data.jitterStatus || 0,
            serverLocation: data.server ? data.server.name : 'LibreSpeed Server',
            userLocation: {
              city: data.clientInfo?.city || 'Unknown',
              country: data.clientInfo?.country || 'Unknown',
              ip: data.clientInfo?.ip || 'Unknown'
            },
            testDuration: (Date.now() - this.testStartTime) / 1000,
            bufferbloat: {
              rating: 'A',
              latencyIncrease: 0
            },
            packetLoss: {
              percentage: 0,
              sent: 100,
              received: 100
            },
            protocolOverhead: {
              detected: this.config.enableAutoProtocolOverhead || false,
              factor: this.config.protocolOverheadFactor || 1.06,
              overheadPercentage: ((this.config.protocolOverheadFactor || 1.06) - 1) * 100
            }
          };
          
          if (this.onProgress) {
            this.onProgress({
              phase: 'complete',
              progress: 100,
              currentSpeed: 0,
              elapsedTime: (Date.now() - this.testStartTime) / 1000
            });
          }
        }
      });
    } catch (error) {
      console.error('Error in startTest:', error);
      if (this.onProgress) {
        this.onProgress({
          phase: 'error',
          progress: 0,
          currentSpeed: 0,
          elapsedTime: (Date.now() - this.testStartTime) / 1000,
          error: 'Failed to start speed test: ' + (error instanceof Error ? error.message : String(error))
        });
      }
    }
  }

  abort() {
    abortSpeedTest();
    this.workerActive = false;
  }

  getStatus() {
    getSpeedTestStatus();
  }

  terminate() {
    terminateSpeedTest();
    this.workerActive = false;
  }

  private mapTestStateToPhase(testState: number): TestProgress['phase'] {
    switch (testState) {
      case 0: return 'idle';
      case 1: return 'download';
      case 2: return 'ping';
      case 3: return 'upload';
      case 4: return 'complete';
      default: return 'idle';
    }
  }

  private calculateProgress(data: Record<string, unknown>): number {
    // Estimate progress based on testState and progress fields
    switch (data.testState) {
      case 1: return Math.round((data.dlProgress || 0) * 100);
      case 2: return Math.round((data.pingProgress || 0) * 100);
      case 3: return Math.round((data.ulProgress || 0) * 100);
      case 4: return 100;
      default: return 0;
    }
  }

  // Run a complete speed test and return the result
  runSpeedTest(): Promise<SpeedTestResult> {
    return new Promise((resolve, reject) => {
      try {
        // Reset test state
        this.testResult = null;
        this.testCompleted = false;
        
        // Set timeout duration based on test configuration
        const timeoutDuration = (this.config.duration + 30) * 1000; // Test duration + 30 seconds grace period
        console.log(`Setting speed test timeout to ${timeoutDuration/1000} seconds`);
        
        // Start the test
        console.log('Starting speed test...');
        this.start();
        
        // Poll for test completion
        const checkInterval = setInterval(() => {
          if (this.testCompleted && this.testResult) {
            clearInterval(checkInterval);
            console.log('Speed test completed with results:', this.testResult);
            resolve(this.testResult);
          }
        }, 200);
        
        // Set a timeout in case the test hangs
        setTimeout(() => {
          if (!this.testCompleted) {
            clearInterval(checkInterval);
            this.abort();
            console.error(`Speed test timed out after ${timeoutDuration/1000} seconds`);
            reject(new Error('Speed test timed out or failed to connect to server. Please check your internet connection or try again later.'));
          }
        }, timeoutDuration);
      } catch (error) {
        this.abort();
        console.error('Speed test error:', error);
        reject(new Error('Failed to start speed test: ' + (error instanceof Error ? error.message : String(error))));
      }
    });
  }

  // Generate a unique test ID
  private generateTestId(): string {
    return 'test_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  }
}

export default SpeedTestEngine;