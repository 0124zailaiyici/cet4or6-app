# 四级备考助手 🎯

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WeChat MiniProgram](https://img.shields.io/badge/Platform-WeChat_MiniProgram-07C160)](https://developers.weixin.qq.com/miniprogram/dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org)
[![Railway](https://img.shields.io/badge/Deployed_on-Railway-0B0D0E?logo=railway)](https://railway.app)

专为大学生设计的英语四级（CET-4）备考微信小程序。包含 **2015-2025 年历年真题**、**AI 作文批改**、**智能词典**、**逐句精听**等完整备考功能。

---

## 功能

| 模块 | 说明 |
|------|------|
| 🎧 听力训练 | 33 套真题听力，逐句播放 + 原文对照 |
| 📖 阅读理解 | 148 篇真题阅读（选词填空/段落匹配/仔细阅读） |
| ✍️ 翻译练习 | 70 篇真题翻译，官方参考译文对照 |
| 📝 写作训练 | 67 道真题写作 + 句型急救包（15 个四级核心句型） |
| 📚 词汇学习 | 四级大纲词汇，按词频分类学习 |
| 🧪 真题模拟 | 完整答题流程，计时交卷，自动评分 |
| 🤖 AI 作文批改 | 接入 DeepSeek，从内容/结构/语言三维度评分 |
| 🔍 智能词典 | FreeDictionary + DeepSeek AI 释义 |
| 🌙 深色模式 | 全页面暗色主题 |
| 📊 学习统计 | 每日打卡、学习记录可视化 |
| ⭐ 收藏夹 | 单词/题目收藏，集中复习 |
| 🔔 学习提醒 | 自定义每日学习提醒 |
| 📖 中英写作助手 | 中文构思 → 逐句翻译 → 组装润色 |

## 截图

<!-- TODO: 替换为真实微信开发者工具截图 -->

| | | |
|:---:|:---:|:---:|
| ![首页](docs/screenshots/home.png) | ![听力](docs/screenshots/listening.png) | ![阅读](docs/screenshots/reading.png) |
| **首页** | **听力训练** | **阅读理解** |
| ![写作](docs/screenshots/writing.png) | ![词汇](docs/screenshots/vocab.png) | ![真题模拟](docs/screenshots/exam.png) |
| **写作训练** | **词汇学习** | **真题模拟** |

## 技术栈

| 层级 | 技术 |
|------|------|
| 客户端 | 微信小程序 · TypeScript · WXSS |
| 服务端 | Node.js · Express |
| AI 服务 | DeepSeek API / Ollama（本地模型）|
| 部署平台 | Railway（nixpacks 自动构建）|
| 词典 API | FreeDictionary API · MyMemory Translation API |
| TTS | 有道词典语音 / Google TTS 回退 |

## 项目结构

```
cet4or6-app/
├── miniprogram/              # 微信小程序客户端（TypeScript）
│   ├── app.ts                # 应用入口 + 全局数据
│   ├── app.json              # 页面注册（24 页面）
│   ├── app.wxss              # 全局样式
│   ├── pages/                # 24 个页面
│   │   ├── index/            # 首页
│   │   ├── listening/        # 听力训练
│   │   ├── reading/          # 阅读理解
│   │   ├── writing/          # 写作训练（含 AI 批改）
│   │   ├── translation/      # 翻译练习
│   │   ├── vocab/            # 词汇学习
│   │   ├── exam/             # 真题模拟（含子页面）
│   │   ├── dictionary/       # 词典
│   │   ├── sentences/        # 每日一句
│   │   ├── statistics/       # 学习统计
│   │   ├── favorites/        # 收藏夹
│   │   ├── profile/          # 个人中心
│   │   ├── settings/         # 设置
│   │   ├── reminder/         # 学习提醒
│   │   ├── feedback/         # 反馈
│   │   └── guide/            # 新手引导
│   ├── data/                 # 真题数据（TS/JSON）
│   │   ├── listening.ts      # 33 套听力数据
│   │   ├── readings.ts       # 148 篇阅读数据
│   │   ├── writings.ts       # 67 道写作题
│   │   ├── translations.ts   # 70 篇翻译题
│   │   ├── sentences.ts      # 每日例句
│   │   ├── sentence_patterns.ts # 15 个句型库
│   │   └── synonyms.ts       # 近义词库
│   ├── utils/                # 工具函数
│   │   ├── api.ts            # 后端 API 封装
│   │   └── theme.ts          # 深色模式
│   └── icons/                # TabBar 图标
├── server/                   # Node.js 服务端
│   ├── server.js             # Express 主服务（AI/TTS/词典）
│   ├── audio/                # 45 个听力 MP3
│   ├── .env.example          # 环境变量模板
│   ├── dict_base.json        # 基础词典缓存
│   ├── dict_cache.json       # AI 词典缓存（自动生成）
│   └── package.json
├── nixpacks.toml             # Railway 部署配置
├── tsconfig.json             # TypeScript 配置
├── project.config.json       # 微信开发者工具配置
└── package.json              # 根 package（start/build 脚本）
```

## 快速开始

### 客户端（微信小程序）

1. 打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 项目目录 → 导入 → 选择 `sutdy_english/` 根目录
3. AppID 使用**测试号**（无需注册）
4. 编译运行

> 注意：开发者工具需设置代理为「不使用系统代理」，并切换基础库至 3.16（trial）以避免已知 bug。

### 服务端（可选 — AI 功能需要）

```bash
cd server
cp .env.example .env
# 编辑 .env，填入 DeepSeek API Key

npm install
npm start
```

服务端默认运行在 `http://localhost:3001`。

### 连接服务端

默认已连接线上 Railway 地址。如需切换本地开发：

```js
// 在开发者工具控制台执行
wx.setStorageSync('api_base', 'http://localhost:3001')
```

## 部署

项目部署在 [Railway](https://railway.app)，使用 **nixpacks** 自动构建。

**线上地址：** [https://cet4or6-app-production.up.railway.app](https://cet4or6-app-production.up.railway.app)

**健康检查：** [https://cet4or6-app-production.up.railway.app/health](https://cet4or6-app-production.up.railway.app/health)

部署配置（`nixpacks.toml`）：

```toml
[phases.setup]
nixPkgs = ["nodejs", "ffmpeg"]

[phases.install]
cmds = ["cd server && npm install"]

[start]
cmd = "cd server && node server.js"
```

> Railway 免费实例在无请求后会休眠（约 30 秒冷启动），应用已内置自动预热和重试机制。

## AI 配置

AI 功能可选两种后端，配置在 `server/.env`：

| 方案 | 配置 | 说明 |
|------|------|------|
| **DeepSeek API**（推荐） | `DEEPSEEK_API_KEY=sk-xxx` | 远程 API，按量计费（¥ 极其便宜）|
| **Ollama 本地模型** | `OLLAMA_URL=http://localhost:11434` | 完全免费，需要本地 GPU |

优先级：Ollama > DeepSeek。两种都不配置时，应用自动降级为本地规则评分。

## 数据来源

- 真题听力/阅读/翻译/写作数据整理自 **2015–2025 年 CET-4 真题**
- 听力音频来源：历年 CET-4 真题听力（45 个 MP3）
- 词典数据：FreeDictionary API + MyMemory Translation API + AI 补充释义

## 项目状态

| 里程碑 | 状态 |
|--------|------|
| 全部 24 页面开发完成 | ✅ |
| AI 作文批改 | ✅ |
| 深色模式全页面覆盖 | ✅ |
| 2015-2025 真题数据入库 | ✅ |
| Railway 线上部署 | ✅ |
| README | ✅ |

## License

MIT
