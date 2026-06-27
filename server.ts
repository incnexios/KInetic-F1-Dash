import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // F1 Insights Hub Proxy Logic
  const BASE = 'https://backend.f1insightshub.com';
  const STREAM_URL = `${BASE}/live/stream?protocol=2`;
  const TELEMETRY_URL = (drivers: string[]) => `${BASE}/live/telemetry/current?drivers=${drivers.join(',')}`;

  function upstreamGet(url: string, cb: (res: any) => void) {
    return https.get(url, {
      headers: {
        'Accept': 'text/event-stream, application/json, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Origin': 'https://f1insightshub.com',
        'Referer': 'https://f1insightshub.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36',
      },
    }, cb);
  }

  app.get('/api/f1insights/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const ping = setInterval(() => {
      if (!res.writableEnded) res.write(': ping\n\n');
    }, 20_000);

    let dead = false;
    let upReq: any = null;
    let retryTimer: any = null;

    function cleanup() {
      dead = true;
      clearInterval(ping);
      clearTimeout(retryTimer);
      try { upReq?.destroy(); } catch (_) {}
    }

    function connect() {
      if (dead) return;
      upReq = upstreamGet(STREAM_URL, (upRes: any) => {
        if (upRes.statusCode >= 400) {
          if (!dead && !res.writableEnded) retryTimer = setTimeout(connect, 5_000);
          return;
        }
        upRes.on('data', (chunk: any) => {
          if (!res.writableEnded) res.write(chunk);
        });
        upRes.on('end', () => {
          if (!dead && !res.writableEnded) {
            res.write(': upstream-reconnect\n\n');
            retryTimer = setTimeout(connect, 3_000);
          }
        });
        upRes.on('error', () => {
          if (!dead && !res.writableEnded) retryTimer = setTimeout(connect, 3_000);
        });
      });
      upReq.on('error', () => {
        if (!dead && !res.writableEnded) retryTimer = setTimeout(connect, 3_000);
      });
    }

    req.on('close', cleanup);
    connect();
  });

  app.get('/api/f1insights/telemetry', (req, res) => {
    const drvs = (req.query.drivers as string || '').split(',').filter(Boolean);
    if (!drvs.length) {
      return res.status(400).json({ error: 'drivers param required' });
    }
    const upReq = upstreamGet(TELEMETRY_URL(drvs), (upRes: any) => {
      let body = '';
      upRes.on('data', (c: any) => body += c);
      upRes.on('end', () => {
        res.status(upRes.statusCode === 200 ? 200 : 502).type('application/json').send(body);
      });
    });
    upReq.on('error', (err: Error) => {
      res.status(502).json({ error: err.message });
    });
  });

  app.get('/api/f1insights/state', (req, res) => {
    const upReq = upstreamGet(`${BASE}/live/state`, (upRes: any) => {
      let body = '';
      upRes.on('data', (c: any) => body += c);
      upRes.on('end', () => {
        res.status(upRes.statusCode === 200 ? 200 : 502).type('application/json').send(body);
      });
    });
    upReq.on('error', (err: Error) => {
      res.status(502).json({ error: err.message });
    });
  });

  // Proxy WebSocket to f1dash.net

  const wsProxy = createProxyMiddleware({
    target: 'wss://f1dash.net',
    ws: true,
    changeOrigin: true,
    headers: {
      'Origin': 'https://f1dash.net'
    },
    pathRewrite: {
      '^/f1dash-ws': '/ws',
    },
  });

  // Mount it to avoid conflicting with Vite's HMR websocket
  app.use('/f1dash-ws', wsProxy);

  const audioProxy = createProxyMiddleware({
    target: 'https://livetiming.formula1.com',
    changeOrigin: true,
    pathRewrite: {
      '^/audio-f1': '',
    },
  });
  app.use('/audio-f1', audioProxy);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
  // Important: attach the proxy to handle upgrades
  server.on('upgrade', wsProxy.upgrade);
}

startServer();
