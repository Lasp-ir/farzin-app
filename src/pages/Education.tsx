import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowRight, ArrowLeft, BookOpen, PlayCircle, Lock, CheckCircle } from 'lucide-react';

export default function Education() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const { userTier } = useAuthStore();

  const courses = [
    { id: 1, title: 'اصول شروع بازی', level: 'مبتدی', duration: '۴۵ دقیقه', premium: false, progress: 100 },
    { id: 2, title: 'تسلط بر دفاع سیسیلی', level: 'پیشرفته', duration: '۲ ساعت', premium: true, progress: 30 },
    { id: 3, title: 'تکنیک‌های آخر بازی', level: 'متوسط', duration: '۱.۵ ساعت', premium: true, progress: 0 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white p-4 pb-10">
      {/* هدر */}
      <div className="flex items-center mb-8 pt-2">
        <button 
          onClick={() => navigate('/home')} 
          className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors shadow-lg border border-gray-700"
        >
          {i18n.language === 'fa' ? <ArrowRight size={24} /> : <ArrowLeft size={24} />}
        </button>
        <h1 className="text-2xl font-bold mx-4">آکادمی آموزش</h1>
      </div>

      <div className="max-w-lg mx-auto w-full">
        <div className="flex flex-col gap-4">
          {courses.map((course) => {
            const isLocked = course.premium && userTier === 'FREE';
            const isCompleted = course.progress === 100;

            return (
              <div 
                key={course.id}
                onClick={isLocked ? () => alert('این دوره ویژه اعضای Premium است!') : () => alert('پخش ویدیو')}
                className={`relative overflow-hidden rounded-2xl border transition-all cursor-pointer
                  ${isLocked ? 'bg-gray-800/60 border-gray-700/50' : 'bg-gray-800 border-gray-600 hover:border-blue-500 shadow-lg'}
                `}
              >
                <div className="p-5 flex gap-4">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 shadow-inner
                    ${isLocked ? 'bg-gray-700' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}
                  `}>
                    {isCompleted ? <CheckCircle className="text-white" size={28} /> : <BookOpen className={isLocked ? 'text-gray-500' : 'text-white'} size={28} />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className={`font-bold text-lg leading-tight ${isLocked ? 'text-gray-400' : 'text-gray-100'}`}>
                        {course.title}
                      </h3>
                      {isLocked && <Lock size={16} className="text-amber-500 shrink-0 ml-1" />}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs mt-2">
                      <span className={`px-2 py-0.5 rounded text-white ${course.level === 'مبتدی' ? 'bg-green-600' : course.level === 'متوسط' ? 'bg-orange-500' : 'bg-red-500'}`}>
                        {course.level}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <PlayCircle size={12} /> {course.duration}
                      </span>
                    </div>

                    {/* نوار پیشرفت برای دوره‌های باز شده */}
                    {!isLocked && (
                      <div className="w-full bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                          style={{ width: `${course.progress}%` }} 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}