import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Settings, Download, TrendingUp, Wifi, Activity } from 'lucide-react';
import { SpeedTestResult, TestProgress as TestProgressType, GraphData, TestConfig } from '../types/speedTest';
import SpeedTestEngine from '../utils/speedTestEngine';
import TestProgress from './TestProgress';
import SpeedChart from './SpeedChart';
import ResultsDisplay from './ResultsDisplay';
import TestConfigPanel from './TestConfigPanel';
import BufferbloatAnalysis from './BufferbloatAnalysis';
import StressTestPanel from './StressTestPanel';

const AdvancedSpeedTest: React.FC = () => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState<TestProgressType>({
    phase: 'idle',
    progress: 0,
    currentSpeed: 0,
    elapsedTime: 0
  });
  const [graphData, setGraphData] = useState<GraphData[]>([]);
  const [testResult, setTestResult] = useState<SpeedTestResult | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [testConfig, setTestConfig] = useState<TestConfig>({
    duration: 10,
    parallelConnections: 4,
    enableBufferbloat: true,
    enableStressTest: false,
    enableBrowserOptimizations: true,
    pingUsePerformanceAPI: true,
    uploadParallelConnections: 3,
    enableAutoProtocolOverhead: true,
    forceIE11Workaround: false
  });


  const handleProgressUpdate = useCallback((progress: TestProgressType) => {
    setTestProgress(progress);
  }, []);

  const handleGraphUpdate = useCallback((data: GraphData[]) => {
    setGraphData(data);
  }, []);

  const startTest = useCallback(async () => {
    console.log('startTest function called');
    setIsTestRunning(true);
    setTestResult(null);
    setGraphData([]);
    setTestProgress({
      phase: 'ping',
      progress: 0,
      currentSpeed: 0,
      elapsedTime: 0
    });

    // Simple demo test that works without external dependencies
    try {
      // Simulate ping test
      setTestProgress({ phase: 'ping', progress: 25, currentSpeed: 0, elapsedTime: 1 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate download test
      setTestProgress({ phase: 'download', progress: 50, currentSpeed: 45.2, elapsedTime: 2 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate upload test
      setTestProgress({ phase: 'upload', progress: 75, currentSpeed: 12.8, elapsedTime: 4 });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete test
      setTestProgress({ phase: 'complete', progress: 100, currentSpeed: 0, elapsedTime: 6 });
      
      // Create demo result
      const result: SpeedTestResult = {
        id: 'demo_' + Date.now(),
        timestamp: Date.now(),
        downloadSpeed: 45.2,
        uploadSpeed: 12.8,
        ping: 28,
        jitter: 2.1,
        serverLocation: 'Demo Server',
        userLocation: {
          city: 'Demo City',
          country: 'Demo Country',
          ip: '192.168.1.1'
        },
        testDuration: 6,
        bufferbloat: {
          rating: 'A',
          latencyIncrease: 5
        },
        packetLoss: {
          percentage: 0,
          sent: 100,
          received: 100
        },
        protocolOverhead: {
          detected: true,
          factor: 1.06,
          overheadPercentage: 6
        }
      };
      
      setTestResult(result);
      
      // Store result in localStorage
      const savedResults = JSON.parse(localStorage.getItem('speedTestResults') || '[]');
      savedResults.unshift(result);
      localStorage.setItem('speedTestResults', JSON.stringify(savedResults.slice(0, 20)));
      
    } catch (error) {
      console.error('Speed test failed:', error);
      setTestProgress({
        phase: 'error',
        progress: 0,
        currentSpeed: 0,
        elapsedTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsTestRunning(false);
    }
  }, [handleProgressUpdate, handleGraphUpdate, testConfig]);

  const resetTest = () => {
    setTestResult(null);
    setGraphData([]);
    setTestProgress({
      phase: 'idle',
      progress: 0,
      currentSpeed: 0,
      elapsedTime: 0
    });
    setAutoStarted(false);
  };

  // Auto-start test when component mounts
  useEffect(() => {
    if (!autoStarted && !isTestRunning && !testResult) {
      setAutoStarted(true);
      setTimeout(() => {
        startTest();
      }, 1500); // Longer delay to show hero section
    }
  }, [autoStarted, isTestRunning, testResult, startTest]);

  if (testResult) {
    return <ResultsDisplay result={testResult} onNewTest={resetTest} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Network Analysis</h2>
              <p className="text-gray-600">Comprehensive internet performance testing</p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 shadow-sm"
              >
                <Settings className="w-4 h-4" />
                Configure
              </button>
              
              {!isTestRunning && (
                <button
                  onClick={resetTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Test
                </button>
              )}
            </div>
          </div>

          {/* Configuration Panel */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8"
              >
                <TestConfigPanel 
                  config={testConfig} 
                  onChange={setTestConfig}
                  onClose={() => setShowConfig(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Test Interface */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Primary Test Panel */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
              >
                {isTestRunning ? (
                  <div className="space-y-8">
                    <div className="text-center">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4"
                      >
                        <Activity className="w-8 h-8 text-white" />
                      </motion.div>
                      
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">
                        {testProgress.phase === 'error' ? 'Test Error' : 'Testing in Progress'}
                      </h3>
                      <p className="text-gray-600">
                        {testProgress.phase === 'error' 
                          ? (testProgress.error || 'An error occurred during testing')
                          : 'Analyzing your network performance...'
                        }
                      </p>
                    </div>

                    <TestProgress progress={testProgress} />
                    
                    {testProgress.currentSpeed > 0 && testProgress.phase !== 'ping' && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6"
                      >
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                          {testProgress.currentSpeed.toFixed(1)}
                        </div>
                        <div className="text-lg text-gray-600 font-medium">
                          Mbps • {testProgress.phase === 'download' ? 'Download' : 'Upload'}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6"
                    >
                      <Wifi className="w-10 h-10 text-white" />
                    </motion.div>
                    
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">
                      Ready to Test
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Your speed test will start automatically
                    </p>
                    
                    <div className="flex justify-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Side Panels */}
            <div className="space-y-6">
              {/* Real-time Chart */}
              {(isTestRunning || graphData.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
                >
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Real-time Analysis
                  </h4>
                  <SpeedChart data={graphData} />
                </motion.div>
              )}

              {/* Advanced Tools */}
              {testConfig.enableBufferbloat && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <BufferbloatAnalysis isActive={isTestRunning && testProgress.phase === 'bufferbloat'} />
                </motion.div>
              )}

              {testConfig.enableStressTest && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <StressTestPanel />
                </motion.div>
              )}
            </div>
          </div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {[
              {
                icon: Download,
                title: 'Download Analysis',
                desc: 'Comprehensive download speed testing with multi-threaded connections and real-time monitoring.',
                gradient: 'from-green-400 to-blue-500'
              },
              {
                icon: TrendingUp,
                title: 'Upload Performance',
                desc: 'Advanced upload testing with latency analysis and bandwidth optimization insights.',
                gradient: 'from-purple-400 to-pink-500'
              },
              {
                icon: Activity,
                title: 'Network Stability',
                desc: 'Ping, jitter, and bufferbloat analysis for gaming and real-time application performance.',
                gradient: 'from-orange-400 to-red-500'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-lg mb-4`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdvancedSpeedTest;