import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, RotateCcw, Zap, AlertTriangle, Eraser, ShieldCheck, Footprints, LayoutGrid } from 'lucide-react';
import { Chessboard } from 'react-chessboard';

const INITIAL_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

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
    const [invalidPawnWarning, setInvalidPawnWarning] = useState(false);

    const boardRef = useRef<HTMLDivElement>(null);

    const validEpSquares = useMemo(() => {
        const squares = ['-'];
        if (turn === 'w') {
            FILES.forEach(f => {
                if (position[f + '5'] === 'bP' && !position[f + '6']) squares.push(f + '6');
            });
        } else {
            FILES.forEach(f => {
                if (position[f + '4'] === 'wP' && !position[f + '3']) squares.push(f + '3');
            });
        }
        return squares;
    }, [position, turn]);

    useEffect(() => {
        if (!validEpSquares.includes(enPassant)) {
            setEnPassant('-');
        }
    }, [validEpSquares, enPassant]);

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

    const handleConfirm = () => {
        let hasInvalidPawn = false;
        for (const [square, piece] of Object.entries(position)) {
            // پیاده سفید در عرض 1 یا پیاده سیاه در عرض 8
            if (piece === 'wP' && square.includes('1')) hasInvalidPawn = true;
            if (piece === 'bP' && square.includes('8')) hasInvalidPawn = true;
        }

        if (hasInvalidPawn) {
            setInvalidPawnWarning(true);
            return;
        }

        onConfirm(generateFinalFen());
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto" dir="ltr">
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                        className="w-full max-w-5xl bg-[#161512] border border-[#35332e] rounded-3xl shadow-2xl flex flex-col overflow-hidden my-auto relative"
                    >
                        {/* 🌟 هدر یکپارچه و مدرن در بالای پاپ‌آپ */}
                        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1916] border-b border-[#35332e] shrink-0" dir="rtl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400">
                                    <LayoutGrid size={20} />
                                </div>
                                <h2 className="font-black text-white text-xl tracking-tight">ویرایشگر بورد</h2>
                            </div>
                            <button onClick={onClose} className="p-2.5 bg-[#262421] hover:bg-rose-500 hover:text-white text-zinc-400 rounded-xl transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
                            {/* 🌟 بخش اصلی: پالت‌ها و تخته شطرنج */}
                            <div className="flex-1 p-5 lg:p-8 flex flex-col items-center justify-center bg-[#12110f] border-b lg:border-b-0 lg:border-l border-[#35332e]">
                                
                                {/* 🌟 پالت مهره‌های سیاه (با پس‌زمینه خاکستری روشن) */}
                                <div className="flex justify-center gap-2 mb-5 w-full max-w-[440px]">
                                    {['bQ', 'bR', 'bB', 'bN', 'bK', 'bP'].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setActivePiece(p)} 
                                            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${activePiece === p ? 'bg-zinc-200 border-2 border-farzin-accent scale-110 z-10 shadow-lg' : 'bg-zinc-300 hover:bg-zinc-200 opacity-90 hover:opacity-100'}`}
                                        >
                                            <img 
                                                src={getPieceImg(p)} 
                                                alt={p} 
                                                draggable 
                                                onDragStart={(e) => { e.dataTransfer.setData('piece', p); setActivePiece(p); }} 
                                                className="w-9 h-9 sm:w-11 sm:h-11 cursor-grab active:cursor-grabbing drop-shadow-sm" 
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* تخته شطرنج */}
                                <div 
                                    ref={boardRef}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={handleDrop}
                                    className="w-full max-w-[440px] aspect-square rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-4 border-[#262421] overflow-hidden bg-[#ebecd0]"
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
                                <div className="flex justify-center items-center gap-2 mt-5 w-full max-w-[440px]">
                                    {['wQ', 'wR', 'wB', 'wN', 'wK', 'wP'].map(p => (
                                        <button 
                                            key={p} 
                                            onClick={() => setActivePiece(p)} 
                                            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${activePiece === p ? 'bg-zinc-200 border-2 border-farzin-accent scale-110 z-10 shadow-lg' : 'bg-[#262421] hover:bg-[#35332e] opacity-90 hover:opacity-100'}`}
                                        >
                                            <img 
                                                src={getPieceImg(p)} 
                                                alt={p} 
                                                draggable 
                                                onDragStart={(e) => { e.dataTransfer.setData('piece', p); setActivePiece(p); }} 
                                                className="w-9 h-9 sm:w-11 sm:h-11 cursor-grab active:cursor-grabbing drop-shadow-md" 
                                            />
                                        </button>
                                    ))}
                                    <div className="w-[2px] h-10 bg-[#35332e] mx-1 sm:mx-2 rounded-full" />
                                    <button 
                                        onClick={() => setActivePiece('eraser')} 
                                        draggable
                                        onDragStart={(e) => { e.dataTransfer.setData('piece', 'eraser'); setActivePiece('eraser'); }}
                                        className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all cursor-grab active:cursor-grabbing shadow-sm ${activePiece === 'eraser' ? 'bg-rose-500 text-white border-2 border-white scale-110 z-10 shadow-lg' : 'bg-[#262421] text-rose-500/60 hover:bg-rose-500/20 hover:text-rose-400'}`}
                                    >
                                        <Eraser size={24} />
                                    </button>
                                </div>

                            </div>

                            {/* 🌟 بخش تنظیمات (سمت راست تخته - RTL) */}
                            <div className="w-full lg:w-[320px] bg-[#1a1916] p-6 lg:p-8 flex flex-col gap-8 shrink-0 overflow-y-auto custom-scrollbar" dir="rtl">
                                
                                <section>
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 block">نوبت حرکت</label>
                                    <div className="flex bg-[#12110f] p-1.5 rounded-2xl border border-[#35332e]">
                                        <button onClick={() => setTurn('w')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${turn === 'w' ? 'bg-white text-black shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>سفید</button>
                                        <button onClick={() => setTurn('b')} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${turn === 'b' ? 'bg-[#35332e] text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>سیاه</button>
                                    </div>
                                </section>

                                <section>
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><ShieldCheck size={16} className="text-sky-400" /> حقوق قلعه</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'سفید (کوتاه)', key: 'K' }, { label: 'سفید (بلند)', key: 'Q' },
                                            { label: 'سیاه (کوتاه)', key: 'k' }, { label: 'سیاه (بلند)', key: 'q' }
                                        ].map(opt => (
                                            <button key={opt.key} onClick={() => setCastling(prev => ({ ...prev, [opt.key]: !prev[opt.key as keyof typeof castling] }))} 
                                                className={`py-3 px-2 rounded-xl text-[11px] font-bold border transition-all shadow-sm ${castling[opt.key as keyof typeof castling] ? 'bg-sky-500/10 border-sky-500/40 text-sky-400' : 'bg-[#12110f] border-[#35332e] text-zinc-500 hover:bg-[#262421] hover:text-zinc-300'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <label className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Footprints size={16} className="text-amber-400" /> خانه‌ی آن‌پاسان</label>
                                    <select value={enPassant} onChange={e => setEnPassant(e.target.value)} className="w-full bg-[#12110f] border border-[#35332e] rounded-xl p-3.5 text-sm font-bold text-zinc-300 outline-none focus:border-amber-500 transition-colors cursor-pointer appearance-none shadow-inner">
                                        {validEpSquares.map(sq => (
                                            <option key={sq} value={sq}>{sq === '-' ? 'غیرفعال (-)' : sq}</option>
                                        ))}
                                    </select>
                                </section>

                                <div className="flex gap-3 mt-auto pt-6 border-t border-[#35332e]">
                                    <button onClick={() => setPosition({})} className="flex-1 flex flex-col items-center gap-2 bg-[#12110f] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-[#35332e] hover:border-rose-500/30 p-3 rounded-2xl transition-all shadow-sm" title="خالی کردن تخته">
                                        <Trash2 size={20} />
                                        <span className="text-[10px] font-bold">خالی</span>
                                    </button>
                                    <button onClick={() => setPosition(fenToObj(INITIAL_FEN))} className="flex-1 flex flex-col items-center gap-2 bg-[#12110f] hover:bg-[#262421] text-zinc-400 hover:text-white border border-[#35332e] p-3 rounded-2xl transition-all shadow-sm" title="چیدمان اولیه">
                                        <RotateCcw size={20} />
                                        <span className="text-[10px] font-bold">اولیه</span>
                                    </button>
                                </div>

                                {!isValid && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl flex items-center gap-3 shadow-inner">
                                        <AlertTriangle size={18} className="text-rose-500 shrink-0" />
                                        <span className="text-xs font-bold text-rose-200 leading-relaxed">هر دو شاه باید روی صفحه باشند.</span>
                                    </div>
                                )}

                                <button onClick={handleConfirm} disabled={!isValid}
                                className={`w-full py-4 rounded-[1.25rem] font-black text-sm flex items-center justify-center gap-2 transition-all ${isValid ? 'bg-farzin-accent hover:bg-[#68824b] shadow-[0_5px_20px_rgba(119,149,86,0.4)] text-white active:scale-95' : 'bg-[#262421] text-zinc-600 border border-[#35332e] cursor-not-allowed'}`}
                                >
                                    <Zap size={20} /> شروع آنالیز
                                </button>
                            </div>
                            {/* 🌟 پاپ‌آپ خطای پیاده غیرقانونی */}
                        <AnimatePresence>
                            {invalidPawnWarning && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[150] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" dir="rtl">
                                    <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#1e1c19] border border-amber-500/30 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center max-w-sm">
                                        <span className="text-6xl mb-4 drop-shadow-md">😲</span>
                                        <h3 className="font-black text-white text-lg mb-2">پیاده تو اولین عرض؟</h3>
                                        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">واقعاً؟ این پوزیشن اصلاً ممکن نیست. امکان نداره پیاده در عرض اول (یا آخر) حضور داشته باشه.</p>
                                        <button onClick={() => setInvalidPawnWarning(false)} className="w-full bg-[#262421] hover:bg-[#35332e] text-white font-bold py-3.5 rounded-xl transition-all border border-[#35332e] active:scale-95">
                                            باشه، اصلاح می‌کنم
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}