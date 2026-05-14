import ecoCodesData from './codes.json';

// تعریف دقیق ساختار فایل JSON که دانلود کردیم
type EcoDatabase = Record<string, { eco: string; name: string; moves: string }>;
const ecoCodes = ecoCodesData as EcoDatabase;

// یک Hash Map برای جستجوی فوق‌سریع در صدم ثانیه O(1)
const fenToEcoMap = new Map<string, { eco: string; name: string }>();

// 🌟 تکنیک اثر انگشت: فقط ۳ بخش اول FEN رو نگه می‌داریم تا ترانسپوزیشن‌ها به هم متصل بشن
// بخش‌ها: ۱. چیدمان مهره‌ها ۲. نوبت حرکت ۳. وضعیت قلعه‌رفتن
const normalizeFen = (fen: string) => {
  const parts = fen.split(' ');
  return parts.slice(0, 3).join(' ');
};

let initialized = false;

export const initEcoDatabase = () => {
  if (initialized) return;
  
  // تبدیل آبجکتِ JSON به Map قدرتمندِ جاوااسکریپت برای سرچ آنی
  Object.entries(ecoCodes).forEach(([fen, data]) => {
    fenToEcoMap.set(normalizeFen(fen), {
      eco: data.eco,
      name: data.name
    });
  });
  
  initialized = true;
};

// تابع اصلی: دریافت مسیر بازی و پیدا کردن عمیق‌ترین گشایش شناخته‌شده
export const getDeepestOpening = (fens: string[]) => {
  initEcoDatabase();
  
  // از آخرین حرکت (عمیق‌ترین وضعیتِ روی تخته) به عقب جستجو می‌کنیم
  for (let i = fens.length - 1; i >= 0; i--) {
    const norm = normalizeFen(fens[i]);
    if (fenToEcoMap.has(norm)) {
      return fenToEcoMap.get(norm);
    }
  }
  return null;
};