import { defineConfig } from 'vite';

/**
 * Normalize Vite base path so callers can supply `konbini`, `/konbini`,
 * `/konbini/`, or `/` consistently.
 */
export function normalizeBasePath(raw = '/konbini/') {
  let base = String(raw).trim() || '/';
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

/**
 * Rewrites subpath-stripped proxy requests (`/` and `/assets/...`) to `basePath`
 * so reverse proxies (such as Tailscale Serve `--set-path=/konbini/`) serve
 * both with and without a trailing slash, and disables HTML shell caching so
 * fresh builds apply immediately.
 */
function subpathProxyCompatPlugin(basePath) {
  const trimmedBase = basePath === '/' ? '/' : basePath.slice(0, -1);

  const handle = (req, res, next) => {
    if (basePath !== '/') {
      if (req.url === '/' || req.url.startsWith('/?')) {
        req.url = req.url === '/' ? basePath : `${basePath}${req.url.slice(1)}`;
      } else if (req.url === trimmedBase || req.url.startsWith(`${trimmedBase}?`)) {
        req.url =
          req.url === trimmedBase ? basePath : `${basePath}${req.url.slice(trimmedBase.length)}`;
      } else if (req.url.startsWith('/assets/')) {
        req.url = `${trimmedBase}${req.url}`;
      }
    }

    const isHtmlShell = req.url.endsWith('/') || req.url.includes('/index.html');
    if (isHtmlShell) {
      const origWriteHead = res.writeHead.bind(res);
      res.writeHead = (...args) => {
        res.setHeader('Cache-Control', 'no-store, must-revalidate');
        return origWriteHead(...args);
      };
      res.setHeader('Cache-Control', 'no-store, must-revalidate');
    }

    next();
  };

  return {
    name: 'subpath-proxy-compat',
    configurePreviewServer(server) {
      server.middlewares.use(handle);
    },
    configureServer(server) {
      server.middlewares.use(handle);
    },
  };
}

const basePath = normalizeBasePath(process.env.VITE_BASE_PATH ?? '/konbini/');

export default defineConfig({
  base: basePath,
  plugins: [subpathProxyCompatPlugin(basePath)],
  server: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4175,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-three',
              test: /node_modules[/\\]three[/\\]/,
            },
          ],
        },
      },
    },
  },
});
