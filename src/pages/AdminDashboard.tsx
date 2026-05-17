import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, BookOpen, Users, Settings, Plus, 
  Edit, Trash2, Video, ChevronRight, Crown, ShieldAlert,
  Search, PlayCircle, MoreVertical
} from 'lucide-react';

// دیتای تستی تا زمانی که به بک‌اند وصلش کنیم
const mockAdminCourses = [
  { id: '1', title: 'تسلط بر دفاع سیسیلی', instructor: 'کاسپاروف', category: 'openings', lessons: 12, isPremium: true, students: 245 },
  { id: '2', title: 'مبانی آخر بازی', instructor: 'مگنوس کارلسن', category: 'endgame', lessons: 8, isPremium: false, students: 1024 },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('courses');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex" dir="rtl">
      
      {/* 🌟 سایدبار ادمین */}
      <div className="w-64 bg-[#121110] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-white/5 gap-3">
            <div className="w-10 h-10 rounded-xl bg-farzin-accent/20 flex items-center justify-center text-farzin-accent">
                <Crown size={20} />
            </div>
            <div className="flex flex-col">
                <span className="font-black text-white text-lg tracking-tight">فرزین <span className="text-farzin-accent">ادمین</span></span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Control Panel</span>
            </div>
        </div>

        <div className="flex flex-col p-4 gap-2 flex-1">
            <button onClick={() => setActiveMenu('dashboard')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'dashboard' ? 'bg-farzin-accent text-white shadow-[0_5px_15px_rgba(119,149,86,0.3)]' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
                <LayoutDashboard size={18} /> داشبورد
            </button>
            <button onClick={() => setActiveMenu('courses')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'courses' ? 'bg-farzin-accent text-white shadow-[0_5px_15px_rgba(119,149,86,0.3)]' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
                <BookOpen size={18} /> مدیریت دوره‌ها
            </button>
            <button onClick={() => setActiveMenu('users')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'users' ? 'bg-farzin-accent text-white shadow-[0_5px_15px_rgba(119,149,86,0.3)]' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
                <Users size={18} /> کاربران
            </button>
            <button onClick={() => setActiveMenu('settings')} className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeMenu === 'settings' ? 'bg-farzin-accent text-white shadow-[0_5px_15px_rgba(119,149,86,0.3)]' : 'text-zinc-400 hover:bg-[#1a1916] hover:text-white'}`}>
                <Settings size={18} /> تنظیمات سیستم
            </button>
        </div>

        <div className="p-4 mt-auto border-t border-white/5">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors w-full justify-center py-2">
                <ChevronRight size={14} /> بازگشت به سایت
            </button>
        </div>
      </div>

      {/* 🌟 بخش اصلی محتوا */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* هدر بالا */}
        <div className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-[#0c0b0a]/80 backdrop-blur-md shrink-0">
            <h1 className="text-xl font-black text-white">مدیریت دوره‌های آموزشی</h1>
            <div className="flex items-center gap-4">
                <div className="relative">
                    <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input 
                        type="text" placeholder="جستجوی دوره..." 
                        value={search} onChange={e => setSearch(e.target.value)}
                        className="bg-[#161512] border border-[#35332e] text-sm text-white rounded-xl py-2.5 pr-10 pl-4 outline-none focus:border-farzin-accent w-64 transition-all"
                    />
                </div>
                <button className="bg-gradient-to-r from-farzin-accent to-emerald-600 hover:from-emerald-500 hover:to-farzin-accent text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(119,149,86,0.4)] active:scale-95">
                    <Plus size={18} /> دوره جدید
                </button>
            </div>
        </div>

        {/* لیست دوره‌ها */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
                {mockAdminCourses.map(course => (
                    <div key={course.id} className="bg-[#161512] border border-[#35332e] hover:border-zinc-600 p-5 rounded-2xl flex items-center justify-between transition-all group shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shrink-0 shadow-inner ${course.isPremium ? 'bg-amber-500/20 border border-amber-500/40 text-amber-500' : 'bg-sky-500/20 border border-sky-500/40 text-sky-400'}`}>
                                {course.isPremium ? <Crown size={24} /> : <PlayCircle size={24} />}
                            </div>
                            <div className="flex flex-col">
                                <h3 className="font-black text-lg text-white mb-1 group-hover:text-farzin-accent transition-colors">{course.title}</h3>
                                <div className="flex items-center gap-4 text-xs font-bold text-zinc-500">
                                    <span className="flex items-center gap-1.5"><Users size={14}/> {course.instructor}</span>
                                    <span className="flex items-center gap-1.5"><Video size={14}/> {course.lessons} جلسه</span>
                                    <span className="flex items-center gap-1.5 text-zinc-400 bg-[#262421] px-2 py-0.5 rounded border border-[#35332e]">{course.students} دانشجو</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            <button className="p-2.5 bg-[#262421] hover:bg-sky-500 hover:text-white text-zinc-400 rounded-xl transition-all" title="مدیریت جلسات"><Video size={18} /></button>
                            <button className="p-2.5 bg-[#262421] hover:bg-amber-500 hover:text-white text-zinc-400 rounded-xl transition-all" title="ویرایش دوره"><Edit size={18} /></button>
                            <button className="p-2.5 bg-[#262421] hover:bg-rose-500 hover:text-white text-zinc-400 rounded-xl transition-all" title="حذف"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="mt-8 bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl flex items-start gap-4">
                <ShieldAlert className="text-amber-500 mt-1 shrink-0" />
                <div className="flex flex-col">
                    <h4 className="font-black text-amber-400 text-sm mb-1">دیتابیس متصل نیست</h4>
                    <p className="text-xs text-amber-500/70 font-bold leading-relaxed">
                        این یک پیش‌نمایش از پنل ادمین است. در مرحله بعد API های بک‌اند را برای متصل کردن این فرم‌ها به دیتابیس (Prisma) خواهیم نوشت.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}