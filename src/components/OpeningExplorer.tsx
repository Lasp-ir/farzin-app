import React, { useEffect, useState } from 'react';
import { Loader2, Database, AlertCircle, KeyRound, ArrowRight, ExternalLink, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OpeningExplorerProps {
  fen: string;
  onMoveSelect: (uci: string) => void;
}

interface MoveStats {
  uci: string;
  san: string;
  white: number;
  draws: number;
  black: number;
  averageRating: number;
}

interface ExplorerData {
  white: number;
  draws: number;
  black: number;
  moves: MoveStats[];
}

export default function OpeningExplorer({ fen, onMoveSelect }: OpeningExplorerProps) {
  const [data, setData] = useState<ExplorerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // 🌟 استیت برای نمایش مودالِ شیکِ آموزش
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  
  const [token, setToken] = useState(localStorage.getItem('lichess_token') || '');
  const [tempToken, setTempToken] = useState('');

  const saveToken = () => {
    if (!tempToken.trim()) return;
    localStorage.setItem('lichess_token', tempToken.trim());
    setToken(tempToken.trim());
    setUnauthorized(false);
    setIsConnectModalOpen(false);
  }

  const clearToken = () => {
    localStorage.removeItem('lichess_token');
    setToken('');
    setUnauthorized(true);
    setIsConnectModalOpen(false);
  }

  useEffect(() => {
    if (!token) {
        setUnauthorized(true);
        return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);
    setUnauthorized(false);

    fetch(`https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
          if (res.status === 401) { 
              setUnauthorized(true); 
              setIsConnectModalOpen(false); 
              throw new Error('Unauthorized'); 
          }
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
      })
      .then(fetchedData => {
        if (isMounted) { setData(fetchedData); setLoading(false); }
      })
      .catch((err) => {
        if (isMounted && err.message !== 'Unauthorized') { setError(true); setLoading(false); }
      });

    return () => { isMounted = false; };
  }, [fen, token]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // 🌟 پاپ‌آپ (مودال) شیک و ۳ مرحله‌ای برای دریافت توکن
  const renderConnectModal = () => (
    <AnimatePresence>
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="bg-[#12110f] border border-[#35332e] rounded-2xl p-6 w-full max-w-sm shadow-2xl flex flex-col relative"
          >
             <button onClick={() => setIsConnectModalOpen(false)} className="absolute top-4 left-4 p-1.5 text-zinc-500 hover:text-white bg-[#262421] rounded-lg transition-colors z-10">
                 <X size={16} />
             </button>

             <div className="flex items-center gap-4 mb-5 border-b border-[#35332e] pb-4">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                   <KeyRound size={24} />
                </div>
                <div className="flex flex-col">
                   <h2 className="font-black text-white text-lg tracking-tight">اتصال به لیچس</h2>
                   <span className="text-[10px] text-zinc-500 font-bold">فقط ۳ قدم ساده تا دیتابیس جهانی</span>
                </div>
             </div>
             
             <div className="flex flex-col gap-4 relative before:absolute before:right-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#35332e] before:-z-10">
                 <div className="flex gap-4">
                     <div className="w-8 h-8 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-300 z-10 text-xs font-black shadow-lg">۱</div>
                     <div className="flex flex-col mt-1">
                         <span className="text-xs font-bold text-zinc-200">کلیک روی این لینک</span>
                         <a href="https://lichess.org/account/oauth/token/create?description=Farzin+Analysis+App" target="_blank" rel="noreferrer" 
                            className="mt-2 text-[10px] text-purple-400 hover:text-white font-bold flex items-center justify-center gap-1.5 bg-purple-500/10 hover:bg-purple-500 px-3 py-2.5 rounded-xl border border-purple-500/20 w-fit transition-all shadow-md active:scale-95">
                            <ExternalLink size={14} /> باز کردن سایت لیچس
                         </a>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-8 h-8 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-300 z-10 text-xs font-black shadow-lg">۲</div>
                     <div className="flex flex-col mt-1">
                         <span className="text-xs font-bold text-zinc-200">تولید کد امنیتی</span>
                         <span className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                             در صفحه‌ی باز شده فقط دکمه‌ی آبی رنگ <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[9px] font-mono shadow-sm">Submit</span> را بزنید.
                         </span>
                     </div>
                 </div>
                 <div className="flex gap-4">
                     <div className="w-8 h-8 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-300 z-10 text-xs font-black shadow-lg">۳</div>
                     <div className="flex flex-col mt-1 w-full pr-1">
                         <span className="text-xs font-bold text-zinc-200 mb-2">کد را اینجا بچسبانید</span>
                         <div className="flex w-full gap-2">
                            <input 
                               type="password" placeholder="lip_..." value={tempToken} onChange={e => setTempToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveToken()} 
                               className="flex-1 bg-[#1a1916] border border-[#35332e] text-xs px-3 py-2.5 rounded-xl outline-none focus:border-purple-500 transition-colors text-left font-mono shadow-inner placeholder:text-zinc-600" dir="ltr"
                            />
                            <button onClick={saveToken} disabled={!tempToken.trim()} className={`px-4 rounded-xl transition-all flex items-center justify-center shadow-lg ${tempToken.trim() ? 'bg-purple-500 hover:bg-purple-400 text-white active:scale-95' : 'bg-[#262421] text-zinc-500 cursor-not-allowed border border-[#35332e]'}`}>
                               <CheckCircle2 size={18} />
                            </button>
                         </div>
                     </div>
                 </div>
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (unauthorized) {
      return (
          <>
            {/* 🌟 طراحی افقی و جمع‌وجور برای جا شدنِ کامل در تب */}
            <div className="flex items-center justify-between h-full w-full bg-[#161512] rounded-xl border border-[#35332e] p-3 gap-3" dir="rtl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-xl shadow-[0_0_15px_rgba(168,85,247,0.2)] border border-purple-500/20 shrink-0">
                        <Database size={20} />
                    </div>
                    <div className="flex flex-col">
                        <h3 className="font-black text-white text-xs">دیتابیس گشایش‌ها</h3>
                        <span className="text-[9px] text-zinc-500">نیازمند اتصال به لیچس</span>
                    </div>
                </div>
                <button 
                    onClick={() => setIsConnectModalOpen(true)} 
                    className="bg-purple-500 hover:bg-purple-400 text-white px-4 py-2 rounded-lg font-bold text-[10px] transition-all shadow-[0_5px_15px_rgba(168,85,247,0.3)] active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                    اتصال <ArrowRight size={12} />
                </button>
            </div>
            {renderConnectModal()}
          </>
      );
  }

  if (loading) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><Loader2 size={24} className="animate-spin text-purple-500" /><span className="text-[10px] text-zinc-400">در حال دریافت آمار...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><AlertCircle size={24} className="text-red-500" /><span className="text-[10px] text-zinc-400">خطا در ارتباط با دیتابیس</span><button onClick={clearToken} className="text-[9px] text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">تلاش مجدد</button></div>;

  return (
    <div className="flex flex-col h-full w-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden relative" dir="ltr">
      <button onClick={clearToken} className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white bg-[#262421] border border-[#35332e] rounded opacity-0 hover:opacity-100 transition-opacity z-10" title="تغییر کلید ارتباطی">
          <KeyRound size={10} />
      </button>

      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-2 border-b border-[#35332e] bg-[#1a1916]">
         <div className="w-12">Move</div>
         <div className="w-12 text-right">Games</div>
         <div className="flex-1 text-center ml-4">Win / Draw / Loss</div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {data?.moves.map(move => {
          const total = move.white + move.draws + move.black;
          if (total === 0) return null;
          const wPct = Math.round((move.white / total) * 100);
          const dPct = Math.round((move.draws / total) * 100);
          const bPct = 100 - wPct - dPct;

          return (
            <div key={move.uci} onClick={() => onMoveSelect(move.uci)} className="flex items-center py-2 px-2 hover:bg-[#262421] cursor-pointer rounded-lg transition-colors group mb-0.5">
              <div className="w-12 font-black text-zinc-100">{move.san}</div>
              <div className="w-12 text-right text-zinc-500 font-mono text-[10px] pr-1 tracking-tighter">{formatNumber(total)}</div>
              <div className="flex-1 ml-4 h-[14px] flex rounded-md overflow-hidden shadow-inner border border-black/20">
                 {wPct > 0 && <div style={{ width: `${wPct}%` }} className="bg-[#f1f1f1] flex items-center justify-center text-[8px] font-black text-black">{wPct > 18 && `${wPct}%`}</div>}
                 {dPct > 0 && <div style={{ width: `${dPct}%` }} className="bg-[#666] flex items-center justify-center text-[8px] font-black text-white border-x border-black/10">{dPct > 18 && `${dPct}%`}</div>}
                 {bPct > 0 && <div style={{ width: `${bPct}%` }} className="bg-[#222] flex items-center justify-center text-[8px] font-black text-[#aaa]">{bPct > 18 && `${bPct}%`}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}