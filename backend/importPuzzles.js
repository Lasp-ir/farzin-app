const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_FILE_PATH = './lichess_puzzles.csv';
const BATCH_SIZE = 10000; 

async function importData() {
    if (!fs.existsSync(CSV_FILE_PATH)) {
        console.error(`❌ فایل پیدا نشد: ${CSV_FILE_PATH}`);
        process.exit(1);
    }
    console.log('⏳ در حال خواندن فایل و تزریق به SQLite...');
    const fileStream = fs.createReadStream(CSV_FILE_PATH);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let batch = [];
    let totalInserted = 0;

    for await (const line of rl) {
        if (line.startsWith('PuzzleId')) continue;
        const [PuzzleId, FEN, Moves, Rating, RatingDeviation, Popularity, NbPlays, Themes] = line.split(',');
        if (!PuzzleId || !FEN) continue;

        batch.push({
            puzzleId: PuzzleId, fen: FEN, moves: Moves, rating: parseInt(Rating) || 1200, themes: Themes || ''
        });

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            totalInserted += batch.length;
            console.log(`✅ ${totalInserted.toLocaleString('fa-IR')} پازل تا الان وارد دیتابیس شد...`);
            batch = [];
        }
    }
    if (batch.length > 0) {
        await insertBatch(batch);
        totalInserted += batch.length;
    }
    console.log(`\n🎉 عملیات با موفقیت به پایان رسید! مجموع کل: ${totalInserted.toLocaleString('fa-IR')}`);
    await prisma.$disconnect();
}

async function insertBatch(data) {
    try {
        await prisma.puzzle.createMany({
            data: data
            // خط skipDuplicates رو از اینجا پاک کردیم
        });
    } catch (error) {
        // برای اینکه ارورها الکی طولانی نشن، فقط پیامش رو چاپ می‌کنیم
        console.error('❌ خطا در تزریق بسته:', error.message);
    }
}

importData();