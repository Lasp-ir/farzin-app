const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// دریافت اعلان‌های کاربر
router.get('/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت اعلان‌ها' });
  }
});

// علامت‌گذاری همه به عنوان خوانده‌شده
router.patch('/:userId/read-all', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'خطا در به‌روزرسانی' });
  }
});

// ایجاد اعلان (داخلی / ادمین)
router.post('/', async (req, res) => {
  try {
    const { userId, type, title, body, actionUrl, data } = req.body;
    const notif = await prisma.notification.create({
      data: {
        userId: userId || null,
        type: type || 'info',
        title,
        body,
        actionUrl: actionUrl || '',
        data: data ? JSON.stringify(data) : '{}',
      },
    });
    res.json({ success: true, id: notif.id });
  } catch (err) {
    res.status(500).json({ error: 'خطا در ایجاد اعلان' });
  }
});

module.exports = router;
