import React, { useEffect, useState } from 'react';
import { Loader2, Database, AlertCircle, KeyRound, ArrowRight, ExternalLink } from 'lucide-react';

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
  
  // 🌟 مدیریت توکن با LocalStorage
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

    // 🌟 ارسال درخواست به همراه توکن در هدرِ Authorization
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

  // 🌟 رندر کادر دریافت توکن در صورت خطای 401
  if (unauthorized) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-5 gap-4 text-center bg-[#161512] rounded-xl border border-[#35332e]">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded-full shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                 <KeyRound size={24} />
              </div>
              <div className="flex flex-col gap-1">
                 <h3 className="font-bold text-white text-sm">نیازمند توکن لیچس</h3>
                 <p className="text-[10px] leading-relaxed opacity-80 text-justify px-2">
                    به دلیل حملات شدید سایبری در ماه‌های اخیر، لیچس دسترسی آزاد به دیتابیس گشایش‌ها را مسدود کرده است. برای اتصال، توکن شخصی خود را وارد کنید.
                 </p>
              </div>
              <a href="https://lichess.org/account/oauth/token" target="_blank" rel="noreferrer" className="text-[10px] text-sky-400 hover:text-sky-300 font-bold transition-colors flex items-center gap-1 bg-sky-500/10 px-3 py-1.5 rounded-lg border border-sky-500/20">
                 ساخت توکن رایگان در لیچس <ExternalLink size={12} />
              </a>
              <div className="flex w-full mt-2 gap-2">
                 <input 
                    type="password" 
                    placeholder="lip_..." 
                    value={tempToken} 
                    onChange={e => setTempToken(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveToken()}
                    className="flex-1 bg-[#1a1916] border border-[#35332e] text-xs px-3 py-2 rounded-lg outline-none focus:border-sky-500 transition-colors text-left font-mono"
                    dir="ltr"
                 />
                 <button onClick={saveToken} className="bg-sky-500 hover:bg-sky-400 text-white px-4 rounded-lg transition-colors flex items-center justify-center shadow-lg active:scale-95">
                    <ArrowRight size={16} />
                 </button>
              </div>
          </div>
      );
  }

  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-purple-500/50 gap-3 bg-[#161512] rounded-xl border border-[#35332e]">
              <Loader2 size={28} className="animate-spin text-purple-500" />
              <span className="text-xs font-sans text-zinc-400">در حال اتصال به دیتابیس...</span>
          </div>
      );
  }

  if (error) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-red-500/50 gap-3 bg-[#161512] rounded-xl border border-[#35332e]">
              <AlertCircle size={28} />
              <span className="text-xs font-sans text-zinc-400">خطا در دریافت اطلاعات دیتابیس</span>
              <button onClick={clearToken} className="text-[10px] text-red-400 underline mt-2">حذف توکن فعلی و تلاش مجدد</button>
          </div>
      );
  }

  if (!data || data.moves.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-3 bg-[#161512] rounded-xl border border-[#35332e]">
              <Database size={28} className="opacity-50" />
              <span className="text-xs font-sans">حرکتی در این پوزیسیون یافت نشد</span>
          </div>
      );
  }

  return (
    <div className="flex flex-col h-full bg-[#161512] rounded-xl border border-[#35332e] overflow-hidden relative" dir="ltr">
      
      {/* 🌟 دکمه مخفی تغییر توکن در صورت نیاز کاربر */}
      <button onClick={clearToken} className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-white bg-[#262421] rounded opacity-0 hover:opacity-100 transition-opacity z-10" title="تغییر توکن">
          <KeyRound size={10} />
      </button>

      <div className="flex items-center text-[10px] text-zinc-500 font-bold px-3 py-2 border-b border-[#35332e] bg-[#1a1916]">
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
              <div className="w-12 text-right text-zinc-400 font-mono text-[10px] opacity-80">{formatNumber(total)}</div>
              
              <div className="flex-1 ml-4 h-[14px] flex rounded-md overflow-hidden opacity-90 group-hover:opacity-100 shadow-inner">
                 <div style={{ width: `${wPct}%` }} className="bg-zinc-200 flex items-center justify-center text-[#100f0d] font-bold" style={{fontSize: '8px'}}>
                     {wPct > 15 ? Math.round(wPct) : ''}
                 </div>
                 <div style={{ width: `${dPct}%` }} className="bg-zinc-500 flex items-center justify-center text-zinc-100 font-bold" style={{fontSize: '8px'}}>
                     {dPct > 15 ? Math.round(dPct) : ''}
                 </div>
                 <div style={{ width: `${bPct}%` }} className="bg-[#262421] flex items-center justify-center text-zinc-400 font-bold" style={{fontSize: '8px'}}>
                     {bPct > 15 ? Math.round(bPct) : ''}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}