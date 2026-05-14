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
  
  const [showWizard, setShowWizard] = useState(false);
  
  const [token, setToken] = useState(localStorage.getItem('lichess_token') || '');
  const [tempToken, setTempToken] = useState('');

  const saveToken = () => {
    if (!tempToken.trim()) return;
    localStorage.setItem('lichess_token', tempToken.trim());
    setToken(tempToken.trim());
    setUnauthorized(false);
    setShowWizard(false); 
  }

  const clearToken = () => {
    localStorage.removeItem('lichess_token');
    setToken('');
    setUnauthorized(true);
    setShowWizard(false); 
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
              setShowWizard(false); 
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

  if (unauthorized) {
      if (!showWizard) {
          // 🌟 طراحی فشرده‌تر و مدرن‌تر برای جلوگیری از برش
          return (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-4 gap-3 text-center bg-[#161512] rounded-xl border border-[#35332e]">
                  <div className="w-12 h-12 bg-purple-500/10 text-purple-400 flex items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.2)] border border-purple-500/20 shrink-0">
                      <Database size={24} />
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                      <h3 className="font-black text-white text-sm">دیتابیس گشایش‌ها</h3>
                      <p className="text-[10px] leading-relaxed opacity-80 px-2 text-zinc-400 max-w-[200px]">
                          برای مشاهده آمار دقیق حرکات، اتصال مستقیم به سرورهای لیچس الزامی است.
                      </p>
                  </div>
                  <button 
                      onClick={() => setShowWizard(true)} 
                      className="mt-1 bg-purple-500 hover:bg-purple-400 text-white px-5 py-2.5 rounded-xl font-bold text-[11px] transition-all shadow-[0_5px_15px_rgba(168,85,247,0.3)] active:scale-95 flex items-center gap-2 shrink-0"
                  >
                      اتصال به دیتابیس <ArrowRight size={14} />
                  </button>
              </div>
          );
      }

      return (
          <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-y-auto custom-scrollbar p-4 relative" dir="rtl">
              <button onClick={() => setShowWizard(false)} className="absolute top-3 left-3 p-1.5 text-zinc-500 hover:text-white bg-[#262421] hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors z-10" title="بازگشت">
                  <X size={14} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded-xl border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                     <KeyRound size={16} />
                  </div>
                  <div>
                      <h3 className="font-black text-white text-xs">اتصال به حساب لیچس</h3>
                      <p className="text-[9px] text-zinc-500">مراحل زیر را انجام دهید</p>
                  </div>
              </div>

              <div className="flex flex-col gap-4 relative before:absolute before:right-[9px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#35332e] before:-z-10">
                  <div className="flex gap-3">
                      <div className="w-5 h-5 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[9px] font-bold">۱</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-[11px] font-bold text-zinc-200">کلیک روی این لینک</span>
                          <a href="https://lichess.org/account/oauth/token/create?description=Farzin+Analysis+App" target="_blank" rel="noreferrer" 
                             className="mt-1.5 text-[9px] text-sky-400 font-bold flex items-center gap-1.5 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-colors px-3 py-2 rounded-lg border border-sky-500/20 w-fit shadow-md">
                             <ExternalLink size={12} /> باز کردن سایت لیچس
                          </a>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <div className="w-5 h-5 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[9px] font-bold">۲</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-[11px] font-bold text-zinc-200">تولید کد امنیتی</span>
                          <span className="text-[9px] text-zinc-500 mt-1">در صفحه باز شده فقط دکمه‌ی آبی رنگ <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px] font-mono shadow-sm">Submit</span> را بزنید.</span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <div className="w-5 h-5 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[9px] font-bold">۳</div>
                      <div className="flex flex-col mt-0.5 w-full pr-1">
                          <span className="text-[11px] font-bold text-zinc-200 mb-1.5">کد تولید شده را بچسبانید</span>
                          <div className="flex w-full gap-2">
                             <input type="password" placeholder="lip_..." value={tempToken} onChange={e => setTempToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveToken()} className="flex-1 bg-[#1a1916] border border-[#35332e] text-xs px-2.5 py-2 rounded-xl outline-none focus:border-farzin-accent text-left font-mono" dir="ltr"/>
                             <button onClick={saveToken} disabled={!tempToken.trim()} className={`px-3 rounded-xl transition-all flex items-center justify-center ${tempToken.trim() ? 'bg-farzin-accent hover:bg-[#68824b] text-white' : 'bg-[#262421] text-zinc-500 cursor-not-allowed'}`}><CheckCircle2 size={16} /></button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (loading) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><Loader2 size={24} className="animate-spin text-purple-500" /><span className="text-[10px] text-zinc-400">در حال دریافت آمار...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><AlertCircle size={24} className="text-red-500" /><span className="text-[10px] text-zinc-400">خطا در ارتباط با دیتابیس</span><button onClick={clearToken} className="text-[9px] text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors">تلاش مجدد</button></div>;

  return (
    <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden relative" dir="ltr">
      <button onClick={clearToken} className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white bg-[#262421] border border-[#35332e] rounded-lg opacity-0 hover:opacity-100 transition-opacity z-10" title="تغییر کلید ارتباطی">
          <KeyRound size={12} />
      </button>

      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-2.5 border-b border-[#35332e] bg-[#1a1916]">
         <div className="w-14">Move</div>
         <div className="w-14 text-right">Games</div>
         <div className="flex-1 text-center ml-6">Win / Draw / Loss</div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {data?.moves.map(move => {
          const total = move.white + move.draws + move.black;
          if (total === 0) return null;
          const wPct = Math.round((move.white / total) * 100);
          const dPct = Math.round((move.draws / total) * 100);
          const bPct = 100 - wPct - dPct;

          return (
            <div key={move.uci} onClick={() => onMoveSelect(move.uci)} className="flex items-center py-2.5 px-2 hover:bg-[#262421] cursor-pointer rounded-lg transition-colors group">
              <div className="w-14 font-black text-zinc-100">{move.san}</div>
              <div className="w-14 text-right text-zinc-500 font-mono text-[10px] pr-1 tracking-tighter">{formatNumber(total)}</div>
              <div className="flex-1 ml-6 h-5 flex rounded-md overflow-hidden shadow-inner border border-black/20">
                 {wPct > 0 && <div style={{ width: `${wPct}%` }} className="bg-[#f1f1f1] flex items-center justify-center text-[9px] font-black text-black">{wPct > 18 && `${wPct}%`}</div>}
                 {dPct > 0 && <div style={{ width: `${dPct}%` }} className="bg-[#666] flex items-center justify-center text-[9px] font-black text-white border-x border-black/10">{dPct > 18 && `${dPct}%`}</div>}
                 {bPct > 0 && <div style={{ width: `${bPct}%` }} className="bg-[#222] flex items-center justify-center text-[9px] font-black text-[#aaa]">{bPct > 18 && `${bPct}%`}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}