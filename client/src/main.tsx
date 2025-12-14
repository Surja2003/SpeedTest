import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AuthGate from './components/AuthGate';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthGate>
      <App />
    </AuthGate>
  </StrictMode>
);

// Gracefully inject Vercel Analytics/Simple Speed Insights only in production
// and only if the scripts are available on the current host. This avoids 404 noise.
if (import.meta.env.PROD) {
  const host = window.location.origin;
  const scripts = [
    '/_vercel/insights/script.js',
    '/_vercel/speed-insights/script.js'
  ];

  const tryInject = async (path: string) => {
    try {
      const url = `${host}${path}`;
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) {
        const s = document.createElement('script');
        s.src = path;
        s.defer = true;
        document.head.appendChild(s);
      }
    } catch {
      // Ignore if endpoint is not provisioned for this project
    }
  };

  scripts.forEach(tryInject);
}
