import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

function getNextTableNumber(existingNumbers) {
  const used = new Set(existingNumbers);
  let n = 1;
  while (used.has(n)) n++;
  return n;
}

router.get('/check/:number', async (req, res) => {
  try {
    const number = parseInt(req.params.number, 10);
    if (!Number.isInteger(number) || number < 1) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    const table = await prisma.table.findUnique({ where: { number } });
    if (!table) {
      return res.json({ exists: false, number });
    }

    res.json({ exists: true, id: table.id, number: table.number });
  } catch (error) {
    console.error('Table check error:', error);
    res.status(500).json({ error: 'Failed to check table' });
  }
});

router.get('/', requireAuth, async (_req, res) => {
  try {
    const tables = await prisma.table.findMany({ orderBy: { number: 'asc' } });
    res.json(tables.map(t => ({ id: t.id, number: t.number, created_at: t.createdAt })));
  } catch (error) {
    console.error('Tables fetch error:', error);
    res.status(500).json({ error: 'Failed to load tables' });
  }
});

router.post('/close-tab', requireAuth, async (req, res) => {
  try {
    const tableNumber = parseInt(req.body.table_number, 10);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    const table = await prisma.table.findUnique({ where: { number: tableNumber } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    const inProgress = await prisma.order.count({
      where: {
        tableId: table.id,
        status: { in: ['SENT', 'VIEWED', 'PREPARING', 'READY'] }
      }
    });

    if (inProgress > 0) {
      return res.status(400).json({
        error: 'Some orders are still in progress',
        in_progress: inProgress
      });
    }

    const now = new Date();

    const [completed] = await prisma.$transaction([
      prisma.order.updateMany({
        where: { tableId: table.id, status: 'PAID' },
        data: { status: 'COMPLETED', completedAt: now }
      }),
      prisma.tableSession.updateMany({
        where: { tableId: table.id, status: 'ACTIVE' },
        data: { status: 'CLOSED', closedAt: now }
      })
    ]);

    res.json({
      table_number: tableNumber,
      completed_orders: completed.count
    });
  } catch (error) {
    console.error('Close tab error:', error);
    res.status(500).json({ error: 'Failed to close table tab' });
  }
});

router.post('/', requireAuth, async (_req, res) => {
  try {
    const existing = await prisma.table.findMany({ select: { number: true } });
    const number = getNextTableNumber(existing.map(t => t.number));

    const table = await prisma.table.create({ data: { number } });
    res.status(201).json({ id: table.id, number: table.number, created_at: table.createdAt });
  } catch (error) {
    console.error('Table create error:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const table = await prisma.table.findUnique({ where: { id: req.params.id } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    await prisma.table.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    console.error('Table delete error:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
});

export default router;
