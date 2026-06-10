import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import menuRoutes from './routes/menu.js';
import sectionsRoutes from './routes/sections.js';
import subsectionsRoutes from './routes/subsections.js';
import itemsRoutes from './routes/items.js';

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/sections', sectionsRoutes);
app.use('/api/subsections', subsectionsRoutes);
app.use('/api/items', itemsRoutes);

export default app;
