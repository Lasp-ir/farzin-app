const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// دریافت پازل بر اساس ریتینگ کاربر
router.get('/rated', async (req, res) => {
    try {
        const userRating = parseInt(req.query.rating) || 1200;
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE rating >= ${userRating - 50} AND rating <= ${userRating + 50} 
            ORDER BY RANDOM() LIMIT 1;`;
        if (puzzles.length === 0) return res.status(404).json({ error: 'پازلی یافت نشد' });
        res.json(puzzles[0]);
    } catch (error) { 
        console.error('Error fetching rated puzzle:', error);
        res.status(500).json({ error: 'خطای سرور' }); 
    }
});

// دریافت پازل روزانه (بازه ریتینگ متوسط)
router.get('/daily', async (req, res) => {
    try {
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE rating >= 1500 AND rating <= 1800 
            ORDER BY RANDOM() LIMIT 1;`;
        res.json(puzzles[0]);
    } catch (error) { 
        console.error('Error fetching daily puzzle:', error);
        res.status(500).json({ error: 'خطای سرور' }); 
    }
});

// دریافت پازل بر اساس موضوع (مثل fork, pin و غیره)
router.get('/theme/:themeName', async (req, res) => {
    try {
        const theme = req.params.themeName;
        const puzzles = await prisma.$queryRaw`
            SELECT * FROM Puzzle WHERE themes LIKE ${'%' + theme + '%'}
            ORDER BY RANDOM() LIMIT 1;`;
        if (puzzles.length === 0) return res.status(404).json({ error: 'پازلی یافت نشد' });
        res.json(puzzles[0]);
    } catch (error) { 
        console.error('Error fetching theme puzzle:', error);
        res.status(500).json({ error: 'خطای سرور' }); 
    }
});

// دریافت نتیجه حل پازل و محاسبه تغییرات ریتینگ کاربر بر اساس فرمول Elo
router.post('/submit', async (req, res) => {
    try {
        // دریافت اطلاعات از بدنه درخواست
        const { puzzleRating, userRating = 1200, isCorrect, usedHint } = req.body;

        let ratingChange = 0;
        // فرمول استاندارد محاسبه احتمال پیروزی (Expected Score)
        const expectedScore = 1 / (1 + Math.pow(10, (puzzleRating - userRating) / 400));
        const kFactor = 32; // ضریب تغییرات استاندارد

        if (isCorrect && !usedHint) {
            // حل صحیح بدون راهنمایی
            ratingChange = Math.round(kFactor * (1 - expectedScore));
            ratingChange = Math.max(5, ratingChange); // حداقل ۵ امتیاز مثبت برای تشویق
        } else if (!isCorrect) {
            // اشتباه در حل پازل
            ratingChange = Math.round(kFactor * (0 - expectedScore));
            ratingChange = Math.min(-5, ratingChange); // حداقل ۵ امتیاز منفی
        } else {
            // اگر از راهنمایی (Hint) استفاده شده باشد، امتیازی تغییر نمی‌کند
            ratingChange = 0;
        }

        // 💡 در آینده وقتی سیستم احراز هویت (Auth) اضافه شد، دیتابیس کاربر را اینجا آپدیت می‌کنیم
        // example: await prisma.user.update({ where: { id: req.user.id }, data: { puzzleRating: { increment: ratingChange } } });

        res.json({ 
            success: true, 
            ratingChange, 
            newRating: userRating + ratingChange 
        });

    } catch (error) {
        console.error('Error calculating puzzle rating:', error);
        res.status(500).json({ error: 'Server error during rating calculation' });
    }
});

// روت دیباگ برای چک کردن تعداد کل پازل‌های موجود در دیتابیس
router.get('/debug', async (req, res) => {
    try {
        const totalPuzzles = await prisma.puzzle.count();
        res.json({ status: 'success', total_count: totalPuzzles });
    } catch (error) { res.status(500).json({ error: 'خطای دیتابیس' }); }
});

module.exports = router;