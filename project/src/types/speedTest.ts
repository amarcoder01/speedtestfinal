export interface SpeedTestResult {
  id: string;
  timestamp: number;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
  jitter: number;
  serverLocation: string;
  userLocation: {
    city: string;
    country: string;
    ip: string;
  };
  testDuration: number;
  bufferbloat?: {
    rating: 'A' | 'B' | 'C' | 'D' | 'F';
    latencyIncrease: number;
  };
  stability?: {
    score: number;
    variance: number;
  };
  packetLoss?: {
    percentage: number;
    sent: number;
    received: number;
  };
  protocolOverhead?: {
    detected: boolean;
    factor: number;
    overheadPercentage: number;
    detectionMode?: 'fixed' | 'dynamic' | 'auto';
    percentage?: string;
  };
  testConfig?: {
    gracePeriodEnabled?: boolean;
    downloadGracePeriod?: number;
    uploadGracePeriod?: number;
    dynamicDurationEnabled?: boolean;
    protocolOverheadFactor?: number;
  };
}

export interface TestProgress {
  phase: 'idle' | 'ping' | 'download' | 'upload' | 'bufferbloat' | 'packetLoss' | 'complete';
  progress: number;
  currentSpeed: number;
  elapsedTime: number;
}

export interface TestServer {
  id: string;
  name: string;
  location: string;
  host: string;
  distance: number;
  latency?: number;
}

export interface GraphData {
  time: number;
  speed: number;
  phase: string;
  ping?: number;
}

export enum TestProtocol {
  XHR = 'xhr',
  WEBSOCKET = 'websocket'
}

export interface TestConfig {
  duration: number;
  parallelConnections: number;
  uploadParallelConnections?: number; // Separate control for upload connections
  enableBufferbloat: boolean;
  enableStressTest: boolean;
  enableAutoProtocolOverhead?: boolean;
  protocolOverheadFactor?: number; // Manual protocol overhead factor (1.0 = no overhead)
  enableBrowserOptimizations?: boolean; // Enable/disable browser-specific optimizations
  forceIE11Workaround?: boolean; // Force IE11/Safari upload workaround
  pingUsePerformanceAPI?: boolean; // Whether to use Performance API for ping measurements
  protocol?: TestProtocol;
  enableDynamicDuration?: boolean; // Enable dynamic test duration (shorter for faster connections)
  tcpGracePeriod?: number; // Grace period in seconds to exclude TCP slow-start
  enableDynamicGracePeriod?: boolean; // Enable dynamic grace period based on connection speed
}

export interface NetworkStabilityData {
  timestamp: number;
  downloadSpeed: number;
  uploadSpeed: number;
  ping: number;
}