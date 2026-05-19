const express = require('express');
const router = express.Router();
const http = require('http');

const MAIA_HOST = process.env.MAIA_HOST || 'localhost';
const MAIA_PORT = process.env.MAIA_PORT || 5001;

function proxyPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      hostname: MAIA_HOST, port: MAIA_PORT, path, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({ error: buf }); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function proxyGet(path) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: MAIA_HOST, port: MAIA_PORT, path, method: 'GET' };
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve({ error: buf }); } });
    });
    req.on('error', reject);
    req.end();
  });
}

// لیست مدل‌های آموزش‌دیده
router.get('/models', async (req, res) => {
  try {
    const data = await proxyGet('/models');
    res.json(data);
  } catch {
    res.json({ models: [], error: 'Maia Python server not running (port ' + MAIA_PORT + ')' });
  }
});

// دریافت حرکت از مدل مایا برای یک FEN
router.post('/move', async (req, res) => {
  try {
    const data = await proxyPost('/move', req.body);
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Maia server unavailable: ' + err.message });
  }
});

// شروع آموزش مدل جدید
router.post('/train', async (req, res) => {
  try {
    const data = await proxyPost('/train', req.body);
    res.json(data);
  } catch (err) {
    res.status(503).json({ error: 'Maia server unavailable: ' + err.message });
  }
});

// وضعیت job آموزش
router.get('/train/status/:jobId', async (req, res) => {
  try {
    const data = await proxyGet(`/train/status/${req.params.jobId}`);
    res.json(data);
  } catch {
    res.status(503).json({ error: 'Maia server unavailable' });
  }
});

module.exports = router;
