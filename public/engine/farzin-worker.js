// public/engine/farzin-worker.js
import Stockfish from './sf_18_smallnet.js';

let sfEngine;

// 🔥 اضافه کردن locateFile برای اینکه مرورگر گیج نشه و فایل wasm رو راحت پیدا کنه
Stockfish({
  locateFile: (path) => {
    if (path.endsWith('.wasm')) return '/engine/' + path;
    return path;
  }
}).then((engine) => {
  sfEngine = engine;
  
  sfEngine.listen = function(line) {
    postMessage({ type: 'engine_out', data: line });
  };

  postMessage({ type: 'status', data: 'در حال دانلود شبکه عصبی (NNUE)...' });
  
  fetch('/engine/nn-4ca89e4b3abf.nnue') // مسیر رو دقیق کردیم
    .then(response => {
      if (!response.ok) throw new Error('فایل NNUE پیدا نشد!');
      return response.arrayBuffer();
    })
    .then(buffer => {
      const nnueData = new Uint8Array(buffer);
      sfEngine.setNnueBuffer(nnueData);
      
      postMessage({ type: 'status', data: 'موتور قدرتمند فرزین آماده است!' });
      sfEngine.uci('uci');
    })
    .catch(err => {
      postMessage({ type: 'error', data: 'خطا در بارگذاری مغز موتور: ' + err.message });
    });
}).catch(err => {
  postMessage({ type: 'error', data: 'خطا در اجرای فایل WASM: ' + err.message });
});

self.onmessage = function(e) {
  const { type, data } = e.data;
  if (sfEngine && type === 'uci_cmd') {
    sfEngine.uci(data);
  }
};