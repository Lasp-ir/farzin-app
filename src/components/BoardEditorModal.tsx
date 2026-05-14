import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Zap, AlertTriangle, Eraser, ShieldCheck, Footprints } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// ابزار کمکی برای ساخت آدرس تصویر مهره‌ها
const getPieceImg = (p: string) => `https://lichess1.org/assets/_64XmY2/piece/merida/${p}.svg`;

function fenToObj(fen: string) {
    const obj: Record<string, string> = {};
    const rows = fen.split(' ')[0].split('/');
    rows.forEach((row, rIdx) => {
        let fIdx = 0;
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (isNaN(Number(char))) {
                const color = char === char.toUpperCase() ? 'w' : 'b';
                obj[FILES[fIdx] + (8 - rIdx)] = color + char.toUpperCase();
                fIdx++;
            } else {
                fIdx += parseInt(char);
            }
        }
    });
    return obj;
}

export default function BoardEditorModal({ isOpen, onClose, onConfirm }: any) {
    const [position, setPosition] = useState(fenToObj(INITIAL_FEN));
    const [activePiece, setActivePiece] = useState<string | null>('wP');
    const [turn, setTurn] = useState<'w' | 'b'>('w');
    const [castling, setCastling] = useState({ K: true, Q: true, k: true, q: true });
    const [enPassant, setEnPassant] = useState('-');

    const hasWhiteKing = Object.values(position).includes('wK');
    const hasBlackKing = Object.values(position).includes('bK');
    const isValid = hasWhiteKing && hasBlackKing;

    // تولید FN نهایی با تمام جزئیات
    const generateFinalFen = () => {
        let fen = '';
        for (let r = 8; r >= 1; r--) {
            let empty = 0;
            for (let f of FILES) {
                const p = position[f + r];
                if (p) {
                    if (empty > 0) { fen += empty; empty = 0; }
                    fen += p[0] === 'w' ? p[1].toUpperCase() : p[1].toLowerCase();
                } else empty++;
            }
            if (empty > 0) fen += empty;
            if (r > 1) fen += '/';
        }
        const castlingStr = (castling.K ? 'K' : '') + (castling.Q ? 'Q' : '') + (castling.k ? 'k' : '') + (castling.q ? 'q' : '') || '-';
        return `${fen} ${turn} ${castlingStr} ${enPassant} 0 1`;
    };

    const handleSquareClick = (square: string) => {
        if (!activePiece) return;
        setPosition(prev => {
            const newPos = { ...prev };
            if (activePiece === 'eraser') delete newPos[square];
            else newPos[square] = activePiece;
            return newPos;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto" dir="ltr">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} 
                        className="w-full max-w-5xl bg-[#161512] border border-[#35332e] rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden my-auto"
                    >
                        {/* بخش پالت مهره‌ها (کنار تخته - مشابه لیچس) */}
                        <div className="bg-[#1a1916] p-6 flex flex-row lg:flex-col justify-center items-center gap-3 border-b lg:border-b-0 lg:border-r border-[#35332e]">
                            <div className="flex flex-col gap-2">
                                {['wQ', 'wR', 'wB', 'wN', 'wK', 'wP'].map(p => (
                                    <button key={p} onClick={() => setActivePiece(p)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activePiece === p ? 'bg-farzin-accent border-2 border-white shadow-lg scale-110' : 'bg-[#262421] hover:bg-[#35332e] opacity-60 hover:opacity-100'}`}>
                                        <img src={getPieceImg(p)} alt={p} className="w-10 h-10" />
                                    </button>
                                ))}
                            </div>
                            <div className="w-[1px] h-10 lg:w-10 lg:h-[1px] bg-[#35332e] mx-2 lg:my-2" />
                            <div className="flex flex-col gap-2">
                                {['bQ', 'bR', 'bB', 'bN', 'bK', 'bP'].map(p => (
                                    <button key={p} onClick={() => setActivePiece(p)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${activePiece === p ? 'bg-farzin-accent border-2 border-white shadow-lg scale-110' : 'bg-[#262421] hover:bg-[#35332e] opacity-60 hover:opacity-100'}`}>
                                        <img src={getPieceImg(p)} alt={p} className="w-10 h-10" />
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setActivePiece('eraser')} className={`w-12 h-12 mt-2 rounded-xl flex items-center justify-center transition-all ${activePiece === 'eraser' ? 'bg-rose-500 text-white shadow-lg scale-110' : 'bg-[#262421] text-zinc-500'}`}>
                                <Eraser size={24} />
                            </button>
                        </div>

                        {/* بخش تخته */}
                        <div className="flex-1 p-4 lg:p-8 flex items-center justify-center bg-[#12110f]">
                            <div className="w-full max-w-[480px] aspect-square rounded-xl shadow-2xl border-4 border-[#262421]">
                                <Chessboard 
                                    position={position}
                                    onSquareClick={handleSquareClick}
                                    onPieceDrop={(source, target, piece) => {
                                        setPosition(prev => {
                                            const next = { ...prev };
                                            delete next[source];
                                            next[target] = piece;
                                            return next;
                                        });
                                        return true;
                                    }}
                                    customDarkSquareStyle={{ backgroundColor: '#779556' }}
                                    customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
                                />
                            </div>
                        </div>

                        {/* بخش تنظیمات (سمت راست - RTL برای متون فارسی) */}
                        <div className="w-full lg:w-[320px] bg-[#1a1916] p-6 flex flex-col gap-6 border-t lg:border-t-0 lg:border-l border-[#35332e]" dir="rtl">
                            <div className="flex items-center justify-between">
                                <h2 className="font-black text-white text-xl">تنظیمات صفحه</h2>
                                <button onClick={onClose} className="p-2 bg-[#262421] rounded-full text-zinc-500 hover:text-white transition-colors"><X size={20} /></button>
                            </div>

                            {/* نوبت حرکت */}
                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">نوبت حرکت</label>
                                <div className="flex bg-[#12110f] p-1 rounded-2xl border border-[#35332e]">
                                    <button onClick={() => setTurn('w')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${turn === 'w' ? 'bg-white text-black shadow-lg' : 'text-zinc-500'}`}>سفید</button>
                                    <button onClick={() => setTurn('b')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${turn === 'b' ? 'bg-[#35332e] text-white shadow-lg' : 'text-zinc-500'}`}>سیاه</button>
                                </div>
                            </section>

                            {/* حقوق قلعه */}
                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2"><ShieldCheck size={14} className="text-sky-400" /> حقوق قلعه‌رفتن</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'سفید (کوتاه)', key: 'K' }, { label: 'سفید (بلند)', key: 'Q' },
                                        { label: 'سیاه (کوتاه)', key: 'k' }, { label: 'سیاه (بلند)', key: 'q' }
                                    ].map(opt => (
                                        <button key={opt.key} onClick={() => setCastling(prev => ({ ...prev, [opt.key]: !prev[opt.key as keyof typeof castling] }))} 
                                            className={`py-2 px-3 rounded-xl text-[10px] font-bold border transition-all ${castling[opt.key as keyof typeof castling] ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-[#12110f] border-[#35332e] text-zinc-600'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* آن‌پاسان */}
                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block flex items-center gap-2"><Footprints size={14} className="text-amber-400" /> خانه‌ی آن‌پاسان</label>
                                <select value={enPassant} onChange={e => setEnPassant(e.target.value)} className="w-full bg-[#12110f] border border-[#35332e] rounded-xl p-3 text-sm text-zinc-300 outline-none focus:border-amber-500 transition-colors custom-scrollbar appearance-none">
                                    <option value="-">غیرفعال (-)</option>
                                    {FILES.map(f => <option key={f} value={`${f}3`}>{f}3 (برای سفید)</option>)}
                                    {FILES.map(f => <option key={f} value={`${f}6`}>{f}6 (برای سیاه)</option>)}
                                </select>
                            </section>

                            {/* دکمه‌های کنترلی */}
                            <div className="flex gap-2 mt-auto">
                                <button onClick={() => setPosition({})} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 p-3 rounded-2xl transition-all" title="خالی کردن تخته"><Trash2 size={18} className="mx-auto" /></button>
                                <button onClick={() => setPosition(fenToObj(INITIAL_FEN))} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-400 p-3 rounded-2xl transition-all" title="چیدمان اولیه"><RotateCcw size={18} className="mx-auto" /></button>
                            </div>

                            {!isValid && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl flex items-center gap-3">
                                    <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-rose-200">هر دو شاه باید روی صفحه باشند.</span>
                                </div>
                            )}

                            <button onClick={() => onConfirm(generateFinalFen())} disabled={!isValid}
                                className={`w-full py-4 rounded-[1.25rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${isValid ? 'bg-farzin-accent hover:shadow-[0_0_20px_rgba(119,149,86,0.4)] text-white active:scale-95' : 'bg-[#262421] text-zinc-600 cursor-not-allowed'}`}
                            >
                                <Zap size={18} /> تایید و شروع آنالیز
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}