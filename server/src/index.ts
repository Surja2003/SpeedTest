import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Readable } from 'stream';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - Allow all origins for speed testing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Cache-Control', 'X-Requested-With'],
  credentials: false
}));

// Don't parse body by default - let each route handle it
// app.use(express.json({ limit: '200mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Root API index to avoid 404 on /api
app.get('/api', (req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({
    status: 'ok',
    message: 'Speed Test API',
    endpoints: [
      'GET /api/health',
      'GET /api/ping',
      'GET /api/download?size=1048576',
      'POST /api/upload (application/octet-stream)'
    ]
  });
});

// Friendly root message
app.get('/', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.send('Speed Test Backend is running. See /api for endpoints.');
});

// Ping/Latency test - lightweight response
app.get('/api/ping', (req: Request, res: Response) => {
  // Minimal response for accurate ping measurement
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.json({ 
    timestamp: Date.now(),
    server: 'speed-test-server'
  });
});

// Download speed test - streams random data efficiently
app.get('/api/download', (req: Request, res: Response) => {
  const size = parseInt(req.query.size as string) || 10000000; // 10MB default
  const maxSize = 100000000; // 100MB max
  
  // Limit size to prevent abuse
  const actualSize = Math.min(size, maxSize);
  
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', actualSize.toString());
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Stream random data in chunks for better performance
  const chunkSize = 65536; // 64KB chunks
  let bytesSent = 0;
  
  const stream = new Readable({
    read() {
      if (bytesSent >= actualSize) {
        this.push(null); // End stream
        return;
      }
      
      const remainingBytes = actualSize - bytesSent;
      const currentChunkSize = Math.min(chunkSize, remainingBytes);
      
      // Create buffer filled with random-ish data (faster than crypto.randomBytes)
      const buffer = Buffer.alloc(currentChunkSize);
      for (let i = 0; i < currentChunkSize; i += 8) {
        buffer.writeDoubleBE(Math.random(), i);
      }
      
      bytesSent += currentChunkSize;
      this.push(buffer);
    }
  });
  
  stream.pipe(res);
  
  // Handle client disconnect
  req.on('close', () => {
    stream.destroy();
  });
});

// Upload speed test - receives data and responds quickly
app.post('/api/upload', express.raw({ 
  type: 'application/octet-stream', 
  limit: '200mb' 
}), (req: Request, res: Response) => {
  const size = (req.body && (req.body as Buffer).length) || 0;
  // Debug logging to verify uploads during development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[upload] content-type=${req.headers['content-type']} length=${size}`);
  }
  const receiveTime = Date.now();
  
  // Immediately respond to minimize server processing time
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ 
    received: size,
    timestamp: receiveTime,
    status: 'ok'
  });
  
  // Don't store the data, just measure and discard
  // This ensures upload speed test is measuring network, not disk speed
});

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Error:', err.message);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Speed test server running on http://localhost:${PORT}`);
  console.log(`📊 Ready to measure internet speed accurately`);
});
