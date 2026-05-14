import ecoCodesData from './codes.json';

type EcoDatabase = Record<string, { eco: string; name: string; moves: string }>;
const ecoCodes = ecoCodesData as EcoDatabase;

const fenToEcoMap = new Map<string, { eco: string; name: string }>();

const normalizeFen = (fen: string) => {
  const parts = fen.split(' ');
  return parts.slice(0, 3).join(' ');
};

let initialized = false;

export const initEcoDatabase = () => {
  if (initialized) return;
  Object.entries(ecoCodes).forEach(([fen, data]) => {
    fenToEcoMap.set(normalizeFen(fen), {
      eco: data.eco,
      name: data.name
    });
  });
  initialized = true;
};

export const getDeepestOpening = (fens: string[]) => {
  initEcoDatabase();
  for (let i = fens.length - 1; i >= 0; i--) {
    const norm = normalizeFen(fens[i]);
    if (fenToEcoMap.has(norm)) {
      return fenToEcoMap.get(norm);
    }
  }
  return null;
};

// 🌟 تابع جدید: بررسی سریع اینکه آیا یک پوزیسیون جزو تئوری گشایش هست یا خیر
export const isBookPosition = (fen: string) => {
  initEcoDatabase();
  return fenToEcoMap.has(normalizeFen(fen));
};