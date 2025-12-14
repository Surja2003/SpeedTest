import axios from 'axios';

// Dynamically choose API base: in production use deployed backend, in dev use proxy /api
const API_BASE = import.meta.env.PROD
  ? 'https://speed-test-backend.vercel.app/api'
  : '/api';

// Environment helper
const IS_PROD = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD === true;

export interface SpeedTestResults {
  download: number;
  upload: number;
  ping: number;
  jitter: number;
}

export interface TestConfig {
  useRealInternet: boolean;
  serverUrl?: string; // deprecated
  serverUrlsOverride?: string[]; // optional manual override list
}

// Helper to measure ping accurately
async function measureSinglePing(): Promise<number> {
  const start = performance.now();
  await axios.get(`${API_BASE}/ping`, { headers: { 'Cache-Control': 'no-cache' }});
  return performance.now() - start;
}

// CDN mode flags (optional). To enable in production set VITE_CDN_MODE=true and optionally VITE_CDN_URLS="url1,url2,..."
const USE_CDN = IS_PROD && (import.meta as any).env?.VITE_CDN_MODE === 'true';
const CDN_REGION = ((import.meta as any).env?.VITE_CDN_REGION as string | undefined) || '';
const CDN_URLS: string[] = ((import.meta as any).env?.VITE_CDN_URLS as string | undefined)?.split(',').map(s => s.trim()).filter(Boolean) || [
  // Default fallback list (modifiable). Prefer large, CORS-enabled assets.
  'https://speed.hetzner.de/10MB.bin',
  'https://speed.cloudflare.com/__down?bytes=1048576', // Cloudflare synthetic download endpoint
  'https://bouygues.testdebit.info/10M.iso'
];
// Global knobs
const TEST_DURATION_MS = Number((import.meta as any).env?.VITE_TEST_DURATION_MS) || 10000; // default 10s
const WARMUP_MS = Math.min(1500, Math.floor(TEST_DURATION_MS * 0.15)); // ignore initial ramp (<=1.5s or 15%)
const SMOOTH_HISTORY = (import.meta as any).env?.VITE_SMOOTH_HISTORY === 'true';
// Load a dataset of candidate servers if present (public/servers.json). Shape: [{ name, region, type, url }]
export type ServerEntry = { name: string; region: string; type: string; url?: string; enabled?: boolean; note?: string };
export async function loadServerDataset(): Promise<Array<ServerEntry>|null> {
  try {
    const res = await fetch('/servers.json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data)) return data as any;
  } catch {}
  return null;
}

// Build CDN list dynamically: prefer env overrides; else dataset (filtered by region, then fastest TTFB); else defaults
async function buildCdnList(overrideUrls?: string[]): Promise<string[]> {
  // 0) Manual override
  if (overrideUrls && overrideUrls.length > 0) {
    return overrideUrls;
  }
  // 1) Env override
  if (CDN_URLS && CDN_URLS.length > 0) {
    return scoreAndSort(CDN_URLS);
  }

  // 2) Dataset
  const dataset = await loadServerDataset();
  if (dataset && dataset.length > 0) {
    const candidates = dataset
      .filter(s => (s.type === 'cdn' || s.type === 'isp') && typeof s.url === 'string' && !!s.url && s.enabled !== false)
      .filter(s => !CDN_REGION || s.region.toLowerCase().includes(CDN_REGION.toLowerCase()) || s.region.toLowerCase()==='global');
    const fallbackAll = dataset.filter(s => (s.type==='cdn' || s.type==='isp') && s.enabled !== false && !!s.url).map(s => s.url!)
    const urls = candidates.length > 0 ? candidates.map(s => s.url!) : fallbackAll;
    if (urls.length > 0) {
      // Use cached ranking if fresh
      const cached = getCachedRank(CDN_REGION || 'GLOBAL');
      if (cached) return cached;
      // Measure quick TTFB and pick top 4
      const ranked = await rankByTTFB(urls);
      const top = ranked.slice(0, 4);
      setCachedRank(CDN_REGION || 'GLOBAL', top);
      return top;
    }
  }

  // 3) Fallback defaults
  return scoreAndSort([
    'https://speed.cloudflare.com/__down?bytes=1048576',
    'https://speed.hetzner.de/10MB.bin',
    'https://bouygues.testdebit.info/10M.iso'
  ]);
}

function scoreAndSort(urls: string[]): string[] {
  const score = (u: string) => {
    if (u.includes('cloudflare.com')) return 3;
    if (u.includes('azureedge.net') || u.includes('microsoft')) return 2;
    if (u.includes('hetzner.de')) return 1;
    return 0;
  };
  return [...urls].sort((a, b) => score(b) - score(a));
}

async function rankByTTFB(urls: string[]): Promise<string[]> {
  const controller = new AbortController();
  const ttfb: Array<{url:string; t:number}> = [];
  await Promise.all(urls.map(async (u) => {
    const start = performance.now();
    try {
      const res = await fetch(`${u}${u.includes('?') ? '&' : '?'}probe=${Math.random()}`, { cache: 'no-store', signal: controller.signal });
      // Exclude opaque or non-readable responses (no CORS)
      if (res.type === 'opaque' || !res.ok || !res.body) {
        // Penalize if not readable; still include so fallback can use backend later
        ttfb.push({ url: u, t: Number.POSITIVE_INFINITY });
        return;
      }
      const reader = res.body.getReader();
      // Read first chunk then cancel
      const r = await reader.read();
      if (r.value) {
        const delta = performance.now() - start;
        ttfb.push({ url: u, t: delta });
      } else {
        ttfb.push({ url: u, t: Number.POSITIVE_INFINITY });
      }
      try { controller.abort(); } catch {}
    } catch {
      ttfb.push({ url: u, t: Number.POSITIVE_INFINITY });
    }
  }));
  return ttfb.sort((a,b) => a.t - b.t).map(x => x.url);
}

// Simple localStorage cache for ranked URLs per region
function getCachedRank(region: string): string[]|null {
  try {
    const key = `st_rank_${region}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !Array.isArray(obj.urls)) return null;
    const age = Date.now() - (obj.ts || 0);
    const maxAge = 6 * 60 * 60 * 1000; // 6 hours
    if (age > maxAge) return null;
    return obj.urls as string[];
  } catch { return null; }
}

function setCachedRank(region: string, urls: string[]) {
  try {
    const key = `st_rank_${region}`;
    localStorage.setItem(key, JSON.stringify({ urls, ts: Date.now() }));
  } catch {}
}

// Download test with progressive measurement (parallel workers) + optional CDN streaming mode
async function measureDownloadSpeed(
  onProgress: (speed: number) => void,
  _useRealInternet: boolean = false,
  overrideUrls?: string[]
): Promise<number> {
  const durationMs = TEST_DURATION_MS;
  const maxWorkers = IS_PROD ? 12 : 6; // adaptive upper bound
  const startWorkers = IS_PROD ? 4 : 2; // start lower, then ramp
  const chunkSize = IS_PROD ? 1000000 : 5000000; // backend chunk if not CDN
  let totalBytes = 0;
  let warmBytes = 0; // bytes counted after warmup window
  const samples: number[] = [];
  const start = performance.now();

  const addBytes = (n: number) => {
    totalBytes += n;
    if (performance.now() - start >= WARMUP_MS) warmBytes += n;
  };

  const sampler = setInterval(() => {
    const now = performance.now();
    const elapsedSinceWarm = Math.max(0.001, (now - start - WARMUP_MS) / 1000);
    if (elapsedSinceWarm > 0) {
      const inst = (warmBytes * 8) / (elapsedSinceWarm * 1_000_000);
      samples.push(inst);
      onProgress(inst);
    }
  }, 250);

  // Backend worker (existing behavior)
  const backendWorker = async () => {
    while (performance.now() - start < durationMs) {
      try {
        const res = await axios.get(`${API_BASE}/download?size=${chunkSize}`, {
          responseType: 'arraybuffer',
          headers: { 'Cache-Control': 'no-cache' },
          timeout: IS_PROD ? 30000 : 15000
        });
        addBytes(res.data.byteLength);
      } catch {
        await new Promise(r => setTimeout(r, 100));
      }
    }
  };

  // CDN streaming worker: fetch large file(s) repeatedly, counting streamed bytes.
  const cdnWorker = async (idx: number, cdnList: string[]) => {
    // Round-robin selection of CDN URLs
    while (performance.now() - start < durationMs) {
      const url = cdnList[idx % cdnList.length];
      try {
        const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}nocache=${Math.random()}`, {
          cache: 'no-store'
        });
        if (!res.ok || !res.body) {
          // fallback to backend if fetch fails
          await backendWorker();
          continue;
        }
        const reader = res.body.getReader();
        while (performance.now() - start < durationMs) {
          const { done, value } = await reader.read();
          if (done) break;
          addBytes(value.byteLength);
        }
      } catch {
        // brief backoff
        await new Promise(r => setTimeout(r, 100));
      }
    }
  };
  // Resolve CDN list dynamically if needed
  const cdnList = USE_CDN ? await buildCdnList(overrideUrls) : [];

  // Adaptive concurrency controller
  let activeWorkers = 0;
  const workersArr: Promise<void>[] = [];
  const spawn = (i: number) => {
    activeWorkers++;
    workersArr.push(USE_CDN ? cdnWorker(i, cdnList) : backendWorker());
  };
  for (let i = 0; i < startWorkers; i++) spawn(i);

  // Every second, evaluate growth; if growth < 20% and we haven't hit the cap, add a worker
  let prevSecondBytes = 0;
  let prevInstMbps = 0;
  const adaptInterval = setInterval(() => {
    const elapsed = (performance.now() - start) / 1000;
    if (elapsed >= durationMs / 1000) return; // will be cleared after await
    const secondDelta = totalBytes - prevSecondBytes;
    const inst = (secondDelta * 8) / (1_000_000); // Mbps over last ~1s
    const growth = prevInstMbps > 0 ? (inst - prevInstMbps) / prevInstMbps : 1;
    if (growth < 0.2 && activeWorkers < maxWorkers) {
      spawn(activeWorkers);
    }
    prevInstMbps = inst;
    prevSecondBytes = totalBytes;
  }, 1000);

  await Promise.all(workersArr);
  clearInterval(sampler);
  clearInterval(adaptInterval);

  // Prefer average over effective duration (after warmup) to avoid ramp bias
  const end = performance.now();
  const effectiveSec = Math.max(0.1, (end - start - WARMUP_MS) / 1000);
  const avgMbps = (warmBytes * 8) / (effectiveSec * 1_000_000);
  if (Number.isFinite(avgMbps) && avgMbps > 0) return avgMbps;

  if (samples.length === 0) return 0;
  // Fallback: Tail median (use last 40% of samples for stability)
  const tail = samples.slice(Math.floor(samples.length * 0.6)).sort((a, b) => a - b);
  const mid = Math.floor(tail.length / 2);
  return tail.length % 2 === 0 ? (tail[mid - 1] + tail[mid]) / 2 : tail[mid];
}

// Upload test with progressive measurement (parallel workers)
async function measureUploadSpeed(
  onProgress: (speed: number) => void,
  _useRealInternet: boolean = false
): Promise<number> {
  const durationMs = TEST_DURATION_MS;
  const maxWorkers = IS_PROD ? 10 : 5; // adaptive cap for upload
  const startWorkers = IS_PROD ? 4 : 2;
  const chunkSize = IS_PROD ? 800000 : 1500000; // 0.8MB prod, 1.5MB dev
  let totalBytes = 0;
  let warmBytes = 0;
  const samples: number[] = [];
  const start = performance.now();

  const addBytes = (n: number) => {
    totalBytes += n;
    if (performance.now() - start >= WARMUP_MS) warmBytes += n;
  };

  const sampler = setInterval(() => {
    const now = performance.now();
    const elapsedSinceWarm = Math.max(0.001, (now - start - WARMUP_MS) / 1000);
    if (elapsedSinceWarm > 0) {
      const inst = (warmBytes * 8) / (elapsedSinceWarm * 1_000_000);
      samples.push(inst);
      onProgress(inst);
    }
  }, 250);

  const baseData = new Uint8Array(chunkSize);
  for (let i = 0; i < chunkSize; i += 4096) baseData[i] = i % 256;

  const worker = async () => {
    const data = baseData; // reuse buffer
    while (performance.now() - start < durationMs) {
      try {
        await axios.post(`${API_BASE}/upload`, data, {
          headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-cache' },
          timeout: IS_PROD ? 30000 : 15000
        });
        addBytes(chunkSize);
      } catch {
        await new Promise(r => setTimeout(r, 100));
      }
    }
  };

  // Adaptive concurrency similar to download
  let activeWorkers = 0;
  const workersArr: Promise<void>[] = [];
  const spawn = () => { activeWorkers++; workersArr.push(worker()); };
  for (let i = 0; i < startWorkers; i++) spawn();

  let prevSecondBytes = 0;
  let prevInstMbps = 0;
  const adaptInterval = setInterval(() => {
    const elapsed = (performance.now() - start) / 1000;
    if (elapsed >= durationMs / 1000) return;
    const secondDelta = totalBytes - prevSecondBytes;
    const inst = (secondDelta * 8) / (1_000_000);
    const growth = prevInstMbps > 0 ? (inst - prevInstMbps) / prevInstMbps : 1;
    if (growth < 0.2 && activeWorkers < maxWorkers) {
      spawn();
    }
    prevInstMbps = inst;
    prevSecondBytes = totalBytes;
  }, 1000);

  await Promise.all(workersArr);
  clearInterval(sampler);
  clearInterval(adaptInterval);

  // Prefer average over effective duration (after warmup)
  const end = performance.now();
  const effectiveSec = Math.max(0.1, (end - start - WARMUP_MS) / 1000);
  const avgMbps = (warmBytes * 8) / (effectiveSec * 1_000_000);
  if (Number.isFinite(avgMbps) && avgMbps > 0) return avgMbps;

  if (samples.length === 0) {
    try {
      const size = IS_PROD ? 800000 : 2000000;
      const data = new Uint8Array(size);
      const t0 = performance.now();
      await axios.post(`${API_BASE}/upload`, data, { headers: { 'Content-Type': 'application/octet-stream' }});
      const elapsed = (performance.now() - t0) / 1000;
      return (size * 8) / (Math.max(elapsed, 0.01) * 1_000_000);
    } catch {
      return 0;
    }
  }
  const tail = samples.slice(Math.floor(samples.length * 0.6)).sort((a, b) => a - b);
  const mid = Math.floor(tail.length / 2);
  return tail.length % 2 === 0 ? (tail[mid - 1] + tail[mid]) / 2 : tail[mid];
}

export async function runSpeedTest(
  onProgress: (type: keyof SpeedTestResults, value: number) => void,
  config: TestConfig = { useRealInternet: true }
): Promise<SpeedTestResults> {
  const results: SpeedTestResults = { download: 0, upload: 0, ping: 0, jitter: 0 };
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  console.log(`Starting speed test (${isProduction ? 'Production Backend' : 'Local Backend'})...`);

  // Ping (unloaded)
  console.log('Starting ping test...');
  const pings: number[] = [];
  for (let i = 0; i < 5; i++) {
    try {
      const ping = await measureSinglePing();
      pings.push(ping);
      results.ping = ping;
      onProgress('ping', ping);
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.error('Ping test failed:', e);
      break;
    }
  }
  if (pings.length > 0) {
    const avg = pings.reduce((a, b) => a + b, 0) / pings.length;
    results.ping = avg;
    onProgress('ping', avg);
    const variance = pings.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / pings.length;
    results.jitter = Math.sqrt(variance);
    onProgress('jitter', results.jitter);
  }

  // Download
  console.log('Starting download test...');
  results.download = await measureDownloadSpeed(s => onProgress('download', s), config.useRealInternet, config.serverUrlsOverride);

  // Upload
  console.log('Starting upload test...');
  results.upload = await measureUploadSpeed(s => onProgress('upload', s), config.useRealInternet);

  console.log('Speed test completed:', results);
  // Optional: Smooth with recent history (median of last 3 runs)
  if (SMOOTH_HISTORY) {
    try {
      const key = 'st_recent_runs';
      const prev = JSON.parse(localStorage.getItem(key) || '[]');
      const next = [...prev, results].slice(-3);
      localStorage.setItem(key, JSON.stringify(next));
      if (next.length > 1) {
        const med = (arr: number[]) => {
          const s = [...arr].sort((a,b)=>a-b);
          const m = Math.floor(s.length/2);
          return s.length%2===0 ? (s[m-1]+s[m])/2 : s[m];
        };
        return {
          download: med(next.map(r=>r.download)),
          upload: med(next.map(r=>r.upload)),
          ping: med(next.map(r=>r.ping)),
          jitter: med(next.map(r=>r.jitter))
        };
      }
    } catch {}
  }
  return results;
}
