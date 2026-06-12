import { Router } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { serializeOrder, serializeTabReceipt } from '../lib/orderSerializers.js';
import { requireAuth } from '../middleware/auth.js';

function isAdminRequest(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return false;
  try {
    jwt.verify(header.slice(7), process.env.JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

const router = Router();

const ORDER_INCLUDE = {
  table: true,
  session: { include: { table: true } },
  items: { orderBy: { id: 'asc' } }
};

const ACTIVE_STATUSES = ['SENT', 'VIEWED', 'PREPARING', 'READY', 'PAID'];

const STATUS_FLOW = {
  SENT: ['VIEWED'],
  VIEWED: ['PREPARING'],
  PREPARING: ['READY'],
  READY: ['PAID'],
  PAID: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: []
};

const SESSION_TTL_MS = 4 * 60 * 60 * 1000;

async function getSessionByToken(token) {
  return prisma.tableSession.findUnique({
    where: { token },
    include: { table: true }
  });
}

function mapOrderItems(items) {
  return items.map((item) => ({
    itemId: item.item_id || null,
    nameEn: item.name_en,
    nameFr: item.name_fr || null,
    price: item.price || null,
    quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    note: item.note?.trim() || null
  }));
}

router.post('/', async (req, res) => {
  try {
    const { session_token, items } = req.body;

    if (!session_token || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Session token and items are required' });
    }

    const session = await getSessionByToken(session_token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status === 'CLOSED') {
      return res.status(400).json({ error: 'Session closed' });
    }

    const order = await prisma.order.create({
      data: {
        sessionId: session.id,
        tableId: session.tableId,
        items: { create: mapOrderItems(items) }
      },
      include: ORDER_INCLUDE
    });

    await prisma.tableSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(serializeOrder(order));
  } catch (error) {
    console.error('Order create error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.get('/session/:token', async (req, res) => {
  try {
    const session = await getSessionByToken(req.params.token);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const orders = await prisma.order.findMany({
      where: { sessionId: session.id },
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' }
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Session orders fetch error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.get('/session/:token/tab-receipt', async (req, res) => {
  try {
    const session = await prisma.tableSession.findUnique({
      where: { token: req.params.token },
      include: { table: true }
    });

    if (!session || session.status !== 'CLOSED') {
      return res.status(404).json({ error: 'Tab receipt not available' });
    }

    const orders = await prisma.order.findMany({
      where: { sessionId: session.id, status: 'COMPLETED' },
      include: ORDER_INCLUDE,
      orderBy: { completedAt: 'asc' }
    });

    res.json(serializeTabReceipt(session, orders));
  } catch (error) {
    console.error('Tab receipt error:', error);
    res.status(500).json({ error: 'Failed to load tab receipt' });
  }
});

router.get('/pending-count', requireAuth, async (_req, res) => {
  try {
    const count = await prisma.order.count({
      where: { status: { in: ACTIVE_STATUSES } }
    });
    res.json({ count });
  } catch (error) {
    console.error('Pending count error:', error);
    res.status(500).json({ error: 'Failed to count orders' });
  }
});

router.get('/server-calls', requireAuth, async (_req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 60 * 1000);
    const orders = await prisma.order.findMany({
      where: {
        calledAt: { gte: since },
        status: { in: ['READY', 'PAID', 'COMPLETED'] }
      },
      include: ORDER_INCLUDE,
      orderBy: { calledAt: 'desc' }
    });
    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Server calls error:', error);
    res.status(500).json({ error: 'Failed to load server calls' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const status = req.query.status;
    const where = status
      ? { status }
      : { status: { in: ACTIVE_STATUSES } };

    const orders = await prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }]
    });

    res.json(orders.map(serializeOrder));
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.patch('/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const sessionToken = req.body.session_token;
    const isAdmin = isAdminRequest(req);

    if (sessionToken) {
      if (order.session?.token !== sessionToken) {
        return res.status(403).json({ error: 'Access denied' });
      }
      if (!['SENT', 'VIEWED'].includes(order.status)) {
        return res.status(400).json({ error: 'Order can no longer be cancelled' });
      }
    } else if (!isAdmin) {
      return res.status(401).json({ error: 'Authentication required' });
    } else if (['PAID', 'COMPLETED', 'CANCELLED'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: ORDER_INCLUDE
    });

    res.json(serializeOrder(updated));
  } catch (error) {
    console.error('Order cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

router.put('/:id/items', async (req, res) => {
  try {
    const { session_token, items } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { session: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.session?.token !== session_token) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'SENT') {
      return res.status(400).json({ error: 'Order can only be modified while sent' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items are required' });
    }

    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: order.id } }),
      prisma.orderItem.createMany({
        data: mapOrderItems(items).map((item) => ({ ...item, orderId: order.id }))
      })
    ]);

    const updated = await prisma.order.findUnique({
      where: { id: order.id },
      include: ORDER_INCLUDE
    });

    res.json(serializeOrder(updated));
  } catch (error) {
    console.error('Order update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.post('/:id/call-server', async (req, res) => {
  try {
    const { session_token } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (order.session?.token !== session_token) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (order.status !== 'READY') {
      return res.status(400).json({ error: 'Order is not ready' });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { calledAt: new Date() },
      include: ORDER_INCLUDE
    });

    res.json(serializeOrder(updated));
  } catch (error) {
    console.error('Call server error:', error);
    res.status(500).json({ error: 'Failed to call server' });
  }
});

router.get('/:id/receipt', async (req, res) => {
  try {
    const sessionToken = req.query.session_token;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE
    });

    if (!order || !['PAID', 'COMPLETED'].includes(order.status)) {
      return res.status(404).json({ error: 'Receipt not available' });
    }

    if (sessionToken && order.session?.token !== sessionToken) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!sessionToken && !isAdminRequest(req)) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    res.json(serializeOrder(order));
  } catch (error) {
    console.error('Receipt fetch error:', error);
    res.status(500).json({ error: 'Failed to load receipt' });
  }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status, estimated_minutes } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const allowed = STATUS_FLOW[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
    }

    const now = new Date();
    const data = { status };

    if (status === 'VIEWED') data.viewedAt = now;
    if (status === 'PREPARING') {
      data.preparingAt = now;
      if (estimated_minutes != null) {
        data.estimatedMinutes = Math.max(1, parseInt(estimated_minutes, 10) || 0) || null;
      }
    }
    if (status === 'READY') data.readyAt = now;
    if (status === 'PAID') data.completedAt = now;
    if (status === 'COMPLETED') data.completedAt = now;

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data,
      include: ORDER_INCLUDE
    });

    res.json(serializeOrder(updated));
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
export { SESSION_TTL_MS, ACTIVE_STATUSES };
