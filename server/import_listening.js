const pdfParse = require('pdf-parse')
const fs = require('fs')
const path = require('path')

const PDF_DIR = process.argv[2] || path.join(__dirname, 'pdfs')
const AUDIO_DIR = process.argv[3] || path.join(__dirname, 'audio')
const OUT_TS = path.join(__dirname, '..', 'miniprogram', 'data', 'listening_generated.ts')
const OUT_TC = path.join(__dirname, 'audio', 'timecodes.json')

function clean(t) { return t.replace(/\s+/g, ' ').replace(/[""]/g, '"').replace(/['']/g, "'").trim() }

function matchAudio(name) {
  if (!fs.existsSync(AUDIO_DIR)) return ''
  const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith('.mp3'))
  const m = name.match(/(\d{4}).*?(\d+)套/)
  for (const f of files) {
    if (m && f.includes(m[1]) && f.includes(`第${m[2]}套`)) return `/audio/${f}`
  }
  for (const f of files) {
    if (f.includes(name.substring(0, 12))) return `/audio/${f}`
  }
  return ''
}

function parse(text) {
  const lines = text.split('\n').map(clean).filter(Boolean)
  const out = []
  let buf = [], inSec = false
  for (const line of lines) {
    if (/Part\s*II|Section\s*A|Listening/i.test(line)) { inSec = true; buf = [line]; continue }
    if (!inSec) continue
    const qm = line.match(/^(?:Q)?\s*(\d{1,2})\s*[.、)]/)
    if (qm) {
      if (parseInt(qm[1]) > 25) break
      if (buf.length) { out.push({ text: buf.join(' '), start: 0, end: 0 }); buf = [] }
      buf.push(line); continue
    }
    if (/^[A-D][)）、.]/.test(line) && buf.length) { buf.push(line); continue }
    if (buf.length && line.length > 3) buf.push(line)
  }
  if (buf.length) out.push({ text: buf.join(' '), start: 0, end: 0 })
  return out
}

async function main() {
  const pdfs = fs.readdirSync(PDF_DIR).filter(f => f.endsWith('.pdf'))
  const items = []; const tcs = {}
  for (const f of pdfs) {
    console.log(`📄 ${f}`)
    const data = await pdfParse(fs.readFileSync(path.join(PDF_DIR, f)))
    const sents = parse(data.text)
    const qs = sents.filter(s => /^(?:Q)?\d+[.、)]/.test(s.text))
    const ds = sents.filter(s => !/^(?:Q)?\d+[.、)]/.test(s.text) && s.text.length > 10)
    const id = Date.now() + items.length
    const au = matchAudio(f)
    const item = { id, title: f.replace(/\.pdf$/i, '').replace(/【.*?】/g, '').trim(), audioUrl: au, sentences: [...ds, ...qs], fullText: [...ds, ...qs].map(s => s.text).join(' ') }
    items.push(item)
    if (au) tcs[id] = { title: item.title, audioUrl: au, segments: qs.map((s, i) => ({ index: i, text: s.text.slice(0, 60) + (s.text.length > 60 ? '...' : ''), start: 0, end: 0 })) }
    console.log(`   ✅ ${ds.length} 说明 + ${qs.length} 题${au ? ' 🎵' : ''}`)
  }
  fs.writeFileSync(OUT_TS, `const listeningGenerated = ${JSON.stringify(items, null, 2)}\n\nexport default listeningGenerated\n`, 'utf-8')
  fs.writeFileSync(OUT_TC, JSON.stringify(tcs, null, 2), 'utf-8')
  console.log(`\n📝 ${OUT_TS}\n⏱️ ${OUT_TC}\n✅ 完成`)
}
main().catch(e => { console.error(e); process.exit(1) })
