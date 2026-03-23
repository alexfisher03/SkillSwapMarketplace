import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dir = path.dirname(fileURLToPath(import.meta.url));
const envDir = process.env.VITE_ENV_ROOT
  ? path.resolve(process.env.VITE_ENV_ROOT)
  : path.resolve(dir, '..');
const proxyTarget = process.env.API_PROXY_TARGET || 'http://localhost:3001';

function apiProxyPlugin() {
  return {
    name: 'api-proxy',
    enforce: 'pre',
    configureServer(server) {
      const proxy = createProxyMiddleware({
        pathFilter: '/api',
        target: proxyTarget,
        changeOrigin: true,
        on: {
          error(_err, _req, res) {
            if (
              res &&
              !res.headersSent &&
              typeof res.writeHead === 'function'
            ) {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ status: 'error', message: 'api_proxy' }));
            }
          },
        },
      });
      server.middlewares.use(proxy);
    },
  };
}

export default defineConfig({
  plugins: [apiProxyPlugin(), react()],
  envDir,
  preview: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
