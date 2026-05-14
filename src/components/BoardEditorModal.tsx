import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Zap, AlertTriangle, Eraser, ShieldCheck, Footprints } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// دریافت تصاویر مهره‌ها با بالاترین کیفیت از CDN لیچس
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
            } else fIdx += parseInt(char);
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

    const boardRef = useRef<HTMLDivElement>(null);

    // 🌟 الگوریتم هوشمند تشخیص خانه‌های مجاز برای آن‌پاسان در لحظه
    const validEpSquares = useMemo(() => {
        const squares = ['-'];
        if (turn === 'w') {
            // اگر نوبت سفید است، پیاده سیاه باید روی ردیف 5 باشد
            FILES.forEach(f => {
                if (position[f + '5'] === 'bP' && !position[f + '6']) squares.push(f + '6');
            });
        } else {
            // اگر نوبت سیاه است، پیاده سفید باید روی ردیف 4 باشد
            FILES.forEach(f => {
                if (position[f + '4'] === 'wP' && !position[f + '3']) squares.push(f + '3');
            });
        }
        return squares;
    }, [position, turn]);

    useEffect(() => {
        // اگر خانه‌ی انتخابی قبلی برای آن‌پاسان دیگر معتبر نیست، ریست شود
        if (!validEpSquares.includes(enPassant)) {
            setEnPassant('-');
        }
    }, [validEpSquares, enPassant]);

    // 🌟 منطق ریاضی برای تبدیل موس درگ به مختصات تخته شطرنج
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const piece = e.dataTransfer.getData('piece');
        if (!piece || !boardRef.current) return;
        
        const rect = boardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const squareSize = rect.width / 8;
        
        const fileIdx = Math.floor(x / squareSize);
        const rankIdx = Math.floor(y / squareSize);
        
        if (fileIdx >= 0 && fileIdx <= 7 && rankIdx >= 0 && rankIdx <= 7) {
            const rank = 8 - rankIdx;
            const square = FILES[fileIdx] + rank;
            
            setPosition(prev => {
                const next = { ...prev };
                if (piece === 'eraser') {
                    delete next[square];
                } else {
                    // قانون یک شاه: اگر شاه درگ شد و از قبل وجود داشت، شاه قبلی را حذف کن
                    if (piece === 'wK') {
                        const existing = Object.keys(next).find(k => next[k] === 'wK');
                        if (existing) delete next[existing];
                    }
                    if (piece === 'bK') {
                        const existing = Object.keys(next).find(k => next[k] === 'bK');
                        if (existing) delete next[existing];
                    }
                    next[square] = piece;
                }
                return next;
            });
            setActivePiece(piece);
        }
    };

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
            if (activePiece === 'eraser') {
                delete newPos[square];
            } else {
                if (activePiece === 'wK') {
                    const existing = Object.keys(newPos).find(k => newPos[k] === 'wK');
                    if (existing) delete newPos[existing];
                }
                if (activePiece === 'bK') {
                    const existing = Object.keys(newPos).find(k => newPos[k] === 'bK');
                    if (existing) delete newPos[existing];
                }
                newPos[square] = activePiece;
            }
            return newPos;
        });
    };

    const hasWhiteKing = Object.values(position).includes('wK');
    const hasBlackKing = Object.values(position).includes('bK');
    const isValid = hasWhiteKing && hasBlackKing;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto" dir="ltr">
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        className="w-full max-w-4xl bg-[#161512] border border-[#35332e] rounded-3xl shadow-2xl flex flex-col lg:flex-row overflow-hidden my-auto"
                    >
                        
                        {/* 🌟 بخش اصلی: پالت‌ها و تخته شطرنج */}
                        <div className="flex-1 p-4 lg:p-6 flex flex-col items-center justify-center bg-[#1a1916] border-b lg:border-b-0 lg:border-r border-[#35332e]">
                            
                            {/* پالت مهره‌های سیاه */}
                            <div className="flex justify-center gap-1 sm:gap-2 mb-4 w-full max-w-[440px]">
                                {['bQ', 'bR', 'bB', 'bN', 'bK', 'bP'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setActivePiece(p)} 
                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${activePiece === p ? 'bg-[#35332e] border border-zinc-500 shadow-md scale-110' : 'bg-[#262421] hover:bg-[#35332e] opacity-80 hover:opacity-100'}`}
                                    >
                                        <img 
                                            src={getPieceImg(p)} 
                                            alt={p} 
                                            draggable 
                                            onDragStart={(e) => { e.dataTransfer.setData('piece', p); setActivePiece(p); }} 
                                            className="w-8 h-8 sm:w-10 sm:h-10 cursor-grab active:cursor-grabbing drop-shadow-sm" 
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* تخته شطرنج */}
                            <div 
                                ref={boardRef}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleDrop}
                                className="w-full max-w-[440px] aspect-square rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-[#35332e] overflow-hidden"
                            >
                                <Chessboard 
                                    position={position}
                                    onSquareClick={handleSquareClick}
                                    dropOffBoardAction="trash"
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
                                    animationDuration={150}
                                />
                            </div>

                            {/* پالت مهره‌های سفید و پاک‌کن */}
                            <div className="flex justify-center items-center gap-1 sm:gap-2 mt-4 w-full max-w-[440px]">
                                {['wQ', 'wR', 'wB', 'wN', 'wK', 'wP'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setActivePiece(p)} 
                                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all ${activePiece === p ? 'bg-zinc-200 border border-white shadow-md scale-110' : 'bg-[#262421] hover:bg-[#35332e] opacity-80 hover:opacity-100'}`}
                                    >
                                        <img 
                                            src={getPieceImg(p)} 
                                            alt={p} 
                                            draggable 
                                            onDragStart={(e) => { e.dataTransfer.setData('piece', p); setActivePiece(p); }} 
                                            className="w-8 h-8 sm:w-10 sm:h-10 cursor-grab active:cursor-grabbing drop-shadow-md" 
                                        />
                                    </button>
                                ))}
                                <div className="w-[1px] h-8 bg-[#35332e] mx-1 sm:mx-2" />
                                <button 
                                    onClick={() => setActivePiece('eraser')} 
                                    draggable
                                    onDragStart={(e) => { e.dataTransfer.setData('piece', 'eraser'); setActivePiece('eraser'); }}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing ${activePiece === 'eraser' ? 'bg-rose-500 text-white shadow-md scale-110' : 'bg-[#262421] text-rose-500/60 hover:bg-rose-500/20 hover:text-rose-400'}`}
                                >
                                    <Eraser size={20} />
                                </button>
                            </div>

                        </div>

                        {/* 🌟 بخش تنظیمات (سمت راست تخته - RTL) */}
                        <div className="w-full lg:w-[320px] bg-[#12110f] p-5 lg:p-6 flex flex-col gap-6" dir="rtl">
                            <div className="flex items-center justify-between">
                                <h2 className="font-black text-white text-lg">تنظیمات صفحه</h2>
                                <button onClick={onClose} className="p-2 bg-[#262421] rounded-xl text-zinc-500 hover:text-white transition-colors"><X size={18} /></button>
                            </div>

                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">نوبت حرکت</label>
                                <div className="flex bg-[#1a1916] p-1 rounded-xl border border-[#35332e]">
                                    <button onClick={() => setTurn('w')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${turn === 'w' ? 'bg-white text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>سفید</button>
                                    <button onClick={() => setTurn('b')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${turn === 'b' ? 'bg-[#35332e] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>سیاه</button>
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><ShieldCheck size={14} className="text-sky-400" /> حقوق قلعه</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'سفید (کوتاه)', key: 'K' }, { label: 'سفید (بلند)', key: 'Q' },
                                        { label: 'سیاه (کوتاه)', key: 'k' }, { label: 'سیاه (بلند)', key: 'q' }
                                    ].map(opt => (
                                        <button key={opt.key} onClick={() => setCastling(prev => ({ ...prev, [opt.key]: !prev[opt.key as keyof typeof castling] }))} 
                                            className={`py-2 px-2 rounded-lg text-[10px] font-bold border transition-all ${castling[opt.key as keyof typeof castling] ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-[#1a1916] border-[#35332e] text-zinc-500 hover:text-zinc-300'}`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Footprints size={14} className="text-amber-400" /> خانه‌ی آن‌پاسان</label>
                                <select value={enPassant} onChange={e => setEnPassant(e.target.value)} className="w-full bg-[#1a1916] border border-[#35332e] rounded-xl p-2.5 text-xs font-bold text-zinc-300 outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none">
                                    {validEpSquares.map(sq => (
                                        <option key={sq} value={sq}>{sq === '-' ? 'غیرفعال (-)' : sq}</option>
                                    ))}
                                </select>
                            </section>

                            <div className="flex gap-2 mt-auto pt-4 border-t border-[#35332e]">
                                <button onClick={() => setPosition({})} className="flex-1 flex flex-col items-center gap-1 bg-[#1a1916] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-[#35332e] hover:border-rose-500/30 p-2.5 rounded-xl transition-all" title="خالی کردن تخته">
                                    <Trash2 size={16} />
                                    <span className="text-[9px] font-bold">خالی</span>
                                </button>
                                <button onClick={() => setPosition(fenToObj(INITIAL_FEN))} className="flex-1 flex flex-col items-center gap-1 bg-[#1a1916] hover:bg-[#262421] text-zinc-400 hover:text-white border border-[#35332e] p-2.5 rounded-xl transition-all" title="چیدمان اولیه">
                                    <RotateCcw size={16} />
                                    <span className="text-[9px] font-bold">اولیه</span>
                                </button>
                            </div>

                            {!isValid && (
                                <div className="bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-rose-500 shrink-0" />
                                    <span className="text-[10px] font-bold text-rose-200">هر دو شاه باید روی صفحه باشند.</span>
                                </div>
                            )}

                            <button onClick={() => onConfirm(generateFinalFen())} disabled={!isValid}
                                className={`w-full py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${isValid ? 'bg-farzin-accent hover:bg-[#68824b] shadow-[0_5px_15px_rgba(119,149,86,0.3)] text-white active:scale-95' : 'bg-[#262421] text-zinc-600 border border-[#35332e] cursor-not-allowed'}`}
                            >
                                <Zap size={16} /> شروع آنالیز
                            </button>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}