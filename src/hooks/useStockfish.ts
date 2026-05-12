// src/hooks/useStockfish.ts
import { useState, useEffect, useCallback, useRef } from 'react';

export interface EngineLine {
  multipv: number;
  depth: number;
  score: number; // امتیاز پوزیشن (مثلاً +1.2 به نفع سفید)
  isMate: boolean; // آیا پوزیشن مات قطعی دارد؟
  mateIn: number | null; // مات در چند حرکت؟
  pv: string; // رشته حرکات پیشنهادی (Principal Variation)
}

export function useStockfish() {
  const workerRef = useRef<Worker | null>(null);
  
  // استیت‌های وضعیت موتور
  const [isReady, setIsReady] = useState(false);
  const [engineStatus, setEngineStatus] = useState('در حال راه‌اندازی...');
  
  // استیت‌های خروجی آنالیز
  const [evaluation, setEvaluation] = useState<number>(0);
  const [lines, setLines] = useState<EngineLine[]>([]);

  useEffect(() => {
    // وصل شدن به همون فایلی که تو مرحله قبل ساختی
    const worker = new Worker('/engine/farzin-worker.js', { type: 'module' });
    workerRef.current = worker;

    // شنیدن پیام‌هایی که کارگر (Worker) برامون می‌فرسته
    worker.onmessage = (event) => {
      const { type, data } = event.data;

      // پیام‌های مربوط به وضعیت لودینگ (دانلود NNUE و ...)
      if (type === 'status') {
        setEngineStatus(data);
      } 
      // خطاهای احتمالی
      else if (type === 'error') {
        console.error('Engine Error:', data);
        setEngineStatus('خطا در بارگذاری موتور!');
      } 
      // خروجی‌های خودِ استوک‌فیش
      else if (type === 'engine_out') {
        const msg = data as string;

        // وقتی موتور آماده گرفتن تنظیمات شد
        if (msg === 'uciok') {
          worker.postMessage({ type: 'uci_cmd', data: 'setoption name MultiPV value 3' });
          worker.postMessage({ type: 'uci_cmd', data: 'isready' });
        }
        
        // وقتی موتور تمام تنظیمات رو اعمال کرد و آماده کار شد
        if (msg === 'readyok') {
          setIsReady(true);
        }

        // وقتی در حال محاسبه و تفکر است
        if (msg.startsWith('info depth')) {
          parseEngineInfo(msg);
        }
      }
    };

    return () => {
      // پاکسازی: وقتی کاربر از صفحه رفت، موتور رو خاموش کن تا باتری گوشی مصرف نشه
      worker.terminate();
    };
  }, []);

  // مترجم زبان استوک‌فیش به زبان React
  const parseEngineInfo = (msg: string) => {
    const depthMatch = msg.match(/depth (\d+)/);
    const multiPvMatch = msg.match(/multipv (\d+)/);
    const scoreCpMatch = msg.match(/score cp (-?\d+)/);
    const scoreMateMatch = msg.match(/score mate (-?\d+)/);
    const pvMatch = msg.match(/pv (.+)/);

    // اگر دیتای خط کامل نیست نادیده‌اش بگیر
    if (!depthMatch || !multiPvMatch || !pvMatch) return;

    const multipv = parseInt(multiPvMatch[1], 10);
    const depth = parseInt(depthMatch[1], 10);
    const pv = pvMatch[1];
    
    let score = 0;
    let isMate = false;
    let mateIn = null;

    if (scoreCpMatch) {
      // تبدیل Centipawn به امتیاز پیاده (150 میشه 1.5)
      score = parseInt(scoreCpMatch[1], 10) / 100;
    } else if (scoreMateMatch) {
      isMate = true;
      mateIn = parseInt(scoreMateMatch[1], 10);
      score = mateIn > 0 ? 100 : -100; // بی‌نهایت برای مات
    }

    const newLine: EngineLine = { multipv, depth, score, isMate, mateIn, pv };

    setLines((prevLines) => {
      const newLines = [...prevLines];
      // جایگذاری لاینِ جدید در ایندکس مربوط به خودش (0، 1 یا 2)
      newLines[multipv - 1] = newLine;
      
      // نوار ارزیابی (Eval Bar) باید همیشه با لاین اول (بهترین لاین) هماهنگ باشه
      if (multipv === 1) {
        setEvaluation(newLine.score);
      }
      
      return newLines.filter(Boolean);
    });
  };

  // فرمانِ شروع محاسبه به موتور
  const analyze = useCallback((fen: string, targetDepth: number = 24) => {
    if (!workerRef.current || !isReady) return;
    
    // دستور توقف آنالیز قبلی، پاک کردن مموری و شروع پوزیشن جدید
    workerRef.current.postMessage({ type: 'uci_cmd', data: 'stop' });
    workerRef.current.postMessage({ type: 'uci_cmd', data: 'ucinewgame' });
    workerRef.current.postMessage({ type: 'uci_cmd', data: `position fen ${fen}` });
    workerRef.current.postMessage({ type: 'uci_cmd', data: `go depth ${targetDepth}` });
  }, [isReady]);

  // فرمانِ توقف اجباری
  const stop = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'uci_cmd', data: 'stop' });
    }
  }, []);
  // تابع ارسال تنظیمات به موتور
  const setOption = useCallback((name: string, value: string | number) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'uci_cmd', data: `setoption name ${name} value ${value}` });
    }
  }, []);

  return { isReady, engineStatus, evaluation, lines, analyze, stop, setOption };
}