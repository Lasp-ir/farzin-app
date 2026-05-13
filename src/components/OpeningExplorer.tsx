import React, { useEffect, useState } from 'react';
import { Loader2, Database, AlertCircle, KeyRound, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react';

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
  
  const [token, setToken] = useState(localStorage.getItem('lichess_token') || '');
  const [tempToken, setTempToken] = useState('');

  const saveToken = () => {
    if (!tempToken.trim()) return;
    localStorage.setItem('lichess_token', tempToken.trim());
    setToken(tempToken.trim());
    setUnauthorized(false);
  }

  const clearToken = () => {
    localStorage.removeItem('lichess_token');
    setToken('');
    setUnauthorized(true);
  }

  useEffect(() => {
    if (!token) {
        setUnauthorized(true);
        return;
    }

    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(`https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
          if (res.status === 401) { setUnauthorized(true); throw new Error('Unauthorized'); }
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
      return (
          <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-y-auto custom-scrollbar p-4" dir="rtl">
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded-xl border border-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.1)]">
                     <Database size={20} />
                  </div>
                  <div>
                      <h3 className="font-black text-white text-sm">فعال‌سازی دیتابیس جهانی</h3>
                      <p className="text-[10px] text-zinc-500">متصل به سرورهای Lichess.org</p>
                  </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed mb-5 text-justify">
                  برای دسترسی به میلیون‌ها بازی و آنالیز دقیق گشایش‌ها، نیازمند یک کلید ارتباطی (توکن) رایگان از لیچس هستیم. فقط کافیست ۳ مرحله‌ی ۱۰ ثانیه‌ای زیر را انجام دهید:
              </p>
              <div className="flex flex-col gap-3 relative before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#35332e] before:-z-10">
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۱</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-xs font-bold text-zinc-200">ورود و تایید هویت</span>
                          <a href="https://lichess.org/account/oauth/token/create?description=Farzin+Analysis+App" target="_blank" rel="noreferrer" 
                             className="mt-2 text-[10px] text-sky-400 font-bold flex items-center gap-1.5 bg-sky-500/10 px-3 py-2 rounded-lg border border-sky-500/20 w-fit">
                             <ExternalLink size={14} /> دریافت کلید ارتباطی
                          </a>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۲</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-xs font-bold text-zinc-200">تولید کلید</span>
                          <span className="text-[10px] text-zinc-500">در صفحه باز شده، فقط دکمه‌ی آبی رنگ Submit را بزنید.</span>
                      </div>
                  </div>
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۳</div>
                      <div className="flex flex-col mt-0.5 w-full pr-1">
                          <span className="text-xs font-bold text-zinc-200 mb-1">جای‌گذاری</span>
                          <div className="flex w-full gap-2">
                             <input type="password" placeholder="lip_..." value={tempToken} onChange={e => setTempToken(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveToken()} className="flex-1 bg-[#1a1916] border border-[#35332e] text-xs px-3 py-2.5 rounded-xl outline-none focus:border-farzin-accent text-left font-mono" dir="ltr"/>
                             <button onClick={saveToken} disabled={!tempToken.trim()} className={`px-4 rounded-xl transition-all flex items-center justify-center ${tempToken.trim() ? 'bg-farzin-accent text-white' : 'bg-[#262421] text-zinc-500'}`}><CheckCircle2 size={18} /></button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  if (loading) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><Loader2 size={28} className="animate-spin text-purple-500" /><span className="text-xs text-zinc-400">در حال دریافت آمار...</span></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#161512] rounded-xl border border-[#35332e]"><AlertCircle size={28} className="text-red-500" /><span className="text-xs text-zinc-400">خطا در ارتباط با دیتابیس</span><button onClick={clearToken} className="text-[10px] text-red-400 border border-red-500/30 px-3 py-1 rounded-lg">تلاش مجدد</button></div>;

  return (
    <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden" dir="ltr">
      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-3 border-b border-[#35332e] bg-[#1a1916]">
         <div className="w-14">Move</div>
         <div className="w-14 text-right">Games</div>
         <div className="flex-1 text-center ml-6">Win / Draw / Loss</div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {data?.moves.map(move => {
          const total = move.white + move.draws + move.black;
          const wPct = Math.round((move.white / total) * 100);
          const dPct = Math.round((move.draws / total) * 100);
          const bPct = 100 - wPct - dPct;

          return (
            <div key={move.uci} onClick={() => onMoveSelect(move.uci)} className="flex items-center py-2.5 px-2 hover:bg-[#262421] cursor-pointer rounded-lg transition-colors group">
              <div className="w-14 font-black text-zinc-100">{move.san}</div>
              <div className="w-14 text-right text-zinc-500 font-mono text-[10px] pr-1">{formatNumber(total)}</div>
              
              {/* 🌟 نوار عملکرد بازطراحی شده */}
              <div className="flex-1 ml-6 h-5 flex rounded-md overflow-hidden shadow-inner border border-black/20">
                 {wPct > 0 && (
                   <div style={{ width: `${wPct}%` }} className="bg-[#f1f1f1] flex items-center justify-center text-[9px] font-black text-black">
                     {wPct > 18 && `${wPct}%`}
                   </div>
                 )}
                 {dPct > 0 && (
                   <div style={{ width: `${dPct}%` }} className="bg-[#666] flex items-center justify-center text-[9px] font-black text-white border-x border-black/10">
                     {dPct > 18 && `${dPct}%`}
                   </div>
                 )}
                 {bPct > 0 && (
                   <div style={{ width: `${bPct}%` }} className="bg-[#222] flex items-center justify-center text-[9px] font-black text-[#aaa]">
                     {bPct > 18 && `${bPct}%`}
                   </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}