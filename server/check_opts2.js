const fs = require('fs')
const txt = fs.readFileSync('miniprogram/data/listening.ts', 'utf-8')
// Find the last passage item
const idx = txt.lastIndexOf('"id":')
const chunk = txt.slice(idx)
const idm = chunk.match(/"id": (\d+)/)
const audioM = chunk.match(/"audioUrl": "([^"]*)"/)
console.log('Passage ID:', idm ? idm[1] : '?')
console.log('audioUrl:', audioM ? audioM[1] : '(none)')

// Extract sentences by parsing text fields
const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean)
const texts = []
let inSent = false
for (const l of lines) {
  if (l.includes('"sentences"')) { inSent = true; continue }
  if (inSent && l.startsWith(']')) break
  if (!inSent) continue
  const m = l.match(/"text": "([^"]*)"/)
  if (m) texts.push(m[1])
}
console.log('Sentences:', texts.length)

// Group by question
let qNum = 0, opts = []
for (const t of texts) {
  const qm = t.match(/^(\d+)\./)
  if (qm) {
    if (opts.length > 0) console.log('  Q' + qNum + ': ' + opts.join(',') + (opts.length < 4 ? ' *** MISSING ***' : ''))
    qNum = parseInt(qm[1])
    opts = []
    const parts = t.split(/(?=[A-D]\))/).filter(Boolean)
    for (const p of parts) {
      const om = p.match(/^([A-D])\)/)
      if (om) opts.push(om[1])
    }
  } else if (/^[A-D]\)/.test(t)) {
    const parts = t.split(/(?=[A-D]\))/).filter(Boolean)
    for (const p of parts) {
      const om = p.match(/^([A-D])\)/)
      if (om) opts.push(om[1])
    }
  }
}
if (opts.length > 0) console.log('  Q' + qNum + ': ' + opts.join(',') + (opts.length < 4 ? ' *** MISSING ***' : ''))
