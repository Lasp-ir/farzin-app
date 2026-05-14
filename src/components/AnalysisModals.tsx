import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Share2, Send, MessageCircle, Download, FileText, Save, 
  Sliders, Target, Clock, Cpu, Database, Route, AlertOctagon, RotateCcw 
} from 'lucide-react';
import { ToggleSwitch, COLOR_PALETTES } from '../utils/analysisConfig';

// ۱. مودال اشتراک‌گذاری (باگ توییتر در اینجا با SVG حل شد)
export const ShareModal = ({ isOpen, onClose, onShare }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-full max-w-xs shadow-2xl flex flex-col relative">
           <button onClick={onClose} className="absolute top-4 left-4 p-1.5 text-zinc-500 hover:text-white bg-[#262421] rounded-lg transition-colors z-10"><X size={16} /></button>
           <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-500/10 text-sky-400 flex items-center justify-center rounded-xl border border-sky-500/20"><Share2 size={20} /></div>
              <div className="flex flex-col">
                 <h2 className="font-black text-white text-sm">اشتراک‌گذاری آنالیز</h2>
                 <span className="text-[10px] text-zinc-500">ارسال برای دوستان یا دانلود فایل</span>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-3 mb-2">
               <button onClick={() => onShare('telegram')} className="flex flex-col items-center justify-center gap-2 p-3 bg-[#1e1c19] hover:bg-[#2aa198]/20 border border-[#35332e] hover:border-[#2aa198]/50 rounded-xl transition-all group">
                   <Send size={24} className="text-[#2aa198] group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold text-zinc-300">تلگرام</span>
               </button>
               <button onClick={() => onShare('whatsapp')} className="flex flex-col items-center justify-center gap-2 p-3 bg-[#1e1c19] hover:bg-green-500/20 border border-[#35332e] hover:border-green-500/50 rounded-xl transition-all group">
                   <MessageCircle size={24} className="text-green-500 group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-bold text-zinc-300">واتس‌اپ</span>
               </button>
               <button onClick={() => onShare('twitter')} className="flex flex-col items-center justify-center gap-2 p-3 bg-[#1e1c19] hover:bg-zinc-700/50 border border-[#35332e] hover:border-zinc-500 rounded-xl transition-all group col-span-2">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-200 group-hover:scale-110 transition-transform">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                   </svg>
                   <span className="text-[10px] font-bold text-zinc-300">انتشار در X (توییتر)</span>
               </button>
           </div>
           
           <div className="flex items-center gap-2 my-3">
               <div className="h-[1px] flex-1 bg-[#35332e]"></div>
               <span className="text-[9px] text-zinc-500 font-bold px-2">دانلود محلی</span>
               <div className="h-[1px] flex-1 bg-[#35332e]"></div>
           </div>

           <div className="flex gap-3">
               <button onClick={() => onShare('txt')} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 bg-[#262421] hover:bg-[#35332e] border border-[#403e3a] text-zinc-300 rounded-lg text-xs font-bold transition-all">
                   <FileText size={14} /> فایل TXT
               </button>
               <button onClick={() => onShare('pgn')} className="flex-1 flex items-center justify-center gap-1.5 p-2.5 bg-farzin-accent/10 hover:bg-farzin-accent text-farzin-accent hover:text-white border border-farzin-accent/30 rounded-lg text-xs font-bold transition-all shadow-sm">
                   <Download size={14} /> فایل PGN
               </button>
           </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ۲. مودال ذخیره بازی
export const SaveModal = ({ isOpen, onClose, onSave, saveName, setSaveName }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-[90%] max-w-sm shadow-2xl flex flex-col relative">
           <div className="flex items-center gap-2 mb-4 text-white"><Save size={20} className="text-farzin-accent" /><h2 className="font-bold text-base">ذخیره آنالیز</h2></div>
           <p className="text-xs text-zinc-400 mb-4 leading-relaxed">این آنالیز با تمام شاخه‌ها در آرشیو شما ذخیره خواهد شد.</p>
           <input autoFocus value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSave()} placeholder="مثلاً: گشایش اسپانیایی..." className="w-full bg-[#1e1c19] border border-[#35332e] rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-farzin-accent transition-colors mb-5 shadow-inner" />
           <div className="flex gap-2 w-full">
              <button onClick={onClose} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-400 hover:text-white font-bold py-2.5 text-sm rounded-xl transition-colors">لغو</button>
              <button onClick={onSave} className="flex-1 bg-farzin-accent hover:bg-[#68824b] text-white font-bold py-2.5 text-sm rounded-xl transition-colors shadow-lg">ذخیره در آرشیو</button>
           </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ۳. مودال ریست کردن تخته
export const ResetModal = ({ isOpen, onClose, onConfirm }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="bg-[#12110f] border border-red-500/20 rounded-2xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(239,68,68,0.1)] flex flex-col relative">
           <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-inner"><AlertOctagon size={24} /></div>
              <div className="flex flex-col">
                 <h2 className="font-black text-white text-lg tracking-tight">پاک کردن آنالیز</h2>
                 <span className="text-[10px] text-red-400/80 font-bold">این عمل غیرقابل بازگشت است!</span>
              </div>
           </div>
           <div className="bg-[#1a1916] border border-[#35332e] p-3 rounded-xl mb-6">
              <p className="text-xs text-zinc-400 leading-relaxed text-justify">آیا از پاک کردن کامل تاریخچه‌ی حرکات و بازگشت به پوزیسیون اولیه اطمینان دارید؟ تمام شاخه‌های فرعی بررسی شده نیز حذف خواهند شد.</p>
           </div>
           <div className="flex gap-3 w-full">
              <button onClick={onClose} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-300 hover:text-white font-bold py-2.5 text-sm rounded-xl transition-colors">انصراف</button>
              <button onClick={onConfirm} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)] active:scale-95 flex items-center justify-center gap-2"><RotateCcw size={16} /> بله، پاک شود</button>
           </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ۴. مودال تنظیمات موتور استوک‌فیش
export const SettingsModal = ({ isOpen, onClose, tempSettings, setTempSettings, onApply }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90dvh] overflow-y-auto custom-scrollbar">
           <div className="flex items-center gap-2 mb-5 text-white border-b border-[#35332e] pb-3"><Sliders size={20} className="text-farzin-accent" /><h2 className="font-bold text-base">تنظیمات پیشرفته موتور</h2></div>
           <div className="flex flex-col gap-5 mb-6">
             <div className="bg-[#1e1c19] border border-farzin-accent/30 p-3 rounded-xl flex items-center justify-between shadow-inner">
                <div>
                    <span className="text-sm font-bold text-white block mb-0.5">مربی هوشمند (Coach)</span>
                    <span className="text-[10px] text-zinc-500">جایگزین لاین‌های خام با فیدبک هوشمند متنی</span>
                </div>
                <ToggleSwitch checked={tempSettings.coachMode} onChange={(v) => setTempSettings((prev: any) => ({...prev, coachMode: v}))} />
             </div>
             <div className={`transition-opacity ${tempSettings.coachMode ? 'opacity-50 pointer-events-none' : ''}`}>
               <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold">خطوط تحلیل (Multi-PV)</label><span className="text-farzin-accent font-mono font-bold bg-farzin-accent/10 px-2 py-0.5 rounded">{tempSettings.multiPv}</span></div>
               <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 2, 3].map(num => (<button key={num} onClick={() => setTempSettings((prev: any) => ({...prev, multiPv: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.multiPv === num ? 'bg-[#262421] text-farzin-accent shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num} لاین</button>))}</div>
             </div>
             <div>
               <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5"><Target size={14} className="text-emerald-500"/> حداکثر عمق (Depth)</label><span className="text-emerald-500 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{tempSettings.maxDepth === 99 ? '∞' : tempSettings.maxDepth}</span></div>
               <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[18, 22, 24, 99].map(num => (<button key={num} onClick={() => setTempSettings((prev: any) => ({...prev, maxDepth: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.maxDepth === num ? 'bg-[#262421] text-emerald-500 shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num === 99 ? 'نامحدود' : num}</button>))}</div>
             </div>
             <div>
               <div className="flex justify-between items-center mb-2"><label className="text-sm text-zinc-300 font-bold flex items-center gap-1.5"><Clock size={14} className="text-rose-500"/> زمان محاسبه هر حرکت</label><span className="text-rose-500 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded">{tempSettings.maxTime === 0 ? '∞' : `${tempSettings.maxTime}s`}</span></div>
               <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 3, 5, 0].map(num => (<button key={num} onClick={() => setTempSettings((prev: any) => ({...prev, maxTime: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.maxTime === num ? 'bg-[#262421] text-rose-500 shadow-sm border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num === 0 ? 'بدون محدودیت' : `${num} ثانیه`}</button>))}</div>
             </div>
             <div className="flex gap-3">
               <div className="flex-1">
                 <div className="flex justify-between items-center mb-2"><label className="text-[11px] text-zinc-400 flex items-center gap-1"><Cpu size={12}/> پردازنده</label></div>
                 <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[1, 2, 4].map(num => (<button key={num} onClick={() => setTempSettings((prev: any) => ({...prev, threads: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.threads === num ? 'bg-[#262421] text-amber-500 border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num}</button>))}</div>
               </div>
               <div className="flex-1">
                 <div className="flex justify-between items-center mb-2"><label className="text-[11px] text-zinc-400 flex items-center gap-1"><Database size={12}/> رَم (MB)</label></div>
                 <div className="flex bg-[#1e1c19] p-1 rounded-xl border border-[#35332e]">{[16, 64, 128].map(num => (<button key={num} onClick={() => setTempSettings((prev: any) => ({...prev, hash: num}))} className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${tempSettings.hash === num ? 'bg-[#262421] text-sky-500 border border-[#403e3a]' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'}`}>{num}</button>))}</div>
               </div>
             </div>
           </div>
           <div className="flex gap-2 w-full mt-2">
              <button onClick={onClose} className="flex-1 bg-[#262421] hover:bg-[#35332e] text-zinc-400 hover:text-white font-bold py-2.5 text-sm rounded-xl transition-colors">انصراف</button>
              <button onClick={onApply} className="flex-1 bg-farzin-accent hover:bg-[#68824b] text-white font-bold py-2.5 text-sm rounded-xl transition-colors shadow-lg">اعمال تنظیمات</button>
           </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

// ۵. مودال تنظیمات گرافیکی فلش‌ها
export const ArrowSettingsModal = ({ isOpen, onClose, arrowSettings, setArrowSettings, arrowColors, setArrowColors, multiPv }: any) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" dir="rtl">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-[#161512] border border-[#35332e] rounded-2xl p-5 w-full max-w-sm shadow-2xl flex flex-col relative max-h-[90dvh] overflow-y-auto custom-scrollbar">
           <div className="flex items-center gap-2 mb-5 text-white border-b border-[#35332e] pb-3"><Route size={20} className="text-amber-500" /><h2 className="font-bold text-base">راهنمای بصری تخته</h2></div>
           <div className="flex flex-col gap-4 mb-6">
             <div className="flex items-center justify-between bg-[#1e1c19] p-3 rounded-xl border border-[#35332e]">
                <span className="text-sm font-bold text-white">رسم فلش حرکات برتر</span>
                <ToggleSwitch checked={arrowSettings.showArrows} onChange={(v) => setArrowSettings((prev: any) => ({...prev, showArrows: v}))} />
             </div>
             <div className={`flex flex-col bg-[#1e1c19] p-3 rounded-xl border border-[#35332e] transition-opacity ${!arrowSettings.showArrows ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                   <span className="text-sm font-bold text-white">نمایش مانور مهره‌ها</span>
                   <ToggleSwitch checked={arrowSettings.showManeuvers} onChange={(v) => setArrowSettings((prev: any) => ({...prev, showManeuvers: v}))} />
                </div>
                <div className="p-3 bg-[#161512] rounded-lg border border-[#35332e]">
                   <p className="text-xs text-zinc-400 leading-relaxed mb-4 text-justify">مانور نشان می‌دهد که موتور قصد دارد یک مهره را در چند حرکت متوالی طی یک مسیر پیوسته جابجا کند.</p>
                   <div className="flex items-center justify-center text-zinc-500 pb-1">
                      <div className="w-8 h-8 rounded-lg bg-[#262421] flex items-center justify-center border border-[#403e3a] shadow-inner"><span className="text-amber-500 text-lg">♞</span></div>
                      <div className="h-0.5 w-8 bg-amber-500 relative"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l-2 border-b-2 border-amber-500 rotate-45 -ml-0.5"></div></div>
                      <div className="w-8 h-8 rounded-lg bg-[#1a1916] flex items-center justify-center border border-[#35332e] border-dashed"></div>
                      <div className="h-0.5 w-8 bg-amber-500 relative opacity-60"><div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 border-l-2 border-b-2 border-amber-500 rotate-45 -ml-0.5"></div></div>
                      <div className="w-8 h-8 rounded-lg bg-[#1a1916] flex items-center justify-center border border-[#35332e] border-dashed"></div>
                   </div>
                </div>
             </div>
             <div className={`flex flex-col bg-[#1e1c19] p-3 rounded-xl border border-[#35332e] transition-opacity ${!arrowSettings.showArrows ? 'opacity-50 pointer-events-none' : ''}`}>
                <span className="text-sm font-bold text-white mb-1">رنگ‌بندی اختصاصی لاین‌ها</span>
                <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">این رنگ‌ها هم روی فلش‌های تخته و هم در داشبورد موتور اعمال می‌شوند.</p>
                <div className="flex flex-col gap-2">
                   {[0, 1, 2].map(idx => idx < multiPv && (
                     <div key={idx} className="flex items-center justify-between bg-[#161512] px-3 py-2 rounded-lg border border-[#35332e]">
                       <span className="text-xs text-zinc-400 font-bold">لاین {idx + 1}</span>
                       <div className="flex gap-2">
                         {COLOR_PALETTES.map(c => (
                           <button 
                             key={c.hex}
                             onClick={() => { const newColors = [...arrowColors]; newColors[idx] = c; setArrowColors(newColors); }}
                             className={`w-5 h-5 rounded-full transition-all ${arrowColors[idx].hex === c.hex ? 'scale-125 ring-2 ring-white shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'hover:scale-110 opacity-50 hover:opacity-100'}`}
                             style={{ backgroundColor: c.hex }}
                           />
                         ))}
                       </div>
                     </div>
                   ))}
                </div>
             </div>
           </div>
           <button onClick={onClose} className="w-full bg-[#262421] hover:bg-[#35332e] text-white font-bold py-3 text-sm rounded-xl transition-colors">تایید و بستن</button>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);