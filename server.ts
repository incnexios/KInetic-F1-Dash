import express from "express";
import { createServer as createViteServer } from "vite";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
