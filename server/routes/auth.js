import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, admin.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, email: admin.email });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ email: req.admin.email });
});

export default router;
