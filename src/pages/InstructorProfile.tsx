import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Award, Video, Crown, ShieldCheck, Loader2, BookOpen } from 'lucide-react';

export default function InstructorProfile() {
    const { name } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<{instructor: any, courses: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 🔥 استفاده از encodeURIComponent برای پشتیبانی بی‌نقص از نام‌های فارسی در URL
                const res = await fetch(`http://localhost:5000/api/courses/instructor-profile/${encodeURIComponent(name || '')}`);
                if (res.ok) setData(await res.json());
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        fetchProfile();
    }, [name]);

    if (isLoading) return <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center"><Loader2 className="animate-spin text-farzin-accent" size={40}/></div>;
    if (!data || !data.instructor) return <div className="min-h-screen bg-[#0c0b0a] text-white flex items-center justify-center flex-col gap-4"><span className="text-xl font-black">پروفایل استاد یافت نشد.</span><button onClick={()=>navigate(-1)} className="px-4 py-2 bg-[#262421] rounded-xl">بازگشت</button></div>;

    const { instructor, courses } = data;

    return (
        <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col pb-20" dir="rtl">
            
            {/* 🌟 بخش هدر و کاور پروفایل */}
            <div className="relative w-full h-64 bg-gradient-to-br from-[#121110] to-[#0c0b0a] border-b border-[#35332e] flex flex-col justify-end p-6 md:p-8">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/10">
                    <ChevronRight size={24} />
                </button>
                
                <div className="max-w-4xl mx-auto w-full flex items-end gap-6 relative z-10 translate-y-12">
                    <img 
                        src={instructor.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'} 
                        alt={instructor.name} 
                        className="w-28 h-28 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-[#0c0b0a] shadow-2xl bg-[#161512]" 
                    />
                    <div className="flex flex-col pb-2">
                        <span className="text-amber-500 font-black text-xs flex items-center gap-1.5 bg-[#1e1c19] w-max px-3 py-1 rounded-lg border border-[#35332e] mb-2">
                            <Award size={14}/> {instructor.title || 'مدرس آکادمی فرزین'}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">{instructor.name}</h1>
                    </div>
                </div>
            </div>

            {/* 🌟 محتوای رزومه و دوره‌ها */}
            <div className="max-w-4xl mx-auto w-full px-4 md:px-6 mt-20 flex flex-col gap-8">
                
                {/* کادر بیوگرافی و رزومه استاد */}
                {instructor.bio && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#161512] border border-[#35332e] rounded-3xl p-6 md:p-8 shadow-sm">
                        <h2 className="text-base font-black text-white mb-4 flex items-center gap-2 border-r-2 border-farzin-accent pr-2">بیوگرافی و سوابق</h2>
                        <p className="text-zinc-400 text-sm leading-loose whitespace-pre-wrap font-medium">{instructor.bio}</p>
                    </motion.div>
                )}

                {/* لیست دوره‌های منتشر شده این استاد */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-base font-black text-white flex items-center gap-2 border-r-2 border-farzin-accent pr-2">
                        <BookOpen size={18} className="text-farzin-accent" />
                        دوره‌های آموزشی استاد ({courses.length})
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                        {courses.length === 0 ? (
                            <div className="col-span-2 text-center text-zinc-500 py-10 font-bold border border-dashed border-[#35332e] rounded-2xl">هیچ دوره‌ای از این استاد یافت نشد.</div>
                        ) : courses.map(course => {
                            const hasDiscount = course.discount > 0;
                            const finalPrice = hasDiscount ? Math.round(course.price * (1 - course.discount / 100)) : course.price;

                            return (
                                <motion.div 
                                    key={course.id} 
                                    whileHover={{ y: -4 }}
                                    onClick={() => navigate(`/education`)} 
                                    className="bg-[#161512] border border-[#35332e] rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-zinc-700 transition-all shadow-sm group"
                                >
                                    <img src={course.image} className="w-24 h-24 rounded-xl object-cover border border-[#35332e]" alt="" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <h3 className="font-black text-white text-sm group-hover:text-farzin-accent transition-colors line-clamp-2 leading-snug mb-1">{course.title}</h3>
                                        
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mt-1">
                                            <span className="bg-[#1e1c19] px-2 py-0.5 rounded border border-[#35332e]">{course.level}</span>
                                            <span className="bg-[#1e1c19] px-2 py-0.5 rounded border border-[#35332e]">{course.duration}</span>
                                        </div>
                                        
                                        <div className="mt-auto flex items-center justify-between pt-2">
                                            {course.isPremium ? (
                                                <div className="flex flex-col text-left">
                                                    {hasDiscount && (
                                                        <span className="text-[10px] text-zinc-500 line-through font-bold font-mono">{course.price}</span>
                                                    )}
                                                    <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs">
                                                        <Crown size={14}/> {finalPrice} الماس
                                                        {hasDiscount && <span className="bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded text-[9px] border border-rose-500/20">%{course.discount}</span>}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs"><ShieldCheck size={14}/> رایگان</div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}