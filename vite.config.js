import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    proxy: {
      '^/api/': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        adminTables: resolve(__dirname, 'admin-tables.html'),
        adminOrders: resolve(__dirname, 'admin-orders.html'),
      },
    },
  },
  plugins: [
    {
      name: 'rewrite-admin',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const pathname = (req.url || '').split('?')[0].replace(/\/$/, '') || '/';

          if (pathname === '/admin') {
            req.url = '/admin.html' + (req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
          } else if (pathname === '/admin/tables') {
            req.url = '/admin-tables.html' + (req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
          } else if (pathname === '/admin/orders') {
            req.url = '/admin-orders.html' + (req.url?.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
          }

          next();
        });
      }
    }
  ]
});
