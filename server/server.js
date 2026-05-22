const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
app.use('/audio', express.static(path.join(__dirname, 'audio')));

const PORT = process.env.PORT || 3001;

const dictCache = new Map()
const CACHE_TTL = 30 * 60 * 1000
setInterval(() => {
  const now = Date.now()
  for (const [k, v] of dictCache) {
    if (now - v.ts > CACHE_TTL) dictCache.delete(k)
  }
}, 60000)
const API_KEY = process.env.DEEPSEEK_API_KEY;
const BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';

function buildHeaders() {
  return {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function callDeepSeek(messages, temperature = 0.7) {
  const res = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages,
      temperature,
    },
    { headers: buildHeaders() }
  );
  return res.data.choices[0].message.content;
}

app.post('/correct_translation', async (req, res) => {
  const { chinese, userAnswer } = req.body;
  if (!chinese || !userAnswer) {
    return res.status(400).json({ error: '缺少 chinese 或 userAnswer' });
  }

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是一名四级英语翻译考官。请从以下四个维度对用户翻译评分（百分制），并给出逐句修改建议和参考译文：\n1. vocabulary(词汇): 用词是否准确、贴切、丰富\n2. grammar(语法): 语法结构是否正确，句式是否多样\n3. semantics(语义): 是否准确传达原文意思，有无漏译\n4. expression(表达): 表达是否地道、自然，符合英语习惯\n\n返回 JSON: {"score": 85, "dimensions": {"vocabulary": 80, "grammar": 85, "semantics": 90, "expression": 82}, "suggestions": "逐句/逐点给出具体修改建议", "reference": "完整的参考译文"}' },
      { role: 'user', content: `中文：${chinese}\n用户翻译：${userAnswer}` },
    ], 0.3);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: 'API 调用失败', detail: err.message });
  }
});

app.post('/correct_writing', async (req, res) => {
  const { prompt, userAnswer } = req.body;
  if (!prompt || !userAnswer) {
    return res.status(400).json({ error: '缺少 prompt 或 userAnswer' });
  }

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是一名四级英语写作考官。请对用户作文进行评分（百分制），从内容、结构、语言三个维度评价，并给出修改建议。返回 JSON：{"score": 78, "dimensions": {"content": 80, "structure": 75, "language": 78}, "suggestions": "具体修改建议", "reference": "参考范文"}' },
      { role: 'user', content: `题目：${prompt}\n用户作文：${userAnswer}` },
    ], 0.3);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: 'API 调用失败', detail: err.message });
  }
});

app.post('/correct_paragraph', async (req, res) => {
  const { prompt, userAnswer } = req.body;
  if (!userAnswer) {
    return res.status(400).json({ error: '缺少 userAnswer' });
  }

  try {
    const result = await callDeepSeek([
      { role: 'system', content: '你是一名四级英语写作考官。请对用户续写的段落进行评分（百分制），从连贯性、内容、语言三个维度评价，并给出修改建议。返回 JSON：{"score": 75, "dimensions": {"coherence": 70, "content": 78, "language": 76}, "suggestions": "具体修改建议"}' },
      { role: 'user', content: `主题句：${prompt || '未提供'}\n用户续写：${userAnswer}` },
    ], 0.3);
    res.json(JSON.parse(result));
  } catch (err) {
    res.status(500).json({ error: 'API 调用失败', detail: err.message });
  }
});

app.post('/teach_sentence', async (req, res) => {
  const { pattern, userSentence } = req.body;
  if (!pattern) {
    return res.status(400).json({ error: '缺少 pattern' });
  }

  try {
    const messages = [
      { role: 'system', content: '你是一名四级英语写作教师。请用中文解释这个句型结构，给出 2-3 个例句，并指出常见错误。' },
      { role: 'user', content: `句型：${pattern}${userSentence ? `\n用户写的句子：${userSentence}` : ''}` },
    ];
    const result = await callDeepSeek(messages, 0.5);
    res.json({ explanation: result });
  } catch (err) {
    res.status(500).json({ error: 'API 调用失败', detail: err.message });
  }
});

app.get('/tts', async (req, res) => {
  const { text, lang } = req.query;
  if (!text) return res.status(400).json({ error: '缺少 text' });

  try {
    const langCode = lang === 'zh' ? 1 : 2;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${langCode}`;
    const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 10000 });
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch {
    try {
      const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang || 'en'}&client=tw-ob`;
      const response = await axios({ url: fallbackUrl, method: 'GET', responseType: 'stream', timeout: 10000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      res.set('Content-Type', 'audio/mpeg');
      res.set('Cache-Control', 'public, max-age=86400');
      response.data.pipe(res);
    } catch {
      res.status(500).json({ error: 'TTS 生成失败' });
    }
  }
});

app.get('/dictionary', async (req, res) => {
  const { word } = req.query;
  if (!word) return res.status(400).json({ error: '缺少 word' });

  const cached = dictCache.get(word.toLowerCase())
  if (cached) return res.json(cached.data)

  try {
    const [dictRes, transRes] = await Promise.allSettled([
      axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { timeout: 10000 }),
      axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|zh-CN`, { timeout: 5000 }),
    ]);

    if (dictRes.status === 'rejected') {
      return res.status(404).json({ error: '未找到该单词', word });
    }

    const data = dictRes.value.data;
    let chinese = '';
    if (transRes.status === 'fulfilled' && transRes.value.data?.responseData?.translatedText) {
      chinese = transRes.value.data.responseData.translatedText;
    }

    if (Array.isArray(data) && data[0]) {
      data[0].chinese = chinese;
    } else if (data && typeof data === 'object') {
      data.chinese = chinese;
    }

    dictCache.set(word.toLowerCase(), { data, ts: Date.now() })
    res.json(data);
  } catch (err) {
    if (err.response?.status === 404) {
      res.status(404).json({ error: '未找到该单词', word });
    } else {
      res.status(500).json({ error: '词典查询失败', detail: err.message });
    }
  }
});

app.get('/dictionary/ai', async (req, res) => {
  const { word } = req.query;
  if (!word) return res.status(400).json({ error: '缺少 word' });
  if (!API_KEY) return res.status(400).json({ error: 'API Key 未配置' });

  try {
    const chinese = await callDeepSeek([
      { role: 'system', content: '你是一个英汉词典助手。将用户输入的英文单词翻译成中文，给出2-3个最常见的中文释义，用逗号分隔。只返回中文翻译，不要多余内容。' },
      { role: 'user', content: word },
    ], 0.3);
    res.json({ chinese });
  } catch (err) {
    res.status(500).json({ error: 'AI 翻译失败', detail: err.message });
  }
});

app.post('/generate_sentence', async (req, res) => {
  const { word, topic, count = 1 } = req.body;
  if (!word && !topic) {
    return res.status(400).json({ error: '至少提供 word 或 topic' });
  }

  try {
    const prompt = word
      ? `请为四级英语单词"${word}"生成 ${count} 个适合大学生英语四级(CET-4)难度的语境句子。每个句子控制在15-25词，语法多样（包含定语从句、虚拟语气、倒装、强调句等四级常考句型），词汇以四级大纲词为主。返回 JSON 数组：[{"english":"...", "chinese":"...", "keywords":["...","..."], "topic":"科技/环保/教育/社会/生活/学习/励志/校园/就业/文化/品德"}]`
      : `请围绕话题"${topic}"生成 ${count} 个适合大学生英语四级(CET-4)难度的语境句子。每个句子控制在15-25词，语法多样（包含定语从句、虚拟语气、倒装、强调句等四级常考句型），词汇以四级大纲词为主。返回 JSON 数组：[{"english":"...", "chinese":"...", "keywords":["...","..."], "topic":"${topic}"}]`;

    const result = await callDeepSeek([
      { role: 'system', content: '你是大学英语四级(CET-4)教学专家。你生成的句子必须：1) 词汇在四级大纲范围内 2) 句长15-25词 3) 包含四级常见语法结构 4) 话题贴近大学生生活。只返回纯 JSON 数组，不要 markdown 格式。' },
      { role: 'user', content: prompt },
    ], 0.8);

    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    res.status(500).json({ error: '生成失败', detail: err.message });
  }
});

app.post('/parse_sentences', async (req, res) => {
  const { text } = req.body;
  if (!text || text.trim().length < 10) {
    return res.status(400).json({ error: '文本太短，至少10个字符' });
  }

  try {
    const prompt = `请将以下英文段落拆分为单个句子，为每句生成中文翻译、提取2-4个核心关键词（词组/搭配）、标注一个话题分类。适合四级难度。

英文原文：
${text.trim()}

返回纯 JSON 数组：[{"english":"句子1", "chinese":"中文翻译", "keywords":["kw1","kw2"], "topic":"科技/环保/教育/社会/生活/学习/励志/校园/就业/文化/品德"}]`;

    const result = await callDeepSeek([
      { role: 'system', content: '你是英语教学专家。将英文段落拆成句子，保持原句不变，只加翻译、关键词、话题。只返回纯 JSON 数组，不要 markdown。' },
      { role: 'user', content: prompt },
    ], 0.3);

    const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    res.json(JSON.parse(cleaned));
  } catch (err) {
    res.status(500).json({ error: '解析失败', detail: err.message });
  }
});

app.get('/health', (_, res) => {
  res.json({ status: 'ok', apiKey: !!API_KEY });
});

app.listen(PORT, () => {
  console.log(`CET-4 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`API Key 已${API_KEY ? '配置' : '未配置'}，请复制 server/.env.example 为 .env 并填入密钥`);
});
