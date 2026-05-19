const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ارسال درخواست پازل شخصی
router.post('/request', async (req, res) => {
  try {
    const { lichessIds, chesscomIds, gameCount, contactInfo } = req.body;
    const request = await prisma.personalPuzzleRequest.create({
      data: {
        lichessIds: JSON.stringify(lichessIds || []),
        chesscomIds: JSON.stringify(chesscomIds || []),
        gameCount: gameCount || 5,
        contactInfo: contactInfo || '',
        status: 'pending',
      },
    });
    res.json({ success: true, id: request.id, status: request.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'خطا در ثبت درخواست' });
  }
});

// وضعیت درخواست
router.get('/status/:id', async (req, res) => {
  try {
    const request = await prisma.personalPuzzleRequest.findUnique({
      where: { id: req.params.id },
    });
    if (!request) return res.status(404).json({ error: 'درخواست یافت نشد' });
    res.json({
      id: request.id,
      status: request.status,
      puzzles: JSON.parse(request.puzzles || '[]'),
      adminNote: request.adminNote,
    });
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت وضعیت' });
  }
});

// ادمین: لیست همه درخواست‌ها
router.get('/admin/list', async (req, res) => {
  try {
    const requests = await prisma.personalPuzzleRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests.map(r => ({
      ...r,
      lichessIds: JSON.parse(r.lichessIds || '[]'),
      chesscomIds: JSON.parse(r.chesscomIds || '[]'),
      puzzles: JSON.parse(r.puzzles || '[]'),
    })));
  } catch (err) {
    res.status(500).json({ error: 'خطا در دریافت لیست' });
  }
});

// ادمین: به‌روزرسانی وضعیت و پازل‌ها
router.patch('/admin/:id', async (req, res) => {
  try {
    const { status, puzzles, adminNote } = req.body;
    const updated = await prisma.personalPuzzleRequest.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(puzzles && { puzzles: JSON.stringify(puzzles) }),
        ...(adminNote !== undefined && { adminNote }),
      },
    });
    res.json({ success: true, id: updated.id, status: updated.status });
  } catch (err) {
    res.status(500).json({ error: 'خطا در به‌روزرسانی' });
  }
});

module.exports = router;
