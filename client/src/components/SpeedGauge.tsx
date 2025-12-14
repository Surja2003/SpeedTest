import { motion } from 'framer-motion';

interface SpeedGaugeProps {
  speed: number;
  label: string;
  testing: boolean;
}

const SpeedGauge: React.FC<SpeedGaugeProps> = ({ speed, label, testing }) => {
  // Adaptive max speed based on current speed
  const maxSpeed = speed > 500 ? 2000 : 1000;
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  
  // Format speed display
  const displaySpeed = speed >= 1000 ? (speed / 1000).toFixed(2) : speed.toFixed(1);
  const displayUnit = speed >= 1000 ? 'Gbps' : 'Mbps';

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4 text-gray-300">{label} Speed</h2>
      <div className="relative w-56 h-56 mx-auto">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="90"
            stroke="rgba(100,116,139,0.3)"
            strokeWidth="16"
            fill="none"
          />
          <motion.circle
            cx="112"
            cy="112"
            r="90"
            stroke="url(#gradient)"
            strokeWidth="16"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 90 * (1 - percentage / 100)
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            className="text-5xl font-bold"
            animate={testing ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: testing ? Infinity : 0 }}
          >
            {displaySpeed}
          </motion.div>
          <div className="text-lg text-gray-400 mt-1">{displayUnit}</div>
        </div>
      </div>
    </div>
  );
};

export default SpeedGauge;
