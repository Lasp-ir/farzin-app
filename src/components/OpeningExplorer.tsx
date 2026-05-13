import React, { useEffect, useState } from 'react';
import { Loader2, Database, AlertCircle, KeyRound, ArrowRight, ExternalLink, CheckCircle2, MousePointerClick, Copy } from 'lucide-react';

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
    setUnauthorized(false);

    fetch(`https://explorer.lichess.ovh/lichess?variant=standard&fen=${encodeURIComponent(fen)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
          if (res.status === 401) {
              setUnauthorized(true);
              throw new Error('Unauthorized');
          }
          if (!res.ok) throw new Error('Network response was not ok');
          return res.json();
      })
      .then(fetchedData => {
        if (isMounted) {
          setData(fetchedData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted && err.message !== 'Unauthorized') {
          setError(true);
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [fen, token]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // 🌟 رابط کاربری جدید، شیک و ویزارد-مانند برای دریافت توکن
  if (unauthorized) {
      return (
          <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-y-auto custom-scrollbar p-4 relative" dir="rtl">
              
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

              <div className="flex flex-col gap-3 mb-6 relative before:absolute before:right-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#35332e] before:-z-10">
                  
                  {/* مرحله اول */}
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۱</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-xs font-bold text-zinc-200">ورود و تایید هویت</span>
                          <span className="text-[10px] text-zinc-500">روی دکمه زیر کلیک کنید (اگر حساب ندارید، یکی بسازید).</span>
                          <a href="https://lichess.org/account/oauth/token/create?description=Farzin+Analysis+App" target="_blank" rel="noreferrer" 
                             className="mt-2 text-[10px] text-sky-400 hover:text-sky-300 font-bold transition-colors flex items-center gap-1.5 bg-sky-500/10 px-3 py-2 rounded-lg border border-sky-500/20 w-fit">
                             <ExternalLink size={14} /> دریافت کلید ارتباطی
                          </a>
                      </div>
                  </div>

                  {/* مرحله دوم */}
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۲</div>
                      <div className="flex flex-col mt-0.5">
                          <span className="text-xs font-bold text-zinc-200">تولید کلید</span>
                          <span className="text-[10px] text-zinc-500 flex items-center gap-1">در صفحه‌ای که باز شد، فقط دکمه‌ی آبی رنگ <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[8px]">Submit</span> را بزنید.</span>
                      </div>
                  </div>

                  {/* مرحله سوم */}
                  <div className="flex gap-3">
                      <div className="w-6 h-6 shrink-0 rounded-full bg-[#262421] border-2 border-[#35332e] flex items-center justify-center text-zinc-400 z-10 text-[10px] font-bold">۳</div>
                      <div className="flex flex-col mt-0.5 w-full pr-1">
                          <span className="text-xs font-bold text-zinc-200 mb-1">کپی و جای‌گذاری</span>
                          <span className="text-[10px] text-zinc-500 mb-2">متن تولید شده را کپی کرده و اینجا وارد کنید:</span>
                          <div className="flex w-full gap-2">
                             <input 
                                type="password" 
                                placeholder="lip_..." 
                                value={tempToken} 
                                onChange={e => setTempToken(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && saveToken()}
                                className="flex-1 bg-[#1a1916] border border-[#35332e] text-xs px-3 py-2.5 rounded-xl outline-none focus:border-farzin-accent transition-colors text-left font-mono shadow-inner"
                                dir="ltr"
                             />
                             <button onClick={saveToken} disabled={!tempToken.trim()} className={`px-4 rounded-xl transition-all flex items-center justify-center shadow-lg ${tempToken.trim() ? 'bg-farzin-accent hover:bg-[#68824b] text-white active:scale-95' : 'bg-[#262421] text-zinc-500 cursor-not-allowed'}`}>
                                <CheckCircle2 size={18} />
                             </button>
                          </div>
                      </div>
                  </div>

              </div>
          </div>
      );
  }

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3 bg-[#161512] rounded-xl border border-[#35332e]">
              <Loader2 size={28} className="animate-spin text-purple-500" />
              <span className="text-xs font-sans text-zinc-400">در حال دریافت آمار...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-red-500/50 gap-3 bg-[#161512] rounded-xl border border-[#35332e] p-4 text-center">
              <AlertCircle size={28} />
              <span className="text-xs font-sans text-zinc-400">خطا در برقراری ارتباط با دیتابیس</span>
              <button onClick={clearToken} className="text-[10px] text-red-400 border border-red-500/30 bg-red-500/10 px-3 py-1.5 rounded-lg mt-2 hover:bg-red-500 hover:text-white transition-colors">
                  تغییر کلید ارتباطی و تلاش مجدد
              </button>
          </div>
      );
  }

  if (!data || data.moves.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 bg-[#161512] rounded-xl border border-[#35332e]">
              <Database size={28} className="opacity-50" />
              <span className="text-xs font-sans">حرکتی در این پوزیسیون ثبت نشده است</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden relative" dir="ltr">
      
      <button onClick={clearToken} className="absolute top-2 right-2 p-1.5 text-zinc-500 hover:text-white bg-[#262421] border border-[#35332e] rounded-lg opacity-0 hover:opacity-100 transition-opacity z-10" title="تغییر کلید ارتباطی">
          <KeyRound size={12} />
      </button>

      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-2.5 border-b border-[#35332e] bg-[#1a1916]">
         <div className="w-12">Move</div>
         <div className="w-12 text-right">Games</div>
         <div className="flex-1 text-center ml-4">Win / Draw / Loss</div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1.5">
        {data.moves.map(move => {
          const total = move.white + move.draws + move.black;
          if (total === 0) return null;
          
          const wPct = (move.white / total) * 100;
          const dPct = (move.draws / total) * 100;
          const bPct = (move.black / total) * 100;

          return (
            <div 
                key={move.uci} 
                onClick={() => onMoveSelect(move.uci)} 
                className="flex items-center text-xs py-2 px-2 hover:bg-[#262421] cursor-pointer rounded-lg transition-colors group mb-0.5"
            >
              <div className="w-12 font-black text-zinc-200 group-hover:text-purple-400 transition-colors">{move.san}</div>
              <div className="w-12 text-right text-zinc-400 font-mono text-[10px] opacity-80 tracking-tighter">{formatNumber(total)}</div>
              
              <div className="flex-1 ml-4 h-[14px] flex rounded-md overflow-hidden opacity-90 group-hover:opacity-100 shadow-inner">
                 <div style={{ width: `${wPct}%` }} className="bg-zinc-200 flex items-center justify-center text-[#100f0d] font-bold transition-all" style={{fontSize: '8px'}}>
                     {wPct > 15 ? `${Math.round(wPct)}%` : ''}
                 </div>
                 <div style={{ width: `${dPct}%` }} className="bg-zinc-500 flex items-center justify-center text-zinc-100 font-bold transition-all" style={{fontSize: '8px'}}>
                     {dPct > 15 ? `${Math.round(dPct)}%` : ''}
                 </div>
                 <div style={{ width: `${bPct}%` }} className="bg-[#262421] flex items-center justify-center text-zinc-400 font-bold transition-all" style={{fontSize: '8px'}}>
                     {bPct > 15 ? `${Math.round(bPct)}%` : ''}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}