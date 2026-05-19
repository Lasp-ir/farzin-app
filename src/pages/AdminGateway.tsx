import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Crown } from 'lucide-react';

export default function AdminGateway() {
    const navigate = useNavigate();

    const handleAdminLogin = () => {
        localStorage.setItem('farzin_auth', JSON.stringify({ role: 'admin' }));
        navigate('/admin/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-farzin-accent/5 rounded-full blur-[120px] pointer-events-none"></div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#161512] border border-[#35332e] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <Crown size={32} className="text-farzin-accent" />
                    </div>
                    <h1 className="text-2xl font-black text-white mb-2">مدیریت مرکزی فرزین</h1>
                    <p className="text-sm text-zinc-500 font-bold">ورود به سیستم مدیریت بات‌ها و رویدادها</p>
                </div>

                <button onClick={handleAdminLogin} className="w-full bg-[#161512] border border-[#35332e] hover:border-farzin-accent/50 p-5 rounded-2xl flex items-center gap-4 group transition-all">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform"><ShieldCheck size={24}/></div>
                    <div className="flex flex-col text-right flex-1">
                        <span className="font-black text-white text-lg">ورود مدیر کل</span>
                        <span className="text-xs text-zinc-500 mt-1">دسترسی به تنظیمات هسته سیستم</span>
                    </div>
                    <ChevronRight size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                </button>
            </motion.div>
        </div>
    );
}