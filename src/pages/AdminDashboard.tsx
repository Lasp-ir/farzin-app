import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Bot, Bell, Calendar, LogOut, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');

  useEffect(() => {
      const auth = JSON.parse(localStorage.getItem('farzin_auth') || '{}');
      if (auth.role !== 'admin') navigate('/admin');
  }, []);

  const logout = () => { localStorage.removeItem('farzin_auth'); navigate('/admin'); };

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* سایدبار */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent"><Settings size={20} /></div>
            <div className="flex flex-col"><span className="font-black text-white text-sm truncate">اتاق فرمان فرزین</span><span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Admin Panel</span></div>
        </div>
        <div className="flex flex-col p-4 gap-2 flex-1">
            <MenuButton icon={<LayoutDashboard size={18}/>} title="داشبورد اصلی" id="dashboard" active={activeMenu} setActive={setActiveMenu} />
            <MenuButton icon={<Bot size={18}/>} title="مدیریت ربات‌ها" id="bots" active={activeMenu} setActive={setActiveMenu} />
            <MenuButton icon={<Calendar size={18}/>} title="رویدادها و ایونت‌ها" id="events" active={activeMenu} setActive={setActiveMenu} />
            <MenuButton icon={<Bell size={18}/>} title="نوتیفیکیشن‌ها" id="notifications" active={activeMenu} setActive={setActiveMenu} />
        </div>
        <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={logout} className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-400 bg-rose-500/10 rounded-lg w-full justify-center py-2 transition-colors"><LogOut size={14}/> خروج از سیستم</button>
        </div>
      </div>

      {/* بخش اصلی */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="h-20 flex items-center justify-between px-6 md:px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-lg md:text-xl font-black text-white">
                {activeMenu === 'dashboard' ? 'نمای کلی سیستم' : activeMenu === 'bots' ? 'مدیریت ربات‌ها' : activeMenu === 'events' ? 'مدیریت رویدادها' : 'ارسال نوتیفیکیشن'}
            </h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            {activeMenu === 'dashboard' && (
                <div className="text-center text-zinc-500 py-20 font-bold border border-dashed border-[#35332e] rounded-2xl">
                    به پنل مدیریت مرکزی خوش آمدید.<br/>از منوی سمت راست برای مدیریت بخش‌های مختلف استفاده کنید.
                </div>
            )}
            
            {activeMenu === 'bots' && (
                <div className="text-center text-zinc-500 py-20 font-bold border border-dashed border-[#35332e] rounded-2xl">
                    ماژول مدیریت ربات‌ها به زودی در اینجا توسعه داده می‌شود...
                </div>
            )}
        </div>
      </div>
    </div>
  );
}

function MenuButton({ icon, title, id, active, setActive }: any) {
    return (
        <button onClick={() => setActive(id)} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${active === id ? 'bg-farzin-accent text-white shadow-lg' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
            {icon} {title}
        </button>
    );
}