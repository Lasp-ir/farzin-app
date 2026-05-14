import React, { useMemo, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { getDeepestOpening, initEcoDatabase } from '../utils/ecoParser';
import type { MoveNode } from '../utils/analysisConfig';

interface OpeningDisplayProps {
  tree: Record<string, MoveNode>;
  currentNodeId: string;
}

export default function OpeningDisplay({ tree, currentNodeId }: OpeningDisplayProps) {
  
  useEffect(() => {
    const timer = setTimeout(() => {
        initEcoDatabase();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const opening = useMemo(() => {
    if (!tree[currentNodeId]) return null;
    
    const fens: string[] = [];
    let curr = currentNodeId;
    while (curr && tree[curr]) {
      fens.push(tree[curr].fen);
      curr = tree[curr].parentId as string;
    }
    
    fens.reverse();
    return getDeepestOpening(fens);
  }, [tree, currentNodeId]);

  const eco = opening?.eco || '---';
  const name = opening?.name || 'Starting Position';

  return (
    <div className="w-full flex justify-center pt-1 pb-1.5 opacity-80 hover:opacity-100 transition-opacity">
      {/* 🌟 با اضافه شدن justify-center اینجا، محتوا کاملا در وسط بورد فیکس می‌شود */}
      <div className="flex items-center justify-center w-full max-w-[min(100vw-1.5rem,55vh)] lg:max-w-[600px] px-1 gap-2 text-zinc-400" dir="ltr">
        <BookOpen size={12} className="text-farzin-accent shrink-0" />
        <span className="font-mono text-[10px] font-black border-r border-[#35332e] pr-2 shrink-0">
           {eco}
        </span>
        <span className="text-[11px] font-bold truncate tracking-tight text-zinc-300">
           {name}
        </span>
      </div>
    </div>
  );
}