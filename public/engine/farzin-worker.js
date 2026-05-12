import Stockfish from './sf_18_smallnet.js';

let sfEngine;

// 🔥 یک چکِ امنیتی برای اینکه مطمئن بشیم مرورگر اجازه کار چند‌نخی رو بهمون داده
if (typeof SharedArrayBuffer === 'undefined') {
  console.error("🚨 قابلیت SharedArrayBuffer غیرفعال است! هدرهای امنیتی Vite اعمال نشده‌اند.");
  postMessage({ type: 'status', data: 'خطا: محدودیت امنیتی مرورگر' });
}

Stockfish({
  // ۱. مسیر فایل‌های جانبی مثل wasm
  locateFile: (path) => {
    // اگه موتور هر نوع فایلی برای worker خواست، همینی که داریم رو به خوردش بده!
    if (path.includes('worker.js')) return '/engine/sf_18_smallnet.worker.js';
    return '/engine/' + path;
  },
  
  // ۲. 🔥 رازِ اصلی: دادن آدرسِ مطلقِ خودِ اسکریپت به موتور برای حل ارور undefined
  mainScriptUrlOrBlob: '/engine/sf_18_smallnet.js'
  
}).then((engine) => {
  sfEngine = engine;
  
  sfEngine.listen = function(line) {
    postMessage({ type: 'engine_out', data: line });
  };

  postMessage({ type: 'status', data: 'دانلود شبکه عصبی...' });
  
  fetch('/engine/nn-4ca89e4b3abf.nnue')
    .then(response => {
      if (!response.ok) throw new Error('فایل NNUE پیدا نشد');
      return response.arrayBuffer();
    })
    .then(buffer => {
      const nnueData = new Uint8Array(buffer);
      sfEngine.setNnueBuffer(nnueData);
      postMessage({ type: 'status', data: 'موتور آماده است' });
      sfEngine.uci('uci');
    })
    .catch(err => {
      console.warn("NNUE failed, using classical eval", err);
      postMessage({ type: 'status', data: 'موتور (بدون NNUE) آماده است' });
      sfEngine.uci('uci');
    });
}).catch(err => {
  console.error("Stockfish init error:", err);
  postMessage({ type: 'error', data: 'خطا در اجرای هسته موتور: ' + err.message });
});

self.onmessage = function(e) {
  const { type, data } = e.data;
  if (sfEngine && type === 'uci_cmd') sfEngine.uci(data);
};