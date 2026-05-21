/**
 * 四级真题导入工具 v2
 *
 * 支持整套真题 PDF（含全部题型）
 *
 * 用法：
 *   1. 将 MP3 放入 server/audio/（文件名含年份，如 2024_06.mp3）
 *   2. 将 PDF 真题放入 server/pdfs/
 *   3. 运行：node import.js
 *   4. 自动识别各部分并更新 data/*.ts
 *
 * PDF 结构识别（按 CET-4 标准卷）：
 *   - Part I / Writing → data/writings.ts
 *   - Part II / Listening → data/listening.ts
 *   - Part III / Reading → data/readings.ts
 *   - Part IV / Translation → data/translations.ts
 */

const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data')
const AUDIO_DIR = path.join(__dirname, 'audio')
const PDF_DIR = path.join(__dirname, 'pdfs')

// ============ 工具函数 ============

function writeTS(filePath, varName, data) {
  const content = `const ${varName} = ${JSON.stringify(data, null, 2)}\nexport default ${varName}\n`
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ ${path.basename(filePath)} (${data.length} 条)`)
}

function sanitize(str) { return str.replace(/\s+/g, ' ').trim() }

// ============ 段落拆分 ============

function splitParagraphs(text) {
  return text.split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 3)
}

// ============ PDF 解析 ============

async function parsePDF(filePath) {
  const buf = fs.readFileSync(filePath)
  const data = await pdf(buf)
  return { text: data.text, pages: data.numpages }
}

// ============ 部分检测 ============

function detectSections(text) {
  const parts = text.split(/\n(?=Part\s+[IVXL]+)/i)
  const sections = { writing: [], listening: [], reading: [], translation: [] }

  for (const part of parts) {
    const head = part.slice(0, 200)
    if (/^Part\s+I\b|^写作/i.test(head)) {
      sections.writing = part.split('\n').map(s => s.trim()).filter(s => s.length > 2 && !/part\s*I|writing|写作|作文|directions/i.test(s))
    } else if (/^Part\s+II\b|listening comprehension|听力理解/i.test(head)) {
      sections.listening = part.split('\n').map(s => s.trim()).filter(s => s.length > 2 && !/part\s*II|listening comprehension|听力|section\s*[abc]|directions|questions\s*\d+/i.test(s))
    } else if (/^Part\s+III\b|reading comprehension|阅读理解/i.test(head)) {
      sections.reading = part.split('\n').map(s => s.trim()).filter(s => s.length > 2 && !/part\s*III|reading comprehension|阅读|directions|answer sheet/i.test(s))
    } else if (/^Part\s+IV\b|translation|翻译/i.test(head)) {
      sections.translation = part.split('\n').map(s => s.trim()).filter(s => s.length > 2 && !/part\s*IV|translation|翻译|directions|answer sheet/i.test(s))
    }
  }

  return sections
}

// ============ 写作解析 ============

function parseWriting(lines, year) {
  if (lines.length < 3) return []
  const title = lines[0].replace(/part\s*i/i, '').replace(/写作/i, '').trim() || `CET-4 写作 ${year}`
  return [{
    id: Date.now(),
    title: title.slice(0, 80),
    prompt: sanitize(lines.join(' ')).slice(0, 500),
    reference: '',
  }]
}

// ============ 听力解析 ============

function parseListening(lines, year) {
  const paragraphs = splitParagraphs(lines.join('\n'))
  if (paragraphs.length < 3) return []

  const sentences = paragraphs.slice(0, Math.min(paragraphs.length, 15)).map((text, i) => ({
    text: text.slice(0, 200),
    start: i * 3,
    end: i * 3 + 2.5,
  }))

  return [{
    id: Date.now(),
    title: `CET-4 听力 ${year}`,
    audioUrl: '',
    sentences,
    fullText: sanitize(sentences.map(s => s.text).join(' ')),
  }]
}

// ============ 阅读解析 ============

function parseReading(lines, year) {
  const text = lines.join('\n')
  const passages = []

  // CET-4 阅读结构：
  // Section A: 选词填空（一篇短文 + 15个选项）
  // Section B: 长篇阅读（10个陈述 + 段落匹配）
  // Section C: 仔细阅读（2篇短文 + 各5道选择题）

  // 按 Sections 分割
  const sections = text.split(/(?=Section\s+[ABC])/i)

  for (const sec of sections) {
    const secType = sec.match(/Section\s+([ABC])/i)?.[1] || 'C'
    const lines = sec.split('\n').map(s => s.trim()).filter(s => s.length > 5)

    // 找 passage 正文：跳过 Directions 和页眉页脚
    const clean = lines.filter(l => !/Part\s+III|reading comprehension|Directions|Answer Sheet|^\d{4}年/.test(l))
    const passageText = sanitize(
      clean
        .filter(l => !/^[A-E]\)|^\d+\./.test(l) && l.length > 10 && !/第\d+页|共\d+页/.test(l))
        .join(' ')
    )

    // 提取题目
    const questions = lines
      .filter(l => /^[A-E]\)/.test(l) || /^\d+\./.test(l))
      .map(s => sanitize(s.slice(0, 200)))

    // 提取选项（Section A）
    const options = secType === 'A'
      ? lines.filter(l => /^[A-O]\)/.test(l)).map(s => sanitize(s.replace(/^[A-O]\)\s*/, '')))
      : []

    // 对于 Section A 和 C，尝试找到 "Questions X to Y are based on" 之后的文本作为 passage
    let finalPassage = passageText
    if (secType !== 'B') {
      const qi = passageText.search(/questions?\s+\d+/i)
      if (qi > -1) {
        const after = passageText.slice(qi)
        // 找到题目编号之前的描述之后，取后面的实际文章
        const match = after.match(/question[s]?\s+[\d\s]+to\s+[\d\s]+are\s+based\s+on\s+the\s+following\s+(?:passage|paragraph)/i)
        if (match) {
          const startIdx = after.indexOf(match[0]) + match[0].length
          finalPassage = after.slice(startIdx).trim()
        }
      }
    }

    if (finalPassage.length > 50 || (secType === 'A' && options.length > 0)) {
      passages.push({
        id: Date.now() + passages.length,
        title: `Section ${secType} - ${secType === 'A' ? '选词填空' : secType === 'B' ? '长篇阅读' : '仔细阅读'} ${year}`,
        sectionType: secType,
        passage: finalPassage.slice(0, 2000),
        questions,
        options,
      })
    }
  }

  return passages
}

// ============ 翻译解析 ============

function parseTranslation(lines, year) {
  // 过滤掉页眉页脚和题目行
  const filtered = lines.filter(s => {
    if (/^\d+月|\d+年|第\d+套|第\d+页|共\d+页|Directions|Part\s+IV|Translation|^[A-E]\)|^\d+\./.test(s)) return false
    return s.length > 6 && /[\u4e00-\u9fff]{4,}/.test(s)
  })

  // 合并连续的中文段落为一篇完整的翻译
  const merged = sanitize(filtered.join(''))
    .replace(/\s+/g, '')
    .replace(/([。！？])/g, '$1\n')
    .split('\n')
    .filter(s => s.trim().length > 10)

  if (merged.length > 0) {
    return [{
      id: Date.now(),
      chinese: sanitize(filtered.join(' ')).slice(0, 500),
      reference: '',
      source: `CET-4 ${year}`,
    }]
  }
  return []
}

// ============ 主流程 ============

async function main() {
  console.log('\n📦 四级真题导入工具 v2\n')
  console.log('='.repeat(50))

  // 扫描音频
  const audioFiles = fs.existsSync(AUDIO_DIR)
    ? fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'))
    : []
  console.log(`🔊 音频: ${audioFiles.length} 个`)

  // 扫描 PDF
  if (!fs.existsSync(PDF_DIR)) {
    console.log('❌ 请先创建 server/pdfs/ 目录')
    return
  }
  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'))
  if (pdfFiles.length === 0) {
    console.log('❌ server/pdfs/ 目录没有 PDF 文件')
    return
  }
  console.log(`📄 PDF: ${pdfFiles.length} 个\n`)

  let total = { writing: 0, listening: 0, reading: 0, translation: 0 }

  for (const f of pdfFiles) {
    const fp = path.join(PDF_DIR, f)
    const year = f.replace(/[^0-9]/g, '').slice(0, 7) || '真题'

    console.log(`📝 解析: ${f}`)

    try {
      const { text } = await parsePDF(fp)
      const sections = detectSections(text)
      const counts = { writing: 0, listening: 0, reading: 0, translation: 0 }

      // --- 写作 ---
      if (sections.writing.length > 3) {
        const items = parseWriting(sections.writing, year)
        if (items.length) {
          const existing = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'writings.json'), 'utf-8').match(/\[[\s\S]*\]/)?.[0] || '[]')
          existing.push(...items)
          writeTS(path.join(DATA_DIR, 'writings.ts'), 'writingsData', existing)
          counts.writing = items.length
        }
      }

      // --- 听力 ---
      if (sections.listening.length > 5) {
        const items = parseListening(sections.listening, year)
        if (items.length) {
          const matchAudio = audioFiles.find(a => f.replace(/[^0-9]/g, '').includes(a.filename.replace(/[^0-9]/g, '')))
          if (matchAudio) items[0].audioUrl = `http://localhost:3001/audio/${matchAudio.filename}`
          items[0].title += '（PDF导入，仅题目，使用TTS听正文需手动编辑）'
          const existing = fs.existsSync(path.join(DATA_DIR, 'listening.json'))
            ? JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'listening.json'), 'utf-8'))
            : []
          existing.push(...items)
          writeTS(path.join(DATA_DIR, 'listening.ts'), 'listeningData', existing)
          counts.listening = items.length
        }
      }

      // --- 阅读 ---
      if (sections.reading.length > 5) {
        const items = parseReading(sections.reading, year)
        if (items.length) {
          let existing = []
          if (fs.existsSync(path.join(DATA_DIR, 'readings.json'))) {
            existing = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'readings.json'), 'utf-8'))
          }
          existing.push(...items)
          writeTS(path.join(DATA_DIR, 'readings.ts'), 'readingsData', existing)
          counts.reading = items.length
        }
      }

      // --- 翻译 ---
      if (sections.translation.length > 2) {
        const items = parseTranslation(sections.translation, year)
        if (items.length) {
          const existing = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'translations.json'), 'utf-8').match(/\[[\s\S]*\]/)?.[0] || '[]')
          existing.push(...items)
          writeTS(path.join(DATA_DIR, 'translations.ts'), 'translationsData', existing)
          counts.translation = items.length
        }
      }

      console.log(`   → 写作:${counts.writing} 听力:${counts.listening} 阅读:${counts.reading} 翻译:${counts.translation}`)
      total.writing += counts.writing
      total.listening += counts.listening
      total.reading += counts.reading
      total.translation += counts.translation

    } catch (err) {
      console.log(`  ❌ 解析失败: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ 导入完成')
  console.log(`   写作: ${total.writing} 篇`)
  console.log(`   听力: ${total.listening} 篇`)
  console.log(`   阅读: ${total.reading} 篇`)
  console.log(`   翻译: ${total.translation} 条`)
  console.log('\n💡 提示: 新建页面需要添加到 app.json 并重新编译')
}

main().catch(console.error)
