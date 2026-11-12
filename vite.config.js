import { defineConfig } from 'vite';

// 相对 base：产物可挂在任意子路径（如 tailscale serve 的 /konbini/）下正常加载
export default defineConfig({
  base: './',
  server: {
    // 允许经 tailscale MagicDNS 域名访问（*.ts.net）
    allowedHosts: ['.ts.net'],
  },
  preview: {
    allowedHosts: ['.ts.net'],
  },
});
