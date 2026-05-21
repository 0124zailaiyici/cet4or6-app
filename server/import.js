/**
 * 四级真题导入工具
 * 
 * 用法：
 *   1. 将 MP3 文件放入 server/audio/ 目录
 *   2. 将 PDF 真题放入 server/pdfs/ 目录
 *   3. 运行：node import.js
 *   4. 脚本会自动解析 PDF 并更新 data/*.ts 文件
 * 
 * PDF 命名规范：
 *   - 听力：listening_*.pdf     → 更新 data/listening.ts
 *   - 翻译：translation_*.pdf   → 更新 data/translations.ts
 *   - 写作：writing_*.pdf       → 更新 data/writings.ts
 */

const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

const DATA_DIR = path.join(__dirname, '..', 'miniprogram', 'data')
const AUDIO_DIR = path.join(__dirname, 'audio')
const PDF_DIR = path.join(__dirname, 'pdfs')

// ============ 工具函数 ============

function readJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch { return [] }
}

function writeTS(filePath, varName, data) {
  const content = `const ${varName} = ${JSON.stringify(data, null, 2)}
export default ${varName}
`
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ 已写入 ${path.basename(filePath)} (${data.length} 条)`)
}

function sanitize(str) {
  return str.replace(/\s+/g, ' ').trim()
}

// ============ MP3 扫描 ============

function scanAudio() {
  if (!fs.existsSync(AUDIO_DIR)) return []
  return fs.readdirSync(AUDIO_DIR)
    .filter(f => f.endsWith('.mp3'))
    .map(f => ({
      filename: f,
      name: path.basename(f, '.mp3'),
      url: `http://localhost:3000/audio/${f}`
    }))
}

// ============ PDF 解析 ============

async function parseListeningPDF(filePath) {
  const buf = fs.readFileSync(filePath)
  const data = await pdf(buf)
  const lines = data.text.split('\n').map(s => s.trim()).filter(Boolean)

  // 尝试按段落拆分句子
  const sentences = lines.slice(0, Math.min(lines.length, 20)).map((text, i) => ({
    text,
    start: i * 3,
    end: i * 3 + 2.5,
  }))

  return {
    id: Date.now(),
    title: path.basename(filePath, '.pdf').replace(/^listening[_-]?/i, ''),
    audioUrl: '',
    sentences,
    fullText: sanitize(lines.slice(0, Math.min(lines.length, 20)).join(' ')),
  }
}

async function parseTranslationPDF(filePath) {
  const buf = fs.readFileSync(filePath)
  const data = await pdf(buf)
  const lines = data.text.split('\n').map(s => s.trim()).filter(Boolean)

  const items = []
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 5 && /[\u4e00-\u9fff]/.test(lines[i])) {
      items.push({
        id: Date.now() + items.length,
        chinese: lines[i],
        reference: lines[i + 1] && /[a-zA-Z]/.test(lines[i + 1]) ? lines[i + 1] : '',
        source: 'PDF导入',
      })
    }
  }
  return items
}

async function parseWritingPDF(filePath) {
  const buf = fs.readFileSync(filePath)
  const data = await pdf(buf)
  const lines = data.text.split('\n').map(s => s.trim()).filter(Boolean)

  const title = path.basename(filePath, '.pdf').replace(/^writing[_-]?/i, '') || '写作题目'
  return [{
    id: Date.now(),
    title,
    prompt: sanitize(lines.slice(0, Math.min(lines.length, 15)).join(' ')),
    reference: sanitize(lines.slice(15).join(' ')) || '',
  }]
}

// ============ 主流程 ============

async function main() {
  console.log('\n📦 四级真题导入工具\n')
  console.log('='.repeat(50))

  // 1. 扫描音频
  const audioFiles = scanAudio()
  console.log(`\n🔊 音频文件: ${audioFiles.length} 个`)
  audioFiles.forEach(a => console.log(`  - ${a.filename}`))

  // 2. 扫描并解析 PDF
  if (!fs.existsSync(PDF_DIR)) {
    console.log('\n❌ 请先创建 server/pdfs/ 目录并放入 PDF 文件')
    return
  }

  const pdfFiles = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'))
  console.log(`\n📄 PDF 文件: ${pdfFiles.length} 个`)
  pdfFiles.forEach(f => console.log(`  - ${f}`))

  // 3. 按类型处理
  let listCount = 0, transCount = 0, writeCount = 0

  for (const f of pdfFiles) {
    const fp = path.join(PDF_DIR, f)
    const fname = f.toLowerCase()
    console.log(`\n📝 处理: ${f}`)

    try {
      if (fname.startsWith('listening')) {
        const passage = await parseListeningPDF(fp)
        const existing = readJSON(path.join(DATA_DIR, 'listening.json'))
        existing.push(passage)

        // 寻找匹配的音频文件
        const matchAudio = audioFiles.find(a => fname.includes(a.name.toLowerCase()) || a.name.toLowerCase().includes(fname.replace(/listening[_-]?/i, '')))
        if (matchAudio) passage.audioUrl = matchAudio.url

        writeTS(path.join(DATA_DIR, 'listening.ts'), 'listeningData', existing)
        listCount++
      }
      else if (fname.startsWith('translation')) {
        const items = await parseTranslationPDF(fp)
        const existing = readJSON(path.join(DATA_DIR, 'translations.json'))
        existing.push(...items)
        writeTS(path.join(DATA_DIR, 'translations.ts'), 'translationsData', existing)
        transCount += items.length
      }
      else if (fname.startsWith('writing')) {
        const items = await parseWritingPDF(fp)
        const existing = readJSON(path.join(DATA_DIR, 'writings.json'))
        existing.push(...items)
        writeTS(path.join(DATA_DIR, 'writings.ts'), 'writingsData', existing)
        writeCount += items.length
      }
      else {
        console.log(`  ⚠️ 跳过: 文件名不以 listening/translation/writing 开头`)
      }
    } catch (err) {
      console.log(`  ❌ 解析失败: ${err.message}`)
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`✅ 导入完成:`)
  if (listCount) console.log(`  - 听力: ${listCount} 篇`)
  if (transCount) console.log(`  - 翻译: ${transCount} 条`)
  if (writeCount) console.log(`  - 写作: ${writeCount} 条`)
  console.log(`\n💡 提示: 重新编译小程序后生效`)
}

main().catch(console.error)
