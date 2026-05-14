import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Zap, AlertTriangle, Eraser } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const EMPTY_FEN = '8/8/8/8/8/8/8/8';

// تبدیل رشته FEN به آبجکت برای مدیریت راحت‌تر
function fenToObj(fen: string) {
    const obj: Record<string, string> = {};
    const rows = fen.split(' ')[0].split('/');
    const files = ['a','b','c','d','e','f','g','h'];
    rows.forEach((row, rIdx) => {
        let fIdx = 0;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (isNaN(Number(char))) {
                const color = char === char.toUpperCase() ? 'w' : 'b';
                const piece = color + char.toUpperCase();
                obj[files[fIdx] + (8 - rIdx)] = piece;
                fIdx++;
            } else {
                fIdx += parseInt(char);
            }
        }
    });
    return obj;
}

// تبدیل آبجکت به رشته FEN برای ارسال به موتور
function objToFen(obj: Record<string, string>, turn: string) {
    let fen = '';
    const files = ['a','b','c','d','e','f','g','h'];
    for (let r = 8; r >= 1; r--) {
        let empty = 0;
        for (let f of files) {
            const p = obj[f + r];
            if (p) {
                if (empty > 0) { fen += empty; empty = 0; }
                fen += p[0] === 'w' ? p[1].toUpperCase() : p[1].toLowerCase();
            } else {
                empty++;
            }
        }
        if (empty > 0) fen += empty;
        if (r > 1) fen += '/';
    }
    return `${fen} ${turn} - - 0 1`; // در حالت ادیتور، قلعه و آن‌پاسان رو خنثی می‌ذاریم
}

const PIECES = ['P', 'N', 'B', 'R', 'Q', 'K'];
const PIECE_ICONS: any = { P: '♟', N: '♞', B: '♝', R: '♜', Q: '♛', K: '♚' };

export default function BoardEditorModal({ isOpen, onClose, onConfirm }: any) {
    const [position, setPosition] = useState(fenToObj(INITIAL_FEN));
    const [activeTool, setActiveTool] = useState<string>('wP');
    const [turn, setTurn] = useState<'w'|'b'>('w');

    const hasWhiteKing = Object.values(position).includes('wK');
    const hasBlackKing = Object.values(position).includes('bK');
    const isValid = hasWhiteKing && hasBlackKing;

    const handleSquareClick = (square: string) => {
        setPosition(prev => {
            const newPos = { ...prev };
            if (activeTool === 'eraser') {
                delete newPos[square];
            } else if (activeTool) {
                // قانون یک شاه: اگر شاه انتخاب شده و از قبل وجود داره، شاه قبلی رو پاک کن
                if (activeTool === 'wK' && hasWhiteKing) {
                    const existingSq = Object.keys(newPos).find(k => newPos[k] === 'wK');
                    if (existingSq) delete newPos[existingSq];
                }
                if (activeTool === 'bK' && hasBlackKing) {
                    const existingSq = Object.keys(newPos).find(k => newPos[k] === 'bK');
                    if (existingSq) delete newPos[existingSq];
                }
                newPos[square] = activeTool;
            }
            return newPos;
        });
    };

    const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
        setPosition(prev => {
            const newPos = { ...prev };
            delete newPos[sourceSquare];
            newPos[targetSquare] = piece;
            return newPos;
        });
        return true;
    };

    const confirmSetup = () => {
        if (!isValid) return;
        onConfirm(objToFen(position, turn));
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-2 lg:p-4" dir="rtl">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="w-full max-w-4xl bg-[#161512] border border-[#35332e] rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden max-h-[95vh]">
                
                {/* 🌟 بخش سمت راست: تخته شطرنج */}
                <div className="p-4 lg:p-6 bg-[#1a1916] border-b lg:border-b-0 lg:border-l border-[#35332e] flex items-center justify-center lg:w-3/5">
                   <div className="w-full max-w-[400px] aspect-square rounded-xl overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-[#35332e]">
                      <Chessboard 
                         position={position}
                         boardOrientation="white"
                         customDarkSquareStyle={{ backgroundColor: '#779556' }}
                         customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                         onSquareClick={handleSquareClick}
                         onPieceDrop={handlePieceDrop}
                         arePiecesDraggable={true}
                         animationDuration={150}
                      />
                   </div>
                </div>

                {/* 🌟 بخش سمت چپ: ابزارها و پالت */}
                <div className="p-5 lg:p-6 flex flex-col lg:w-2/5 overflow-y-auto custom-scrollbar">
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="font-black text-white text-lg">ویرایشگر بورد</h2>
                      <button onClick={onClose} className="p-2 bg-[#262421] rounded-full text-zinc-400 hover:text-white transition-colors"><X size={18} /></button>
                   </div>

                   {/* پالت مهره‌های سفید */}
                   <div className="mb-4">
                      <span className="text-[10px] font-bold text-zinc-500 mb-2 block">مهره‌های سفید</span>
                      <div className="flex justify-between bg-[#1e1c19] border border-[#35332e] p-2 rounded-xl">
                         {PIECES.map(p => (
                             <button key={`w${p}`} onClick={() => setActiveTool(`w${p}`)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${activeTool === `w${p}` ? 'bg-zinc-200 shadow-sm border border-white' : 'hover:bg-[#262421]'}`}>
                                <span className="text-zinc-800 drop-shadow-sm">{PIECE_ICONS[p]}</span>
                             </button>
                         ))}
                      </div>
                   </div>

                   {/* پالت مهره‌های سیاه */}
                   <div className="mb-6">
                      <span className="text-[10px] font-bold text-zinc-500 mb-2 block">مهره‌های سیاه</span>
                      <div className="flex justify-between bg-[#1e1c19] border border-[#35332e] p-2 rounded-xl">
                         {PIECES.map(p => (
                             <button key={`b${p}`} onClick={() => setActiveTool(`b${p}`)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl transition-all ${activeTool === `b${p}` ? 'bg-[#35332e] shadow-sm border border-zinc-500' : 'hover:bg-[#262421]'}`}>
                                <span className="text-zinc-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)]">{PIECE_ICONS[p]}</span>
                             </button>
                         ))}
                      </div>
                   </div>

                   {/* ابزارهای کاربردی */}
                   <div className="grid grid-cols-2 gap-3 mb-6">
                       <button onClick={() => setActiveTool('eraser')} className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all border ${activeTool === 'eraser' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 shadow-inner' : 'bg-[#1e1c19] text-zinc-400 border-[#35332e] hover:bg-[#262421]'}`}>
                          <Eraser size={16} /> پاک‌کن
                       </button>
                       <button onClick={() => setPosition({})} className="flex items-center justify-center gap-2 p-3 bg-[#1e1c19] hover:bg-rose-500/10 border border-[#35332e] hover:border-rose-500/30 text-zinc-400 hover:text-rose-400 rounded-xl text-xs font-bold transition-all">
                          <Trash2 size={16} /> خالی کردن
                       </button>
                       <button onClick={() => setPosition(fenToObj(INITIAL_FEN))} className="flex items-center justify-center gap-2 p-3 bg-[#1e1c19] hover:bg-[#262421] border border-[#35332e] text-zinc-300 rounded-xl text-xs font-bold transition-all col-span-2">
                          <RotateCcw size={16} /> پوزیسیون اولیه
                       </button>
                   </div>

                   {/* انتخاب نوبت حرکت */}
                   <div className="mb-auto">
                       <span className="text-[10px] font-bold text-zinc-500 mb-2 block">نوبت حرکت</span>
                       <div className="flex bg-[#1e1c19] border border-[#35332e] p-1.5 rounded-xl">
                          <button onClick={() => setTurn('w')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${turn === 'w' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>سفید</button>
                          <button onClick={() => setTurn('b')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${turn === 'b' ? 'bg-[#35332e] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>سیاه</button>
                       </div>
                   </div>

                   {/* ارور ولیدیشن و دکمه نهایی */}
                   <div className="mt-6 pt-4 border-t border-[#35332e]">
                       {!isValid && (
                           <div className="flex items-center gap-2 mb-3 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                               <AlertTriangle size={16} className="shrink-0" />
                               <span className="text-[10px] font-bold">هر دو شاه باید روی صفحه باشند.</span>
                           </div>
                       )}
                       <button 
                           onClick={confirmSetup} 
                           disabled={!isValid}
                           className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${isValid ? 'bg-farzin-accent hover:bg-[#68824b] text-white shadow-[0_5px_20px_rgba(119,149,86,0.3)] active:scale-95' : 'bg-[#262421] text-zinc-600 border border-[#35332e] cursor-not-allowed'}`}
                       >
                           <Zap size={18} /> تایید و شروع آنالیز
                       </button>
                   </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
}