import ecoCodes from './codes.json';

// یک Hash Map برای جستجوی فوق‌سریع در صدم ثانیه O(1)
const fenToEcoMap = new Map<string, { eco: string; name: string }>();

// 🌟 تکنیک اثر انگشت: فقط ۳ بخش اول FEN رو نگه می‌داریم تا ترانسپوزیشن‌ها به هم متصل بشن
const normalizeFen = (fen: string) => {
  const parts = fen.split(' ');
  return parts.slice(0, 3).join(' ');
};

let initialized = false;

export const initEcoDatabase = () => {
  if (initialized) return;
  
  // نگاشت (Map) کردن تمام گشایش‌ها به اثر انگشتشون در رم
  (ecoCodes as Array<{eco: string, name: string, fen: string}>).forEach(opening => {
    fenToEcoMap.set(normalizeFen(opening.fen), {
      eco: opening.eco,
      name: opening.name
    });
  });
  initialized = true;
};

// تابع اصلی: دریافت مسیر بازی و پیدا کردن عمیق‌ترین گشایش
export const getDeepestOpening = (fens: string[]) => {
  initEcoDatabase();
  
  // از آخرین حرکت (عمیق‌ترین) شروع به جستجو به سمت عقب می‌کنیم
  for (let i = fens.length - 1; i >= 0; i--) {
    const norm = normalizeFen(fens[i]);
    if (fenToEcoMap.has(norm)) {
      return fenToEcoMap.get(norm);
    }
  }
  return null;
};