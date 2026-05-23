const fs = require('fs')
const path = require('path')

const TIMECODE_FILE = path.join(__dirname, 'audio', 'timecodes.json')
const DATA_FILE = path.join(__dirname, '..', 'miniprogram', 'data', 'listening_generated.ts')

const timecodes = JSON.parse(fs.readFileSync(TIMECODE_FILE, 'utf-8'))
let dataContent = fs.readFileSync(DATA_FILE, 'utf-8')
const match = dataContent.match(/const listeningGenerated = (\[[\s\S]*\])\n*export default/)
const data = JSON.parse(match[1])

let updated = 0
for (const item of data) {
  const tc = timecodes[item.id]
  if (!tc) continue
  for (const seg of tc.segments) {
    if (seg.start > 0 || seg.end > 0) {
      for (const s of item.sentences) {
        if (s.text.startsWith(seg.text.slice(0, 20))) {
          s.start = seg.start; s.end = seg.end; updated++; break
        }
      }
    }
  }
}

const tsContent = `const listeningGenerated = ${JSON.stringify(data, null, 2)}\n\nexport default listeningGenerated\n`
fs.writeFileSync(DATA_FILE, tsContent, 'utf-8')
console.log(`✅ 已更新 ${updated} 个句子的时间码`)
console.log(`📝 ${DATA_FILE}`)
