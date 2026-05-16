const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/rated', async (req, res) => {
    try {
        const userRating = parseInt(req.query.rating) || 1200;
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE rating >= ${userRating - 50} AND rating <= ${userRating + 50} 
            ORDER BY RANDOM() LIMIT 1;`;
        if (puzzles.length === 0) return res.status(404).json({ error: 'پازلی یافت نشد' });
        res.json(puzzles[0]);
    } catch (error) { res.status(500).json({ error: 'خطای سرور' }); }
});

router.get('/daily', async (req, res) => {
    try {
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE rating >= 1500 AND rating <= 1800 
            ORDER BY RANDOM() LIMIT 1;`;
        res.json(puzzles[0]);
    } catch (error) { res.status(500).json({ error: 'خطای سرور' }); }
});

router.get('/theme/:themeName', async (req, res) => {
    try {
        const theme = req.params.themeName;
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE themes LIKE ${'%' + theme + '%'}
            ORDER BY RANDOM() LIMIT 1;`;
        if (puzzles.length === 0) return res.status(404).json({ error: 'پازلی یافت نشد' });
        res.json(puzzles[0]);
    } catch (error) { res.status(500).json({ error: 'خطای سرور' }); }
});

router.get('/debug', async (req, res) => {
    try {
        const totalPuzzles = await prisma.puzzle.count();
        res.json({ status: 'success', total_count: totalPuzzles });
    } catch (error) { res.status(500).json({ error: 'خطای دیتابیس' }); }
});

module.exports = router;