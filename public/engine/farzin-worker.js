// public/engine/farzin-worker.js

// ۱. وارد کردن فایل کامپایل‌شده‌ی استوک‌فیش
// چون این فایل تو همون پوشه public/engine هست، مستقیم اسمش رو می‌دیم
importScripts('sf_18_smallnet.js');

let sfEngine;

// وقتی فایل بالا لود میشه، یک تابع سراسری به اسم Stockfish می‌سازه که Promise برمی‌گردونه
Stockfish().then((engine) => {
  sfEngine = engine;
  
  // ۲. تعریف گوش‌دهنده: هرچی موتور گفت رو می‌گیریم و می‌فرستیم برای React
  sfEngine.listen = function(line) {
    postMessage({ type: 'engine_out', data: line });
  };

  // ۳. پیام به React: رفتم که مغز هوش مصنوعی رو دانلود کنم!
  postMessage({ type: 'status', data: 'در حال بارگذاری شبکه‌های عصبی (NNUE)...' });
  
  // ۴. دانلود فایل شبکه عصبی (NNUE)
  fetch('nn-4ca89e4b3abf.nnue')
    .then(response => {
      if (!response.ok) throw new Error('فایل NNUE پیدا نشد!');
      return response.arrayBuffer();
    })
    .then(buffer => {
      // ۵. تبدیل فایل به فرمت باینری و تزریق به موتور
      const nnueData = new Uint8Array(buffer);
      sfEngine.setNnueBuffer(nnueData);
      
      postMessage({ type: 'status', data: 'موتور قدرتمند فرزین آماده است!' });
      
      // ۶. استارت زدن پروتکل UCI
      sfEngine.uci('uci');
    })
    .catch(err => {
      postMessage({ type: 'error', data: 'خطا در بارگذاری مغز موتور: ' + err.message });
    });
}).catch(err => {
  postMessage({ type: 'error', data: 'خطا در اجرای فایل WASM: ' + err.message });
});

// ۷. دریافت دستورات از React و انتقال به موتور
self.onmessage = function(e) {
  const { type, data } = e.data;
  
  if (sfEngine && type === 'uci_cmd') {
    sfEngine.uci(data); // مثلاً uci('go depth 24')
  }
};