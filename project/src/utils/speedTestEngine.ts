import { startSpeedTest, abortSpeedTest, getSpeedTestStatus, terminateSpeedTest } from './speedTestWorker';
import { TestProgress, SpeedTestResult, TestServer, GraphData, TestConfig, TestProtocol } from '../types/speedTest';

// Set this to the base URL where the competitor's backend is hosted
const COMPETITOR_BACKEND_BASE = 'http://localhost:8080/speedtest-master/backend/';

class SpeedTestEngine {
  private onProgress?: (progress: TestProgress) => void;
  private onGraphUpdate?: (data: GraphData[]) => void;
  private config: TestConfig;
  private workerActive: boolean = false;

  constructor(
    onProgress?: (progress: TestProgress) => void,
    onGraphUpdate?: (data: GraphData[]) => void,
    config?: TestConfig
  ) {
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
  }

  start() {
    if (this.workerActive) {
      this.abort();
    }
    this.workerActive = true;
    // Inject competitor backend URLs into the settings
    const workerSettings = {
      ...this.config,
      url_dl: COMPETITOR_BACKEND_BASE + 'garbage.php',
      url_ul: COMPETITOR_BACKEND_BASE + 'empty.php',
      url_ping: COMPETITOR_BACKEND_BASE + 'empty.php',
      url_getIp: COMPETITOR_BACKEND_BASE + 'getIP.php',
    };
    startSpeedTest(workerSettings, (data: any) => {
      // Map the worker's output to the expected progress/result format
      if (data.testState !== undefined) {
        // Progress update
        if (this.onProgress) {
          this.onProgress({
            phase: this.mapTestStateToPhase(data.testState) as TestProgress['phase'],
            progress: this.calculateProgress(data),
            currentSpeed: 0, // Not available from worker data
            elapsedTime: 0   // Not available from worker data
          });
        }
      }
      if (data.testState === 4 && this.workerActive) {
        // Test finished
        this.workerActive = false;
        if (this.onProgress) {
          this.onProgress({
            phase: 'complete',
            progress: 100,
            currentSpeed: 0,
            elapsedTime: 0
          });
        }
      }
    });
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

  private calculateProgress(data: any): number {
    // Estimate progress based on testState and progress fields
    switch (data.testState) {
      case 1: return Math.round((data.dlProgress || 0) * 100);
      case 2: return Math.round((data.pingProgress || 0) * 100);
      case 3: return Math.round((data.ulProgress || 0) * 100);
      case 4: return 100;
      default: return 0;
    }
  }
}

export default SpeedTestEngine;