// 预翻译所有词典单词（并发版）
// 用法：先启动 cd server && node server.js，再 node pretranslate.js
const { readFileSync } = require('fs');
const { join } = require('path');
const http = require('http');

const dict = JSON.parse(readFileSync(join(__dirname, 'dict_base.json'), 'utf-8'));
const words = Object.keys(dict).filter(w => w.length > 2 && !/^\d+$/.test(w));
const CONCURRENCY = 10;
const HOST = 'localhost';
const PORT = 3001;

let ok = 0, fail = 0, done = 0;

function fetch(word) {
  return new Promise(resolve => {
    const req = http.get(`http://${HOST}:${PORT}/dictionary?word=${encodeURIComponent(word)}`, { timeout: 20000 }, res => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { ok++; done++; resolve() });
    });
    req.on('error', () => { fail++; done++; resolve() });
    req.on('timeout', () => { req.destroy(); fail++; done++; resolve() });
  });
}

async function run() {
  console.log(`词数: ${words.length}, 并发: ${CONCURRENCY}`);
  const ti = setInterval(() => console.log(`${done}/${words.length} ok:${ok} fail:${fail}`), 5000);
  
  for (let i = 0; i < words.length; i += CONCURRENCY) {
    const batch = words.slice(i, i + CONCURRENCY).map(fetch);
    await Promise.all(batch);
    await new Promise(r => setTimeout(r, 100));
  }
  clearInterval(ti);
  console.log(`完成! ok:${ok} fail:${fail}`);
}
run();
