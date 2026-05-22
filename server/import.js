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

  // 合并短行：选项续行合并到前一行，避免破碎
  const merged = []
  for (const p of paragraphs) {
    // 过滤页脚
    if (/\d{4}年\d+月/.test(p) && /第\d+页/.test(p)) continue
    if (/^[A-D]\)/.test(p) && merged.length > 0 && !/^\d+\./.test(p)) {
      merged[merged.length - 1] += '  ' + p
    } else {
      merged.push(p)
    }
  }

  const sentences = merged.map((text) => ({
    text: sanitize(text),
    start: 0,
    end: 0,
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

  const sections = text.split(/(?=Section\s+[ABC])/i)

  for (const sec of sections) {
    const secType = sec.match(/Section\s+([ABC])/i)?.[1] || 'C'
    const cleanLines = sec.split('\n').map(s => s.trim()).filter(s => s.length > 5)

    // === Section A: 选词填空 ===
    if (secType === 'A') {
      // 提取选项：处理两列合并的情况（如 "bidI) replace" → "bid", "I) replace"）
      let rawOptions = cleanLines.filter(l => /^[A-O]\)/.test(l) || /[A-O]\)/.test(l))
      let options = []
      for (const line of rawOptions) {
        const parts = line.split(/(?=[A-O]\))/)
        for (const p of parts) {
          const t = p.replace(/^[A-O]\)\s*/, '').trim()
          if (t.length > 1) options.push(t)
        }
      }
      // 去重（两列合并导致的重复）
      options = [...new Set(options)]

      const passageLines = cleanLines.filter(l => !/Section\s+A|Directions|Answer Sheet|^[A-O]\)|^\d+\./.test(l) && l.length > 10 && !/第\d+页|共\d+页/.test(l))
      let passage = sanitize(passageLines.join(' '))
      // 去掉题目描述，只保留文章正文
      const qi = passage.search(/questions?\s+\d+/i)
      if (qi > -1) {
        const after = passage.slice(qi)
        const m = after.match(/question[s]?\s+[\d\s]+to\s+[\d\s]+are\s+based\s+on\s+the\s+following\s+(?:passage|paragraph)/i)
        if (m) passage = after.slice(after.indexOf(m[0]) + m[0].length).trim()
      }
      const questions = cleanLines.filter(l => /^\d+\./.test(l)).map(s => sanitize(s))
      if (passage.length > 30 || options.length > 0) {
        passages.push({ id: Date.now() + passages.length, title: `选词填空 ${year}`, sectionType: 'A', passage: passage.slice(0, 8000), questions, options })
      }
      continue
    }

    // === Section B: 长篇阅读 ===
    if (secType === 'B') {
      const statements = cleanLines.filter(l => /^\d+\./.test(l)).map(s => sanitize(s.slice(0, 200)))
      // 收集完整段落：标签行 + 续行，直到下一个标签或陈述
      const articleParts = []
      let currentLabel = ''
      for (const line of cleanLines) {
        const m = line.match(/^([A-Z])[\)）]\s*/)
        if (m) {
          if (currentLabel) articleParts.push(currentLabel.trim())
          currentLabel = line
        } else if (currentLabel && !/^\d+\./.test(line) && line.length > 5) {
          // 续行：加到当前段落
          currentLabel += ' ' + line
        }
      }
      if (currentLabel) articleParts.push(currentLabel.trim())
      let article = sanitize(articleParts.join('\n'))
      // 清理页脚、乱码等无关内容
      article = article
        .replace(/\d{4}年\d+月.{0,40}第\d+页.{0,20}共\d+页\s*/g, '')
        .replace(/\d{4}年\d+月.{0,40}四级真题.{0,20}第\d+套.{0,10}/g, '')
        .replace(/cog.{0,15}ifive.{0,20}认知.{0,10}/g, '')
        .replace(/[）\)]\s*and\s+/g, '. ')
        .replace(/\s+/g, ' ')
        .replace(/\.\s*\./g, '.')
        .trim()
      article = article.slice(0, 8000)
      if (statements.length > 0 || article.length > 50) {
        passages.push({ id: Date.now() + passages.length, title: `长篇阅读匹配 ${year}`, sectionType: 'B', passage: article || '（含10条陈述，请匹配段落）', questions: statements, options: [], choices: [] })
      }
      continue
    }

    // === Section C: 仔细阅读 ===
    if (secType === 'C') {
      const subPassages = sec.split(/(?=Passage\s+(?:One|Two|Three)\b)/i)
      for (const sub of subPassages) {
        if (!sub.trim()) continue
        // 提取所有行（题目+选项）
        const allLines = sub.split('\n').map(s => s.trim()).filter(l => l.length > 3 && !/Answer Sheet|第\d+页|共\d+页|Part\s+III|Directions/.test(l))
        
        // 配对：题目 stem + 紧跟的 4 个选项
        const stems = []
        const choices = []
        let currentStem = ''
        let currentChoices = []
        for (const line of allLines) {
          if (/^\d+\./.test(line)) {
            if (currentStem) {
              stems.push(sanitize(currentStem))
              if (currentChoices.length === 1) {
                currentChoices = currentChoices[0].split(/(?=[A-D]\))/).map(s => sanitize(s.trim())).filter(s => s)
              }
              choices.push(currentChoices)
            }
            currentStem = line
            currentChoices = []
          } else if (/^[A-D]\)/.test(line) && currentStem) {
            currentChoices.push(sanitize(line))
          }
        }
        if (currentStem) {
          stems.push(sanitize(currentStem))
          // 若只提取到1个选项，尝试拆分合并行（PDF常见问题）
          if (currentChoices.length === 1) {
            currentChoices = currentChoices[0].split(/(?=[A-D]\))/).map(s => sanitize(s.trim())).filter(s => s)
          }
          choices.push(currentChoices)
        }

        // 提取正文
        const passIdx = sub.search(/questions?\s+[\d\s]+to\s+[\d\s]+are\s+based\s+on\s+the\s+following/i)
        let passageText = ''
        if (passIdx > -1) {
          const after = sub.slice(passIdx)
          const m = after.match(/questions?\s+[\d\s]+to\s+[\d\s]+are\s+based\s+on\s+the\s+following\s+(?:passage|paragraph)/i)
          if (m) {
            const start = after.indexOf(m[0]) + m[0].length
            passageText = after.slice(start)
              .split('\n').map(s => s.trim()).filter(l => l.length > 5 && !/^[A-D]\)|^\d+\./.test(l) && !/Answer Sheet|第\d+页|共\d+页/.test(l) && !/Part\s+III|reading comprehension|Directions/.test(l))
              .join(' ')
              .replace(/\^+/g, '')
          }
        }
        passageText = sanitize(passageText)
        if (passageText.length > 30) {
          const pNum = sub.match(/Passage\s+(One|Two|Three)/i)?.[1] || ''
          const pLabel = { One: '一', Two: '二', Three: '三' }[pNum] || ''
          passages.push({ id: Date.now() + passages.length, title: `仔细阅读 ${year} 第${pLabel}篇`, sectionType: 'C', passage: passageText.slice(0, 8000), questions: stems, options: [], choices })
        }
      }
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
    ? fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3')).map(f => ({ filename: f, name: path.basename(f, '.mp3'), url: `http://localhost:3001/audio/${f}` }))
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
    try {
      const year = f.replace(/[^0-9]/g, '').slice(0, 7) || '真题'
      console.log(`📝 解析: ${f}`)
      const { text } = await parsePDF(fp)
      const sections = detectSections(text)
      const counts = { writing: 0, listening: 0, reading: 0, translation: 0 }

      // --- 写作 ---
      if (sections.writing.length > 3) {
        let items = []
        items = parseWriting(sections.writing, year)
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
          const matchAudio = audioFiles.find(a => f.replace(/[^0-9]/g, '').includes(a.filename.replace(/\.mp3$/,'').replace(/[^0-9]/g, '')))
          if (matchAudio) items[0].audioUrl = `/audio/${matchAudio.filename}`
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
        let items = []
        try { items = parseReading(sections.reading, year) } catch (e) { console.log('  ⚠️ 阅读解析错误:', e.message) }
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
