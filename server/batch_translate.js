// 批量翻译缺失的常见词
// 用法: cd server && node batch_translate.js
// 使用 MyMemory 免费翻译 API（无需 Key），有 DeepSeek Key 时自动升级
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');

const DICT_FILE = path.join(__dirname, 'dict_base.json');
const dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf-8'));
const API_KEY = process.env.DEEPSEEK_API_KEY;

const skip = new Set(`
the a an is are am was were be been being have has had do does did done
i you he she it we they me him her us them my your his its our their
mine yours hers ours theirs myself yourself himself herself itself
this that these those what which who whom whose where when why how
all each every both neither either none nothing nobody somebody someone
anything anyone everything everyone something anywhere somewhere
here there inside outside between among against throughout despite
besides underneath beneath beyond within without toward until during
since before after above below across along around behind beside onto
upon into through about against up down in out on at by for of to
with from off over under
`.trim().split(/\s+/));

const WORD_FILE = path.join(__dirname, 'missing_words.txt');
const words = fs.existsSync(WORD_FILE)
  ? fs.readFileSync(WORD_FILE, 'utf-8').split('\n').map(w=>w.trim()).filter(w => w && !skip.has(w) && !dict[w])
  : [];

async function translateOne(word) {
  try {
    const r = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`, { timeout: 8000 });
    if (r.data?.responseData?.translatedText) return r.data.responseData.translatedText;
  } catch {}
  if (API_KEY) {
    try {
      const r = await axios.post(
        (process.env.DEEPSEEK_BASE_URL||'https://api.deepseek.com')+'/chat/completions',
        { model:'deepseek-chat', messages:[{role:'system',content:'将英文单词翻译成中文，只返回中文翻译'},{role:'user',content:word}], temperature:0.1 },
        { headers:{'Authorization':'Bearer '+API_KEY,'Content-Type':'application/json'}, timeout:15000 }
      );
      return r.data.choices[0].message.content.trim();
    } catch {}
  }
  return null;
}

async function run() {
  console.log('待翻译:', words.length, '词');
  let ok = 0, fail = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (dict[w]) continue;
    const cn = await translateOne(w);
    if (cn && cn.length < 50) {
      dict[w] = cn;
      ok++;
    } else {
      fail++;
    }
    if ((i+1) % 50 === 0 || i === words.length-1) {
      fs.writeFileSync(DICT_FILE, JSON.stringify(dict, null, 2), 'utf-8');
      console.log(`进度: ${i+1}/${words.length}, 成功: ${ok}, 失败: ${fail}, 总词条: ${Object.keys(dict).length}`);
    }
  }
  console.log('完成!');
}
if (words.length > 0) run();
else console.log('没有需要翻译的词');
