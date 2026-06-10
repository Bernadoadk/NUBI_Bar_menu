import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { serializeSubsection } from '../lib/serializers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { section_id } = req.query;
  if (!section_id) {
    return res.status(400).json({ error: 'section_id is required' });
  }

  try {
    const subsections = await prisma.subsection.findMany({
      where: { sectionId: section_id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(subsections.map(serializeSubsection));
  } catch (error) {
    console.error('Subsections fetch error:', error);
    res.status(500).json({ error: 'Failed to load subsections' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const { section_id, name_en, name_fr, default_price } = req.body;

  if (!section_id || !name_en) {
    return res.status(400).json({ error: 'section_id and name_en are required' });
  }

  try {
    const count = await prisma.subsection.count({ where: { sectionId: section_id } });
    const subsection = await prisma.subsection.create({
      data: {
        sectionId: section_id,
        nameEn: name_en,
        nameFr: name_fr || null,
        defaultPrice: default_price || null,
        sortOrder: count
      }
    });
    res.status(201).json(serializeSubsection(subsection));
  } catch (error) {
    console.error('Subsection create error:', error);
    res.status(500).json({ error: 'Failed to create subsection' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const { name_en, name_fr, default_price } = req.body;

  try {
    const subsection = await prisma.subsection.update({
      where: { id: req.params.id },
      data: {
        nameEn: name_en,
        nameFr: name_fr || null,
        defaultPrice: default_price || null
      }
    });
    res.json(serializeSubsection(subsection));
  } catch (error) {
    console.error('Subsection update error:', error);
    res.status(500).json({ error: 'Failed to update subsection' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.subsection.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Subsection delete error:', error);
    res.status(500).json({ error: 'Failed to delete subsection' });
  }
});

export default router;
