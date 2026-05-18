import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Award, Video, Crown, ShieldCheck, Loader2 } from 'lucide-react';

export default function InstructorProfile() {
    const { name } = useParams();
    const navigate = useNavigate();
    
    const [data, setData] = useState<{instructor: any, courses: any[]} | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/courses/instructor-profile/${name}`);
                if (res.ok) setData(await res.json());
            } catch (err) { console.error(err); } finally { setIsLoading(false); }
        };
        fetchProfile();
    }, [name]);

    if (isLoading) return <div className="min-h-screen bg-[#0c0b0a] flex items-center justify-center"><Loader2 className="animate-spin text-farzin-accent" size={40}/></div>;
    if (!data || !data.instructor) return <div className="min-h-screen bg-[#0c0b0a] text-white flex items-center justify-center">پروفایل استاد یافت نشد.</div>;

    const { instructor, courses } = data;

    return (
        <div className="min-h-screen bg-[#0c0b0a] text-zinc-200 flex flex-col pb-20" dir="rtl">
            
            {/* هدر و عکس کاور */}
            <div className="relative w-full h-64 bg-gradient-to-br from-[#1a1916] to-[#0c0b0a] border-b border-[#35332e] flex flex-col justify-end p-8">
                <button onClick={() => navigate(-1)} className="absolute top-6 right-6 p-2.5 bg-black/40 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-all border border-white/10">
                    <ChevronRight size={24} />
                </button>
                
                <div className="max-w-4xl mx-auto w-full flex items-end gap-6 relative z-10 translate-y-12">
                    <img src={instructor.avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'} alt={instructor.name} className="w-32 h-32 rounded-3xl object-cover border-4 border-[#0c0b0a] shadow-2xl bg-[#161512]" />
                    <div className="flex flex-col pb-2">
                        <span className="text-amber-500 font-black text-sm flex items-center gap-1.5 bg-[#1e1c19] w-max px-3 py-1 rounded-lg border border-[#35332e] mb-2"><Award size={16}/> {instructor.title || 'مدرس فرزین'}</span>
                        <h1 className="text-3xl font-black text-white">{instructor.name}</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto w-full px-6 mt-20 flex flex-col gap-10">
                
                {/* بیوگرافی */}
                {instructor.bio && (
                    <div className="bg-[#161512] border border-[#35332e] rounded-3xl p-6 md:p-8">
                        <h2 className="text-lg font-black text-white mb-4">درباره استاد</h2>
                        <p className="text-zinc-400 text-sm leading-loose whitespace-pre-wrap">{instructor.bio}</p>
                    </div>
                )}

                {/* دوره‌های استاد */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-black text-white border-r-4 border-farzin-accent pr-3">دوره‌های منتشر شده توسط {instructor.name} ({courses.length})</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        {courses.map(course => (
                            <div key={course.id} onClick={() => navigate(`/education`)} className="bg-[#161512] border border-[#35332e] rounded-2xl p-4 flex gap-4 cursor-pointer hover:border-farzin-accent/50 transition-colors group">
                                <img src={course.image} className="w-24 h-24 rounded-xl object-cover" alt="" />
                                <div className="flex flex-col flex-1">
                                    <h3 className="font-black text-white text-sm group-hover:text-farzin-accent transition-colors line-clamp-2 leading-snug mb-1">{course.title}</h3>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mt-1">
                                        <span className="bg-[#1e1c19] px-2 py-1 rounded-md border border-[#35332e]">{course.level}</span>
                                        <span className="flex items-center gap-1"><Video size={12}/> تدریس اختصاصی</span>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between">
                                        {course.isPremium ? (
                                            <div className="flex items-center gap-1.5 text-amber-500 font-black text-xs">
                                                <Crown size={14}/> {course.price} الماس
                                                {course.discount > 0 && <span className="bg-rose-500/20 text-rose-500 px-1.5 py-0.5 rounded text-[9px]">% تخفیف</span>}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs"><ShieldCheck size={14}/> رایگان</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}