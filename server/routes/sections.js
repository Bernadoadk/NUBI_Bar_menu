import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { serializeSection } from '../lib/serializers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  try {
    const sections = await prisma.section.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(sections.map(serializeSection));
  } catch (error) {
    console.error('Sections fetch error:', error);
    res.status(500).json({ error: 'Failed to load sections' });
  }
});

export default router;
