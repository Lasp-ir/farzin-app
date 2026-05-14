import React, { useState } from 'react';
import { motion } from 'framer-motion';
// 🌟 BookOpen ایمپورت شد
import { User, Edit2, Check, Sparkles, Award, Star, ThumbsUp, AlertTriangle, Loader2, BookOpen } from 'lucide-react';

export interface MoveNode {
  id: string;
  san: string;
  fen: string;
  move: any;
  parentId: string | null;
  childrenIds: string[];
  depth: number;
}

export const TextIcon = ({ text }: { text: string }) => (
  <span className="font-black font-sans leading-none tracking-tighter" style={{ fontSize: '12px' }}>{text}</span>
);

export const COACH_COLORS = {
  // 🌟 آیکون کتاب باز شد
  book: { color: '#c27a3e', text: 'تئوری گشایش', icon: BookOpen }, 
  brilliant: { color: '#2dd4bf', text: 'درخشان', icon: Sparkles }, 
  great: { color: '#3b82f6', text: 'عالی', icon: Award }, 
  best: { color: '#22c55e', text: 'بهترین', icon: Star }, 
  excellent: { color: '#86efac', text: 'دقیق', icon: ThumbsUp }, 
  good: { color: '#bef264', text: 'خوب', icon: Check }, 
  inaccuracy: { color: '#eab308', text: 'بی‌دقتی', icon: () => <TextIcon text="?!" /> }, 
  mistake: { color: '#f97316', text: 'اشتباه', icon: () => <TextIcon text="?" /> }, 
  blunder: { color: '#ef4444', text: 'اشتباه فاحش', icon: () => <TextIcon text="??" /> }, 
  miss: { color: '#ec4899', text: 'فرصت از دست رفته', icon: AlertTriangle }, 
  loading: { color: '#a1a1aa', text: 'در حال تحلیل...', icon: Loader2 }
};

export const COLOR_PALETTES = [
  { label: 'طلایی', hex: '#fbbf24', rgb: '251, 191, 36' },
  { label: 'سبز', hex: '#34d399', rgb: '52, 211, 153' },
  { label: 'آبی', hex: '#0ea5e9', rgb: '14, 165, 233' },
  { label: 'بنفش', hex: '#a855f7', rgb: '168, 85, 247' },
  { label: 'قرمز', hex: '#f43f5e', rgb: '244, 63, 94' },
  { label: 'خاکستری', hex: '#a1a1aa', rgb: '161, 161, 170' },
];

export const getAbsScore = (line: any, fenTurn: 'w' | 'b') => {
    if (!line) return 0;
    let score = line.isMate ? (line.mateIn > 0 ? 100 : -100) : line.score;
    return fenTurn === 'b' ? -score : score;
};

export const epFormula = (scoreInPawns: number) => 1 / (1 + Math.pow(10, -scoreInPawns / 4));
export const getPieceValue = (p: string) => ({ p: 1, n: 3, b: 3, r: 5, q: 9 }[p.toLowerCase()] || 0);

export const ToggleSwitch = ({ checked, onChange, disabled = false }: { checked: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
  <div onClick={() => !disabled && onChange(!checked)} className={`w-10 h-5 rounded-full relative transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${checked ? 'bg-farzin-accent' : 'bg-[#35332e]'}`}>
    <motion.div initial={false} animate={{ x: checked ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm" />
  </div>
);

export const EditablePlayer = ({ color, data, onUpdate, material }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempData, setTempData] = useState(data);
  const handleSave = () => { onUpdate(tempData); setIsEditing(false); };

  const PIECE_SYMBOLS: any = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

  return (
    <div className="w-full flex items-center justify-between px-2 py-1 bg-[#1e1c19]/50 rounded-xl border border-[#35332e]/50 my-0.5">
      <div className="flex items-center gap-3 w-full">
        <div className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center shadow-inner border ${color === 'w' ? 'bg-zinc-200 border-zinc-400 text-zinc-800' : 'bg-[#262421] border-[#403e3a] text-zinc-400'}`}><User size={14} /></div>
        {isEditing ? (
          <div className="flex flex-col gap-1 w-full mr-2" dir="rtl">
            <input autoFocus className="bg-[#12110f] text-white text-xs px-2 py-0.5 rounded border border-farzin-accent outline-none" value={tempData.name} onChange={e => setTempData({...tempData, name: e.target.value})} placeholder="نام بازیکن"/>
            <div className="flex gap-2">
              <input className="bg-[#12110f] text-[10px] text-zinc-400 px-2 py-0.5 rounded border border-[#35332e] outline-none w-16" value={tempData.title} onChange={e => setTempData({...tempData, title: e.target.value})} placeholder="GM"/>
              <input className="bg-[#12110f] text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded border border-[#35332e] outline-none w-20" value={tempData.elo} onChange={e => setTempData({...tempData, elo: e.target.value})} placeholder="ریتینگ"/>
            </div>
          </div>
        ) : (
          <div className="flex flex-col mr-2 cursor-pointer group w-full" onClick={() => setIsEditing(true)}>
            <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white group-hover:text-farzin-accent transition-colors">{data.name || (color === 'w' ? 'بازیکن سفید' : 'بازیکن سیاه')}</span>
                <Edit2 size={10} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="flex items-center justify-between w-full mt-0.5">
                <div className="flex items-center gap-1.5">
                    {data.title && data.title !== 'بدون تایتل' && (<span className={`text-[9px] font-black px-1.5 rounded ${color === 'w' ? 'text-sky-400 bg-sky-500/10' : 'text-rose-400 bg-rose-500/10'}`}>{data.title}</span>)}
                    <span className="text-[10px] font-mono text-zinc-500">{data.elo || '---'}</span>
                </div>
                {material && material.pieces.length > 0 && (
                    <div className="flex items-center gap-1 shrink-0 bg-[#161512] px-1.5 rounded border border-[#35332e]/50" dir="ltr">
                        <div className="flex mr-1">
                            {material.pieces.map((p: string, i: number) => (
                                <span key={i} className={`text-xs -ml-1 ${color === 'w' ? 'text-zinc-200 drop-shadow-md' : 'text-zinc-500 drop-shadow-sm'}`}>
                                    {PIECE_SYMBOLS[p]}
                                </span>
                            ))}
                        </div>
                        {material.score > 0 && (
                            <span className={`text-[9px] font-bold ${color === 'w' ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                +{material.score}
                            </span>
                        )}
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
      {isEditing && (<button onClick={handleSave} className="p-1.5 bg-farzin-accent/20 text-farzin-accent rounded-lg hover:bg-farzin-accent hover:text-white transition-colors ml-1"><Check size={14} /></button>)}
    </div>
  );
};