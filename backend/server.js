const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const puzzleRoutes = require('./routes/puzzleRoutes');
const personalPuzzleRoutes = require('./routes/personalPuzzleRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const maiaRoutes = require('./routes/maiaRoutes');

const app = express();
const prisma = new PrismaClient();

// =======================================================
// 🚨 بسیار مهم: این دو خط حتماً باید قبل از همه روت‌ها باشند!
// =======================================================
app.use(cors());
app.use(express.json());

// =======================================================
// 🌐 حالا روت‌ها رو تعریف می‌کنیم
// =======================================================
app.use('/api/puzzles', puzzleRoutes);
app.use('/api/personal-puzzles', personalPuzzleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/maia', maiaRoutes);

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$connect();
        res.json({ status: 'active', message: '🚀 Farzin Backend & SQLite Database are running perfectly!' });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Farzin Backend Engine is running on port ${PORT}`);
});