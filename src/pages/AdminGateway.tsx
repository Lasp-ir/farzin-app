import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, GraduationCap, ChevronLeft, 
    UserPlus, Loader2, Crown, CheckCircle2 
} from 'lucide-react';

export default function AdminGateway() {
    const navigate = useNavigate();
    const [view, setView] = useState<'selection' | 'instructor-login' | 'instructor-register'>('selection');
    const [instructors, setInstructors] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // فرم ثبت‌نام استاد جدید
    const [regForm, setRegForm] = useState({ name: '', title: '' });

    useEffect(() => {
        if (view === 'instructor-login') {
            fetchInstructors();
        }
    }, [view]);

    const fetchInstructors = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/courses/instructors/all');
            if (res.ok) setInstructors(await res.json());
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    // ورود به عنوان مدیر کل (دسترسی به همه‌چیز)
    const handleAdminLogin = () => {
        localStorage.setItem('farzin_auth', JSON.stringify({ role: 'admin' }));
        navigate('/admin/dashboard');
    };

    // ورود به عنوان یک استاد خاص (دسترسی فقط به دوره‌های خودش و پروفایلش)
    const handleInstructorLogin = (instructor: any) => {
        localStorage.setItem('farzin_auth', JSON.stringify({ 
            role: 'instructor', 
            instructorId: instructor.id, 
            name: instructor.name,
            avatar: instructor.avatar
        }));
        navigate('/admin/dashboard');
    };

    const handleRegisterInstructor = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/courses/instructors/create', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(regForm)
            });
            if (res.ok) {
                const newInst = await res.json();
                handleInstructorLogin(newInst); // لاگین خودکار بعد از ثبت‌نام
            }
        } catch (err) { console.error(err); } finally { setIsLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            {/* افکت‌های پس‌زمینه */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-farzin-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#161512] border border-[#35332e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Crown size={32} className="text-farzin-accent" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">پورتال مدیریت فرزین</h1>
                    <p className="text-sm text-zinc-500 font-bold">برای ورود، نقش خود را انتخاب کنید</p>
                </div>

                <AnimatePresence mode="wait">
                    {/* 🔹 صفحه انتخاب نقش */}
                    {view === 'selection' && (
                        <motion.div key="selection" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4">
                            <button onClick={handleAdminLogin} className="w-full bg-[#161512] border border-[#35332e] hover:border-farzin-accent/50 p-5 rounded-2xl flex items-center gap-4 group transition-all">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><ShieldCheck size={24}/></div>
                                <div className="flex flex-col text-right flex-1">
                                    <span className="font-black text-white text-lg">مدیر کل (Admin)</span>
                                    <span className="text-xs text-zinc-500 mt-1">دسترسی کامل به سیستم، کاربران و دوره‌ها</span>
                                </div>
                                <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                            </button>

                            <button onClick={() => setView('instructor-login')} className="w-full bg-[#161512] border border-[#35332e] hover:border-amber-500/50 p-5 rounded-2xl flex items-center gap-4 group transition-all">
                                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform"><GraduationCap size={24}/></div>
                                <div className="flex flex-col text-right flex-1">
                                    <span className="font-black text-white text-lg">ورود اساتید</span>
                                    <span className="text-xs text-zinc-500 mt-1">مدیریت دوره‌های شخصی و پروفایل استاد</span>
                                </div>
                                <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                            </button>
                        </motion.div>
                    )}

                    {/* 🔹 صفحه لیست اساتید برای لاگین */}
                    {view === 'instructor-login' && (
                        <motion.div key="instructor-login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4 bg-[#161512] border border-[#35332e] p-6 rounded-3xl shadow-2xl">
                            <div className="flex items-center gap-3 border-b border-[#35332e] pb-4 mb-2">
                                <button onClick={() => setView('selection')} className="p-2 bg-[#262421] rounded-lg text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
                                <h2 className="font-black text-white">انتخاب پروفایل استاد</h2>
                            </div>

                            {isLoading ? (
                                <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-amber-500" /></div>
                            ) : instructors.length === 0 ? (
                                <div className="text-center py-6">
                                    <p className="text-sm text-zinc-500 mb-4 font-bold">هنوز هیچ استادی در سیستم ثبت نشده است.</p>
                                    <button onClick={() => setView('instructor-register')} className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-xs font-black hover:bg-amber-500 hover:text-white transition-colors">ثبت اولین استاد</button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                    {instructors.map(inst => (
                                        <button key={inst.id} onClick={() => handleInstructorLogin(inst)} className="flex items-center gap-3 p-3 bg-[#1e1c19] hover:bg-[#262421] border border-[#35332e] rounded-xl transition-colors text-right group">
                                            <img src={inst.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#35332e]" />
                                            <div className="flex flex-col flex-1">
                                                <span className="font-black text-sm text-white group-hover:text-amber-400 transition-colors">{inst.name}</span>
                                                <span className="text-[10px] text-zinc-500 font-bold">{inst.title}</span>
                                            </div>
                                        </button>
                                    ))}
                                    <button onClick={() => setView('instructor-register')} className="mt-2 flex items-center justify-center gap-2 p-3 bg-dashed border border-dashed border-[#35332e] rounded-xl text-zinc-500 hover:text-white hover:border-zinc-500 transition-colors text-xs font-bold">
                                        <UserPlus size={16} /> ثبت نام استاد جدید
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* 🔹 صفحه ثبت نام استاد جدید */}
                    {view === 'instructor-register' && (
                        <motion.div key="instructor-register" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-4 bg-[#161512] border border-[#35332e] p-6 rounded-3xl shadow-2xl">
                            <div className="flex items-center gap-3 border-b border-[#35332e] pb-4 mb-2">
                                <button onClick={() => setView('instructor-login')} className="p-2 bg-[#262421] rounded-lg text-zinc-400 hover:text-white"><ChevronLeft size={18}/></button>
                                <h2 className="font-black text-white">ثبت پروفایل استاد</h2>
                            </div>

                            <form onSubmit={handleRegisterInstructor} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-400">نام و نام خانوادگی</label>
                                    <input required value={regForm.name} onChange={e=>setRegForm({...regForm, name: e.target.value})} placeholder="مثال: استاد مگنوس کارلسن" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-zinc-400">عنوان (تایتل)</label>
                                    <input value={regForm.title} onChange={e=>setRegForm({...regForm, title: e.target.value})} placeholder="مثال: استاد بزرگ (GM)" className="bg-[#1e1c19] border border-[#35332e] rounded-xl p-3 text-sm text-white outline-none focus:border-amber-500" />
                                </div>
                                
                                <button type="submit" disabled={isLoading} className="mt-2 w-full bg-amber-500 hover:bg-amber-400 text-[#161512] font-black py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
                                    {isLoading ? <Loader2 className="animate-spin"/> : <><CheckCircle2 size={18}/> ساخت پروفایل و ورود</>}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}