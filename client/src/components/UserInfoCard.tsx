import { motion } from 'framer-motion';
import { UserInfo } from '../services/userInfo';

interface UserInfoCardProps {
  userInfo: UserInfo | null;
  serverLocation: string;
  connectionType: string;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ userInfo, serverLocation, connectionType }) => {
  if (!userInfo) return null;

  return (
    <motion.div
      className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 mb-8 border border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ISP Information */}
        <div className="flex items-start gap-3">
          <div className="text-3xl">🌐</div>
          <div>
            <div className="text-xs text-gray-400 uppercase mb-1">Provider</div>
            <div className="text-sm font-semibold text-white">{userInfo.isp}</div>
            <div className="text-xs text-gray-500">{userInfo.org}</div>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-3">
          <div className="text-3xl">📍</div>
          <div>
            <div className="text-xs text-gray-400 uppercase mb-1">Location</div>
            <div className="text-sm font-semibold text-white">
              {userInfo.city}, {userInfo.region}
            </div>
            <div className="text-xs text-gray-500">{userInfo.country}</div>
          </div>
        </div>

        {/* Server Location */}
        <div className="flex items-start gap-3">
          <div className="text-3xl">🖥️</div>
          <div>
            <div className="text-xs text-gray-400 uppercase mb-1">Server</div>
            <div className="text-sm font-semibold text-white">{serverLocation}</div>
            <div className="text-xs text-gray-500">Nearest location</div>
          </div>
        </div>

        {/* IP & Connection */}
        <div className="flex items-start gap-3">
          <div className="text-3xl">📡</div>
          <div>
            <div className="text-xs text-gray-400 uppercase mb-1">Connection</div>
            <div className="text-sm font-semibold text-white">{connectionType}</div>
            <div className="text-xs text-gray-500">{userInfo.ip}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default UserInfoCard;
