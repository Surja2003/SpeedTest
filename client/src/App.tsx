import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import SpeedGauge from './components/SpeedGauge';
import MetricCard from './components/MetricCard';
import UserInfoCard from './components/UserInfoCard';
import { runSpeedTest, loadServerDataset, ServerEntry } from './services/speedTest';
import { getUserInfo, getUserLocation, getConnectionInfo, findNearestServer, UserInfo } from './services/userInfo';


interface Metrics {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
}

function App() {
  const [testing, setTesting] = useState(false);
  const [testingPhase, setTestingPhase] = useState<string>('');
  // Always use real internet for all users (no toggle)
  const useRealInternet = true;
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [metrics, setMetrics] = useState<Metrics>({
    download: 0,
    upload: 0,
    ping: 0,
    jitter: 0
  });
  
  // User info states
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [serverLocation, setServerLocation] = useState<string>('');
  const [connectionType, setConnectionType] = useState<string>('Unknown');
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [serverOptions, setServerOptions] = useState<ServerEntry[]>([]);
  const [selectedServerUrl, setSelectedServerUrl] = useState<string>('auto');
  
  // Phase helpers for per-gauge animation
  const isDownloading = testing && testingPhase.toLowerCase().includes('download');
  const isUploading = testing && testingPhase.toLowerCase().includes('upload');

  // Fetch user info on component mount (non-blocking, with timeout)
  useEffect(() => {
    const fetchUserInfo = async () => {
      // Don't block the UI - set loading to false immediately
      setIsLoadingInfo(false);
      
      try {
        // Get connection type first (instant, no API call)
        const connType = getConnectionInfo();
        setConnectionType(connType?.effectiveType || 'Unknown');

        // Get IP and ISP info with timeout
        const infoPromise = getUserInfo();
        const timeoutPromise = new Promise<null>((resolve) => 
          setTimeout(() => resolve(null), 3000)
        );
        
        const info = await Promise.race([infoPromise, timeoutPromise]);
        
        if (info) {
          setUserInfo(info);
          // Find nearest server based on IP location
          const nearest = findNearestServer(info.lat, info.lon);
          setServerLocation(nearest.name);
        }

        // Skip getUserLocation to avoid permission popup and delay
        // If needed in future, can be triggered by user action
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };

    fetchUserInfo();
    // Load server options for manual selection
    (async () => {
  const list = await loadServerDataset();
  if (list && list.length) setServerOptions(list.filter(s => (s.type === 'cdn' || s.type === 'isp') && s.enabled !== false && !!s.url));
    })();
  }, []);

  const handleStartTest = async () => {
    setTesting(true);
    setErrorMessage('');
    setMetrics({ download: 0, upload: 0, ping: 0, jitter: 0 });

    try {
      setTestingPhase('Measuring latency...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const results = await runSpeedTest((type: keyof Metrics, value: number) => {
        setMetrics(prev => ({ ...prev, [type]: value }));
        
        // Update testing phase
        if (type === 'ping') {
          setTestingPhase('Measuring latency...');
        } else if (type === 'download') {
          setTestingPhase('Testing download speed...');
        } else if (type === 'upload') {
          setTestingPhase('Testing upload speed...');
        }
  }, { useRealInternet, serverUrlsOverride: selectedServerUrl !== 'auto' ? [selectedServerUrl] : undefined });
      
      setMetrics(results);
      setTestingPhase('Complete!');
    } catch (error) {
      console.error('Speed test failed:', error);
      setErrorMessage('The test failed to complete. Please check your connection and try again.');
      setTestingPhase('Test failed. Please try again.');
    } finally {
      setTimeout(() => {
        setTesting(false);
        setTestingPhase('');
      }, 2000);
    }
  };

  // Estimate data usage based on connection hint when available
  const connectionDownlinkMbps = (() => {
    // Approximate from navigator.connection via userInfo service state
    // We stored only effectiveType text in state; compute a conservative guess
    switch (connectionType) {
      case '4g': return 20; // conservative default
      case '3g': return 2;
      case '2g': return 0.1;
      default: return 50; // assume typical broadband if unknown
    }
  })();
  const approxDownloadMB = Math.round(connectionDownlinkMbps * 1.25); // 10s test -> Mbps * 1.25 = MB
  const approxUploadMB = Math.round(Math.max(5, connectionDownlinkMbps / 2) * 1.25);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <motion.h1 
          className="text-4xl md:text-5xl font-bold text-center mb-3"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Internet Speed Test
        </motion.h1>
        <motion.p
          className="text-center text-gray-400 mb-6 text-sm md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          ⚡ Real-time speed measurement · Multiple test iterations · Accurate results worldwide 🌍
        </motion.p>
        { (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
          <motion.div
            className="text-center text-sm text-amber-400/80 mb-8 bg-amber-400/10 backdrop-blur-sm rounded-lg px-6 py-3 max-w-2xl mx-auto border border-amber-400/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            💡 <strong>Note:</strong> Currently testing via local backend. After deployment to production, 
            this will automatically test your real internet speed via your cloud server.
          </motion.div>
        )}

        {/* Server selection */}
        {serverOptions.length > 0 && (
          <div className="max-w-2xl mx-auto mb-4">
            <label htmlFor="serverSelect" className="block text-sm text-gray-400 mb-2">Server</label>
            <select
              id="serverSelect"
              aria-label="Select test server"
              value={selectedServerUrl}
              onChange={(e) => setSelectedServerUrl(e.target.value)}
              className="w-full bg-slate-800/50 text-white border border-slate-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={testing}
            >
              <option className="text-black" value="auto">Auto (recommended)</option>
              {serverOptions.map((s, idx) => (
                <option className="text-black" key={`${s.url}-${idx}`} value={s.url as string}>{s.name} · {s.region}</option>
              ))}
            </select>
          </div>
        )}

        {/* Data usage notice */}
        <motion.div
          className="text-center text-xs md:text-sm text-blue-300/80 mb-6 bg-blue-900/20 backdrop-blur-sm rounded-lg px-6 py-3 max-w-2xl mx-auto border border-blue-800/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          role="note"
          aria-live="polite"
        >
          This test runs for about 10 seconds per direction and may use data depending on your speed.
          For example, at 100 Mbps it can download about 125 MB and upload about 60 MB. Based on your device hint we estimate ~{approxDownloadMB} MB down and ~{approxUploadMB} MB up.
          <a className="underline decoration-dotted ml-2 hover:text-white" href="/why-results-vary.html" target="_blank" rel="noreferrer">Why results may vary</a>
        </motion.div>

        {/* Error state */}
        {errorMessage && (
          <motion.div
            className="text-center text-sm text-red-300 mb-6 bg-red-500/10 backdrop-blur-sm rounded-lg px-6 py-3 max-w-3xl mx-auto border border-red-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            role="alert"
            aria-live="assertive"
          >
            ⚠️ {errorMessage}
          </motion.div>
        )}

        {/* User Info Card */}
        {!isLoadingInfo && userInfo && (
          <div className="max-w-4xl mx-auto mb-8">
            <UserInfoCard
              userInfo={userInfo}
              serverLocation={serverLocation}
              connectionType={connectionType}
            />
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          {/* Gauges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <motion.div 
              className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <SpeedGauge speed={metrics.download} label="Download" testing={isDownloading} />
            </motion.div>
            <motion.div 
              className="bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-700/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <SpeedGauge speed={metrics.upload} label="Upload" testing={isUploading} />
            </motion.div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MetricCard 
              label="Ping" 
              value={metrics.ping} 
              unit="ms"
              icon="�"
              delay={0.4}
            />
            <MetricCard 
              label="Jitter" 
              value={metrics.jitter} 
              unit="ms"
              icon="📊"
              delay={0.5}
            />
          </div>

          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <button
              onClick={handleStartTest}
              disabled={testing}
              aria-label={testing ? 'Speed test in progress' : 'Start speed test'}
              className={`px-10 py-3 rounded-full text-lg font-semibold transition-all duration-300 transform hover:scale-105 ${
                testing 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {testing ? (
                <span className="flex items-center gap-3">
                  <span className="animate-spin-slow">🔄</span>
                  {testingPhase || 'Testing...'}
                </span>
              ) : (
                'Start Test'
              )}
            </button>
          </motion.div>

          {/* Footer */}
          <div className="mt-10 text-center text-xs text-gray-400">
            <a className="underline decoration-dotted hover:text-gray-200" href="/privacy.html" target="_blank" rel="noreferrer">Privacy</a>
            <span className="mx-2">•</span>
            <a className="underline decoration-dotted hover:text-gray-200" href="/terms.html" target="_blank" rel="noreferrer">Terms</a>
            <span className="mx-2">•</span>
            <a className="underline decoration-dotted hover:text-gray-200" href="/why-results-vary.html" target="_blank" rel="noreferrer">Why results may vary</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
