import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './app.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));

  app.get('/admin', (_req, res) => {
    res.sendFile(path.join(distPath, 'admin.html'));
  });

  app.get(['/admin/tables', '/admin-tables.html'], (_req, res) => {
    res.sendFile(path.join(distPath, 'admin-tables.html'));
  });

  app.get(['/admin/orders', '/admin-orders.html'], (_req, res) => {
    res.sendFile(path.join(distPath, 'admin-orders.html'));
  });

  app.get('/admin.html', (_req, res) => {
    res.sendFile(path.join(distPath, 'admin.html'));
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
