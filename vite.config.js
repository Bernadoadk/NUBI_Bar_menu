import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    // This allows /admin to serve admin.html instead of admin.js
    rewrites: [
      { from: /^\/admin$/, to: '/admin.html' }
    ]
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
  // Plugin to handle the rewrite in development
  plugins: [
    {
      name: 'rewrite-admin',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/admin') {
            req.url = '/admin.html';
          }
          next();
        });
      }
    }
  ]
});

