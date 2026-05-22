/**
 * 批量生成四级语境句子 → 输出到 miniprogram/data/sentences.ts
 * 使用方式: node server/generate_sentences.js
 */
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

if (!API_KEY) {
  console.error('错误: 请在 server/.env 中配置 DEEPSEEK_API_KEY');
  process.exit(1);
}

async function callDeepSeek(messages, temperature = 0.7) {
  const res = await axios.post(
    `${BASE_URL}/chat/completions`,
    { model: 'deepseek-chat', messages, temperature },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data.choices[0].message.content;
}

const TOPICS = ['科技', '环保', '教育', '社会', '生活', '学习', '励志', '校园', '就业', '文化', '品德'];

async function generateBatch(topic, count) {
  console.log(`[${topic}] 正在生成 ${count} 个句子...`);
  const prompt = `请围绕话题"${topic}"生成 ${count} 个适合大学生英语四级(CET-4)难度的语境句子。要求：
1. 句子长度 15-25 词
2. 语法结构多样（定语从句、虚拟语气、倒装、强调句、名词性从句等四级常考句型各覆盖一点）
3. 词汇控制在四级大纲范围内
4. 话题贴近中国大学生生活
5. 每个句子的 keywords 提取其中 2-4 个核心词组/搭配

返回纯 JSON 数组（不要 markdown 代码块标记）：
[{"english":"...", "chinese":"...", "keywords":["kw1","kw2"], "topic":"${topic}"}]`;

  const result = await callDeepSeek([
    { role: 'system', content: '你是大学英语四级(CET-4)教学专家。只返回纯 JSON 数组，不要任何解释文字，不要 markdown 代码块。' },
    { role: 'user', content: prompt },
  ], 0.85);

  const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

async function main() {
  const all = [];
  let id = 1;

  for (const topic of TOPICS) {
    const count = topic === '教育' || topic === '社会' || topic === '科技' ? 8 : 6;
    const sentences = await generateBatch(topic, count);
    for (const s of sentences) {
      all.push({ id: id++, ...s });
    }
    await new Promise(r => setTimeout(r, 500));
  }

  const content = `const sentencesData = ${JSON.stringify(all, null, 2).replace(/"([^"]+)":/g, '$1:')}
export default sentencesData
`;

  const outPath = path.join(__dirname, '..', 'miniprogram', 'data', 'sentences.ts');
  fs.writeFileSync(outPath, content, 'utf-8');
  console.log(`\n${all.length} 个句子已写入: ${outPath}`);
}

main().catch(err => {
  console.error('生成失败:', err.message);
  process.exit(1);
});
