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
      },
    },
  },
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
