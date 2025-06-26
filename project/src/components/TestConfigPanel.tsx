import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Zap, Activity, Clock, HelpCircle } from 'lucide-react';
import TcpGracePeriodInfo from './TcpGracePeriodInfo';
import { TestConfig } from '../types/speedTest';

interface TestConfigPanelProps {
  config: TestConfig;
  onChange: (config: TestConfig) => void;
  onClose: () => void;
}

const TestConfigPanel: React.FC<TestConfigPanelProps> = ({ config, onChange, onClose }) => {
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  
  const updateConfig = (updates: Partial<TestConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Test Configuration</h3>
            <p className="text-sm text-gray-600">Customize your speed test parameters</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Basic Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Test Duration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Duration (seconds)</label>
              </div>
              <select
                value={config.duration}
                onChange={(e) => updateConfig({ duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={15}>15 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>

            {/* Parallel Connections */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Connections</label>
              </div>
              <select
                value={config.parallelConnections}
                onChange={(e) => updateConfig({ parallelConnections: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 connection</option>
                <option value={2}>2 connections</option>
                <option value={4}>4 connections</option>
                <option value={8}>8 connections</option>
              </select>
            </div>

            {/* Bufferbloat Analysis */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Bufferbloat Test</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableBufferbloat}
                  onChange={(e) => updateConfig({ enableBufferbloat: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable analysis</span>
              </label>
            </div>

            {/* Stress Testing */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Stress Test</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableStressTest}
                  onChange={(e) => updateConfig({ enableStressTest: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Enable monitoring</span>
              </label>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Advanced Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dynamic Test Duration */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Dynamic Duration</label>
                <button 
                  onClick={() => setShowInfoPanel(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Learn more about dynamic test duration"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableDynamicDuration !== false}
                  onChange={(e) => updateConfig({ enableDynamicDuration: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Shorter tests for fast connections</span>
              </label>
            </div>
            
            {/* TCP Grace Period */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">TCP Grace Period</label>
                <button 
                  onClick={() => setShowInfoPanel(true)}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                  title="Learn more about TCP grace period"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2">
                <select
                  value={config.tcpGracePeriod || 2}
                  onChange={(e) => updateConfig({ tcpGracePeriod: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 second</option>
                  <option value={2}>2 seconds</option>
                  <option value={3}>3 seconds</option>
                  <option value={4}>4 seconds</option>
                </select>
                <label className="flex items-center space-x-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={config.enableDynamicGracePeriod !== false}
                    onChange={(e) => updateConfig({ enableDynamicGracePeriod: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Auto-adjust based on speed</span>
                </label>
              </div>
            </div>
            {/* Browser Optimizations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Browser Optimizations</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableBrowserOptimizations}
                  onChange={(e) => updateConfig({ enableBrowserOptimizations: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-optimize for browser</span>
              </label>
            </div>
            
            {/* Protocol Overhead Detection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Protocol Overhead</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enableAutoProtocolOverhead}
                  onChange={(e) => updateConfig({ enableAutoProtocolOverhead: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-detect overhead</span>
              </label>
              {!config.enableAutoProtocolOverhead && (
                <div className="mt-2">
                  <label className="text-xs text-gray-600 block mb-1">Manual overhead factor</label>
                  <div className="flex items-center">
                    <input
                      type="range"
                      min="1.00"
                      max="1.20"
                      step="0.01"
                      value={config.protocolOverheadFactor || 1.06}
                      onChange={(e) => updateConfig({ protocolOverheadFactor: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="ml-2 text-xs font-medium text-gray-700 min-w-[45px]">
                      {((config.protocolOverheadFactor || 1.06) * 100 - 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {/* Upload Connections */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Upload Connections</label>
              </div>
              <select
                value={config.uploadParallelConnections || config.parallelConnections}
                onChange={(e) => updateConfig({ uploadParallelConnections: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 connection</option>
                <option value={2}>2 connections</option>
                <option value={3}>3 connections</option>
                <option value={4}>4 connections</option>
              </select>
            </div>
            
            {/* Force IE11 Workaround */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Compatibility Mode</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.forceIE11Workaround}
                  onChange={(e) => updateConfig({ forceIE11Workaround: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Force IE11/Safari mode</span>
              </label>
            </div>
            
            {/* Performance API for Ping */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Ping Accuracy</label>
              </div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.pingUsePerformanceAPI}
                  onChange={(e) => updateConfig({ pingUsePerformanceAPI: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Use Performance API</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Pro Tip:</strong> Higher parallel connections may show faster speeds but use more bandwidth. 
          Bufferbloat testing helps identify network congestion issues.
        </p>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfoPanel && (
          <TcpGracePeriodInfo onClose={() => setShowInfoPanel(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TestConfigPanel;