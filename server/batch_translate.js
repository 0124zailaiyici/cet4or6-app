// 批量翻译缺失的常见词
// 用法: cd server && node batch_translate.js
// 依赖: .env 中配置了 DEEPSEEK_API_KEY
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const axios = require('axios');

const DICT_FILE = path.join(__dirname, 'dict_base.json');
const dict = JSON.parse(fs.readFileSync(DICT_FILE, 'utf-8'));
const API_KEY = process.env.DEEPSEEK_API_KEY;

// 需要跳过的不需要翻译的词
const skip = new Set(`
the a an is are am was were be been being have has had do does did done
get got getting gets make made making makes go went going gone come came
coming say said says tell told telling ask asked asks use used using uses
take took taken takes give gave given gives find found finds know knew
known wants wanted wanting see saw seen sees think thought thinks call
called calls try tried trying leave left leaving keep kept keeping let
lets put puts putting set sets setting run ran running runs write wrote
written writes pay paid paying payed need needs needed needing help
helps helped helping start started starts want wanted wanting turn
turned turns ask asked asks show showed shows shown seem seemed seems
help helps helped helping begin began begun begins starting started
starts bring brought brings hold held holds carry carried carries
speak spoke spoken speaks sit sat sitting sits stand stood stands
win won wins winning lose lost loses losing cut cuts cutting grow
grew grown grows draw drew drawn draws break broke broken breaks
whose when where what which who whom why how this that these those
its my your our their his her its our your their mine yours ours
himself herself itself yourself themselves each every all both
neither either none nothing nobody somebody someone anything anyone
everything everyone something somewhere anywhere everywhere nowhere
inside outside between among against throughout despite besides
underneath beneath beyond within without toward until during since
before after above below across along around behind beside onto
upon into through about against without toward upon up down in out
on at by for of to with from off over under
`.trim().split(/\s+/));

async function translateBatch(words) {
  const chunks = [];
  for (let i = 0; i < words.length; i += 50) chunks.push(words.slice(i, i+50));
  let total = 0;
  for (const chunk of chunks) {
    try {
      const res = await axios.post(
        process.env.DEEPSEEK_BASE_URL+'/chat/completions' || 'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一个英汉词典。将以下英文单词翻译成中文，每个单词给出简短中文释义。返回JSON对象，键是英文单词，值是中文翻译。只返回JSON，不要多余内容。\n'+chunk.join('\n') },
            { role: 'user', content: '翻译以上所有单词' }
          ],
          temperature: 0.1,
        },
        { headers: { 'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json' }, timeout: 60000 }
      );
      const text = res.data.choices[0].message.content;
      const result = JSON.parse(text.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim());
      for (const [k,v] of Object.entries(result)) {
        if (!dict[k.toLowerCase()] && !skip.has(k.toLowerCase()) && k.length > 2) {
          dict[k.toLowerCase()] = v;
          total++;
        }
      }
      console.log('批次完成, 新增:', total);
    } catch(e) {
      console.log('批次失败:', e.message);
    }
  }
  fs.writeFileSync(DICT_FILE, JSON.stringify(dict, null, 2), 'utf-8');
  console.log('完成! 总词条:', Object.keys(dict).length, '新增:', total);
}

const words = fs.readFileSync(path.join(__dirname, 'missing_words.txt'), 'utf-8')
  .split('\n').map(w=>w.trim()).filter(w => w && !skip.has(w) && !dict[w]);
console.log('待翻译:', words.length, '词');
if (API_KEY && words.length > 0) translateBatch(words);
else console.log(API_KEY ? '无缺词' : '请配置 DEEPSEEK_API_KEY');
