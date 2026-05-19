import axios from 'axios';

// آدرس پایه بک‌اند شما
const API_URL = 'http://localhost:5000/api/puzzles';

export const puzzleService = {
    // دریافت پازل بر اساس ریتینگ کاربر
    getRatedPuzzle: async (userRating: number = 1200) => {
        try {
            const response = await axios.get(`${API_URL}/rated`, {
                params: { rating: userRating }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching rated puzzle:', error);
            throw error;
        }
    },

    // دریافت پازل روزانه
    getDailyPuzzle: async () => {
        try {
            const response = await axios.get(`${API_URL}/daily`);
            return response.data;
        } catch (error) {
            console.error('Error fetching daily puzzle:', error);
            throw error;
        }
    },

    // دریافت پازل بر اساس موضوع
    getThemePuzzle: async (themeName: string) => {
        try {
            const response = await axios.get(`${API_URL}/theme/${themeName}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching puzzle for theme ${themeName}:`, error);
            throw error;
        }
    },
    // دریافت پازل از بازی‌های خطا (localStorage)
    getMistakePuzzle: () => {
        const puzzles = JSON.parse(localStorage.getItem('farzin_mistake_puzzles') || '[]');
        if (puzzles.length === 0) throw new Error('هنوز هیچ پازل اشتباهی تحلیل نشده. ابتدا بازی‌هایت را آنالیز کن.');
        const idx = parseInt(localStorage.getItem('farzin_mistake_puzzle_index') || '0');
        const safeIdx = idx % puzzles.length;
        const puzzle = puzzles[safeIdx];
        localStorage.setItem('farzin_mistake_puzzle_index', String((safeIdx + 1) % puzzles.length));
        return {
            puzzleId: puzzle.id || `mistake_${safeIdx}`,
            fen: puzzle.fen,
            moves: puzzle.moves,
            rating: puzzle.rating || 1400,
            themes: puzzle.themes || 'mistake',
            source: puzzle.source || '',
            category: puzzle.category || 'mistake',
        };
    },

    // ذخیره پازل در تاریخچه
    savePuzzleHistory: (puzzleData: any, result: 'solved' | 'wrong' | 'viewed', mode: string) => {
        if (!puzzleData) return;
        const key = 'farzin_puzzle_history';
        const existing: any[] = JSON.parse(localStorage.getItem(key) || '[]');
        const alreadySaved = existing.some(h => h.puzzleId === (puzzleData.puzzleId || puzzleData.id));
        if (alreadySaved) return;
        const entry = {
            puzzleId: puzzleData.puzzleId || puzzleData.id || `${Date.now()}`,
            fen: puzzleData.fen,
            rating: puzzleData.rating,
            themes: puzzleData.themes || '',
            source: puzzleData.source || '',
            result,
            date: new Date().toISOString(),
            mode,
        };
        localStorage.setItem(key, JSON.stringify([entry, ...existing].slice(0, 100)));
    },

    // ارسال نتیجه پازل به بک‌اند برای دریافت امتیاز
    submitResult: async (puzzleRating: number, userRating: number, isCorrect: boolean, usedHint: boolean) => {
        try {
            const response = await axios.post(`${API_URL}/submit`, {
                puzzleRating,
                userRating,
                isCorrect,
                usedHint
            });
            return response.data;
        } catch (error) {
            console.error('Error submitting puzzle result:', error);
            throw error;
        }
    }
};