import React from 'react';
import { motion } from 'framer-motion';
import { X, Info } from 'lucide-react';

interface ProtocolOverheadInfoProps {
  onClose: () => void;
}

const ProtocolOverheadInfo: React.FC<ProtocolOverheadInfoProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-500" />
            Protocol Overhead Compensation
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">What is Protocol Overhead?</h3>
              <p className="text-gray-600">
                When data is transferred over the internet, it doesn't travel alone. It's wrapped in multiple layers of 
                protocols (like HTTP, TCP, and IP) that add headers and other information to ensure reliable delivery. 
                This additional information is called "protocol overhead" and it consumes bandwidth but doesn't 
                contribute to the actual content being transferred.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Why Compensate for Overhead?</h3>
              <p className="text-gray-600">
                Traditional speed tests measure raw data transfer rates without accounting for protocol overhead. 
                However, in real-world usage, this overhead reduces the effective throughput of useful data. 
                By applying a compensation factor, we provide a more accurate representation of the speeds you'll 
                actually experience when browsing websites, streaming videos, or downloading files.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Auto-Detection vs. Manual Setting</h3>
              <p className="text-gray-600">
                Our speed test offers two ways to handle protocol overhead:
              </p>
              <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                <li><strong>Auto-Detection (Recommended):</strong> The test analyzes actual network traffic during the download test to calculate the real overhead on your connection. This provides the most accurate results for your specific network conditions.</li>
                <li><strong>Manual Setting:</strong> Advanced users can disable auto-detection and manually set a specific overhead factor based on their knowledge of their network.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">The Default Factor: 1.06</h3>
              <p className="text-gray-600">
                When auto-detection is disabled or fails to collect enough samples, we use a default compensation factor of 1.06 (representing 6% overhead). This value is based on typical HTTP/TCP/IP 
                overhead in modern web traffic and accounts for:
              </p>
              <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                <li>TCP headers (20 bytes per packet)</li>
                <li>IP headers (20 bytes for IPv4, 40 bytes for IPv6)</li>
                <li>HTTP headers for web traffic</li>
                <li>TCP acknowledgments and control packets</li>
                <li>Retransmissions due to packet loss</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Manually Adjusting the Factor</h3>
              <p className="text-gray-600">
                Advanced users can manually adjust the compensation factor based on specific network conditions and usage patterns:
              </p>
              <ul className="list-disc pl-5 mt-2 text-gray-600 space-y-1">
                <li><strong>Higher values (e.g., 1.10-1.20):</strong> For networks with more overhead, such as those with high packet loss, using VPNs, or satellite connections</li>
                <li><strong>Medium values (e.g., 1.05-1.08):</strong> For typical broadband connections (our default range)</li>
                <li><strong>Lower values (e.g., 1.01-1.04):</strong> For more efficient protocols or optimized connections</li>
                <li><strong>1.00:</strong> No compensation (raw data transfer rate)</li>
              </ul>
            </section>

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The actual overhead varies based on many factors including network conditions, 
                protocol versions, packet sizes, and the specific services being used. The compensation factor is an 
                approximation designed to provide more realistic speed measurements.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProtocolOverheadInfo;