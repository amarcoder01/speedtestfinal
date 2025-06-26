import React from 'react';
import { motion } from 'framer-motion';
import { X, Activity } from 'lucide-react';

interface TcpGracePeriodInfoProps {
  onClose: () => void;
}

const TcpGracePeriodInfo: React.FC<TcpGracePeriodInfoProps> = ({ onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Advanced Test Settings Explained</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What is TCP Slow-Start?</h3>
            <p className="text-gray-600">
              TCP (Transmission Control Protocol) uses a mechanism called "slow-start" when establishing a new connection. 
              During this phase, the connection gradually increases its transmission rate until it reaches the optimal speed. 
              This means that the initial seconds of a connection are typically slower than the steady-state speed.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Why Use a Grace Period?</h3>
            <p className="text-gray-600">
              Including the slow-start phase in speed measurements can artificially lower the reported speeds. 
              By implementing a grace period, we allow the connection to reach its steady-state speed before 
              we start measuring. This provides a more accurate representation of your connection's true capability.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Default Setting</h3>
            <p className="text-gray-600">
              The default grace period is set to 2 seconds, which is sufficient for most connections to reach 
              their steady-state speed. This setting provides a good balance between test duration and measurement accuracy.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dynamic Grace Period</h3>
            <p className="text-gray-600">
              Our speed test now features a dynamic grace period that automatically adjusts based on your connection speed:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li><strong>Fast connections (&gt;50 Mbps):</strong> Uses a shorter 1-second grace period, as these connections typically reach steady-state quickly.</li>
              <li><strong>Medium connections (10-50 Mbps):</strong> Uses the standard 2-second grace period.</li>
              <li><strong>Slow connections (&lt;10 Mbps):</strong> Uses an extended 3-second grace period to ensure the connection has fully stabilized.</li>
            </ul>
            <p className="text-gray-600 mt-2">
              This adaptive approach ensures more accurate measurements across different network conditions without requiring manual adjustment.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Dynamic Test Duration</h3>
            <p className="text-gray-600">
              We've implemented a dynamic test duration feature inspired by LibreSpeed that automatically adjusts the test length based on your connection speed:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li><strong>Fast connections:</strong> Tests complete more quickly, as sufficient data is collected faster.</li>
              <li><strong>Slow connections:</strong> Tests run for the full configured duration to ensure accurate measurements.</li>
            </ul>
            <p className="text-gray-600 mt-2">
              This approach provides several benefits:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li>Faster overall test experience for users with high-speed connections</li>
              <li>Reduced data usage without sacrificing measurement accuracy</li>
              <li>More efficient server resource utilization</li>
            </ul>
            <p className="text-gray-600 mt-2">
              The test will always run for at least half of the configured duration, ensuring reliable results even with dynamic adjustments.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Manual Adjustment</h3>
            <p className="text-gray-600">
              You can also manually adjust the grace period using the slider in the test settings:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
              <li><strong>Shorter period (0-1s):</strong> Includes more of the slow-start phase, potentially showing lower speeds but shorter test duration.</li>
              <li><strong>Default period (2s):</strong> Balanced approach that excludes most of the slow-start phase.</li>
              <li><strong>Longer period (3-5s):</strong> Ensures the connection has fully stabilized, potentially showing higher speeds but with longer test duration.</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-md font-semibold text-blue-800 mb-2">Technical Note</h3>
            <p className="text-blue-700 text-sm">
              During the grace period, the test is still running and transferring data. When the grace period ends, 
              we completely reset all byte counters (both measured and total bytes), following the LibreSpeed approach. 
              This ensures that only the steady-state performance is reported and that no data transferred during 
              the TCP slow-start phase affects the final speed calculation. This complete reset approach provides more 
              accurate measurements by ensuring we only measure performance after the connection has fully stabilized.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TcpGracePeriodInfo;