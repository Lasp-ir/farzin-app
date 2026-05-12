import Stockfish from './sf_18_smallnet.js';

let sfEngine;

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
      sfEngine.uci('uci');
    })
    .catch(err => {
      // اگه فایل پیدا نشد یا ارور داد، بازم موتور رو روشن کن تا UI گیر نکنه!
      console.warn("NNUE failed, using classical eval", err);
      postMessage({ type: 'status', data: 'موتور (بدون NNUE) آماده است' });
      sfEngine.uci('uci');
    });
});

self.onmessage = function(e) {
  const { type, data } = e.data;
  if (sfEngine && type === 'uci_cmd') sfEngine.uci(data);
};