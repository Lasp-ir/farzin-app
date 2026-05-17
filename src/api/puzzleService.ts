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