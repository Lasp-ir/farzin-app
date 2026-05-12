import Stockfish from './sf_18_smallnet.js';

let sfEngine;

Stockfish({
  locateFile: (path) => {
    // 🔥 ترفند حیاتی: تمام فایل‌های درخواستی موتور (چه wasm چه js های فرعی برای چندنخی)
    // باید اجباراً از پوشه ریشه /engine/ لود بشن تا تو مسیردهی‌های React گم نشن!
    return '/engine/' + path;
  }
}).then((engine) => {
  sfEngine = engine;
  
  sfEngine.listen = function(line) {
    postMessage({ type: 'engine_out', data: line });
  };

  postMessage({ type: 'status', data: 'دانلود شبکه عصبی...' });
  
  fetch('/engine/nn-4ca89e4b3abf.nnue')
    .then(response => {
      if (!response.ok) throw new Error('NNUE not found');
      return response.arrayBuffer();
    })
    .then(buffer => {
      const nnueData = new Uint8Array(buffer);
      sfEngine.setNnueBuffer(nnueData);
      postMessage({ type: 'status', data: 'موتور آماده است' });
      
      // روشن کردن موتور بعد از تزریق هوش مصنوعی
      sfEngine.uci('uci');
    })
    .catch(err => {
      console.warn("NNUE failed, using classical eval", err);
      postMessage({ type: 'status', data: 'موتور (بدون NNUE) آماده است' });
      sfEngine.uci('uci');
    });
}).catch(err => {
  postMessage({ type: 'error', data: 'خطا در بارگذاری هسته WASM: ' + err.message });
});

self.onmessage = function(e) {
  const { type, data } = e.data;
  if (sfEngine && type === 'uci_cmd') sfEngine.uci(data);
};