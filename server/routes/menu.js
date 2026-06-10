import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { buildMenuData } from '../lib/menuBuilder.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [sections, subsections, items] = await Promise.all([
      prisma.section.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.subsection.findMany({ orderBy: { sortOrder: 'asc' } }),
      prisma.item.findMany({
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' }
      })
    ]);

    res.json(buildMenuData(sections, subsections, items));
  } catch (error) {
    console.error('Menu fetch error:', error);
    res.status(500).json({ error: 'Failed to load menu' });
  }
});

export default router;
