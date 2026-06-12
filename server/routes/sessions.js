import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();
const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

router.post('/', async (req, res) => {
  try {
    const tableNumber = parseInt(req.body.table_number, 10);
    const existingToken = req.body.token || null;

    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      return res.status(400).json({ error: 'Invalid table number' });
    }

    const table = await prisma.table.findUnique({ where: { number: tableNumber } });
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }

    if (existingToken) {
      const session = await prisma.tableSession.findUnique({
        where: { token: existingToken },
        include: { table: true }
      });

      if (session && session.tableId === table.id) {
        const expired = Date.now() - session.updatedAt.getTime() > SESSION_TTL_MS;
        if (session.status === 'ACTIVE' && !expired) {
          return res.json({
            token: session.token,
            table_number: table.number,
            table_id: table.id,
            status: session.status
          });
        }
      }
    }

    const session = await prisma.tableSession.create({
      data: { tableId: table.id }
    });

    res.status(201).json({
      token: session.token,
      table_number: table.number,
      table_id: table.id,
      status: session.status
    });
  } catch (error) {
    console.error('Session create error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.get('/:token', async (req, res) => {
  try {
    const session = await prisma.tableSession.findUnique({
      where: { token: req.params.token },
      include: { table: true }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      token: session.token,
      table_number: session.table.number,
      table_id: session.tableId,
      status: session.status,
      closed_at: session.closedAt
    });
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

export default router;
