const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const puzzleRoutes = require('./routes/puzzleRoutes');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await prisma.$connect();
        res.json({ status: 'active', message: '🚀 Farzin Backend & SQLite Database are running perfectly!' });
    } catch (error) {
        console.error("Database connection error:", error);
        res.status(500).json({ error: 'Database connection failed' });
    }
});

app.use('/api/puzzles', puzzleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Farzin Backend Engine is running on port ${PORT}`);
});