const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
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
      { role: 'system', content: '你是一名四级英语翻译考官。请对用户翻译进行评分（百分制），并给出修改建议和参考译文。返回 JSON：{"score": 85, "suggestions": "修改建议", "reference": "参考译文"}' },
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

app.get('/health', (_, res) => {
  res.json({ status: 'ok', apiKey: !!API_KEY });
});

app.listen(PORT, () => {
  console.log(`CET-4 代理服务器运行在 http://localhost:${PORT}`);
  console.log(`API Key 已${API_KEY ? '配置' : '未配置'}，请复制 server/.env.example 为 .env 并填入密钥`);
});
