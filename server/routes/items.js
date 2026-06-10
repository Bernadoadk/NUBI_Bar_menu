import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { serializeItem } from '../lib/serializers.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { section_id } = req.query;
  if (!section_id) {
    return res.status(400).json({ error: 'section_id is required' });
  }

  try {
    const items = await prisma.item.findMany({
      where: { sectionId: section_id },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(items.map(serializeItem));
  } catch (error) {
    console.error('Items fetch error:', error);
    res.status(500).json({ error: 'Failed to load items' });
  }
});

router.get('/:id', requireAuth, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(serializeItem(item));
  } catch (error) {
    console.error('Item fetch error:', error);
    res.status(500).json({ error: 'Failed to load item' });
  }
});

router.post('/', requireAuth, async (req, res) => {
  const {
    section_id,
    subsection_id,
    name_en,
    name_fr,
    price,
    description_en,
    description_fr,
    is_visible
  } = req.body;

  if (!section_id || !name_en) {
    return res.status(400).json({ error: 'section_id and name_en are required' });
  }

  try {
    const count = await prisma.item.count({ where: { sectionId: section_id } });
    const item = await prisma.item.create({
      data: {
        sectionId: section_id,
        subsectionId: subsection_id || null,
        nameEn: name_en,
        nameFr: name_fr || null,
        price: price || null,
        descriptionEn: description_en || null,
        descriptionFr: description_fr || null,
        isVisible: is_visible !== false,
        sortOrder: count
      }
    });
    res.status(201).json(serializeItem(item));
  } catch (error) {
    console.error('Item create error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

router.put('/:id', requireAuth, async (req, res) => {
  const {
    subsection_id,
    name_en,
    name_fr,
    price,
    description_en,
    description_fr,
    is_visible
  } = req.body;

  try {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: {
        subsectionId: subsection_id || null,
        nameEn: name_en,
        nameFr: name_fr || null,
        price: price || null,
        descriptionEn: description_en || null,
        descriptionFr: description_fr || null,
        isVisible: is_visible !== false
      }
    });
    res.json(serializeItem(item));
  } catch (error) {
    console.error('Item update error:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

router.patch('/:id/visibility', requireAuth, async (req, res) => {
  const { is_visible } = req.body;

  try {
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { isVisible: Boolean(is_visible) }
    });
    res.json(serializeItem(item));
  } catch (error) {
    console.error('Item visibility error:', error);
    res.status(500).json({ error: 'Failed to update visibility' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (error) {
    console.error('Item delete error:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

export default router;
