import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  icon: string;
  delay: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon, delay }) => {
  // Format display based on unit and value
  let displayValue = value.toFixed(1);
  let displayUnit = unit;
  
  // Convert Mbps to Gbps if >= 1000
  if (unit === 'Mbps' && value >= 1000) {
    displayValue = (value / 1000).toFixed(2);
    displayUnit = 'Gbps';
  }
  
  return (
    <motion.div
      className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700/50"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-gray-400 font-medium text-sm">{label}</span>
      </div>
      <div className="text-center">
        <motion.div 
          className="text-5xl font-bold mb-1"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {displayValue}
        </motion.div>
        <div className="text-gray-500 text-sm">{displayUnit}</div>
      </div>
    </motion.div>
  );
};

export default MetricCard;
