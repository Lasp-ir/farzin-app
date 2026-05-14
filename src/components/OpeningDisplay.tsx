import React, { useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { getDeepestOpening, initEcoDatabase } from '../utils/ecoParser';
import type { MoveNode } from '../utils/analysisConfig';

interface OpeningDisplayProps {
  tree: Record<string, MoveNode>;
  currentNodeId: string;
}

export default function OpeningDisplay({ tree, currentNodeId }: OpeningDisplayProps) {
  
  // 🌟 لود کردن دیتابیس در بک‌گراند با کمی تاخیر تا رندرِ اولیه تخته قفل نشه
  useEffect(() => {
    const timer = setTimeout(() => {
        initEcoDatabase();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // پیدا کردن اسم گشایش در هر حرکت
  const opening = useMemo(() => {
    if (!tree[currentNodeId]) return null;
    
    // استخراج مسیر حرکت از ریشه تا نودِ فعلی
    const fens: string[] = [];
    let curr = currentNodeId;
    while (curr && tree[curr]) {
      fens.push(tree[curr].fen);
      curr = tree[curr].parentId as string;
    }
    
    fens.reverse(); // مرتب‌سازی از اول بازی تا الان
    return getDeepestOpening(fens);
  }, [tree, currentNodeId]);

  return (
    <AnimatePresence mode="wait">
      {opening && opening.name !== 'Starting Position' && (
        <motion.div
          key={opening.eco + opening.name}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute top-2 left-1/2 -translate-x-1/2 z-[50] pointer-events-none flex items-center gap-2 bg-[#1a1916]/90 backdrop-blur-md border border-[#35332e] px-3 py-1.5 rounded-full shadow-[0_5px_15px_rgba(0,0,0,0.6)]"
          dir="ltr"
        >
          <BookOpen size={12} className="text-farzin-accent shrink-0" />
          <span className="font-mono text-[10px] font-black text-zinc-400 border-r border-[#35332e] pr-2 mr-0.5 shrink-0">
             {opening.eco}
          </span>
          <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[180px] md:max-w-[280px] tracking-tight drop-shadow-md pb-[1px]">
             {opening.name}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}