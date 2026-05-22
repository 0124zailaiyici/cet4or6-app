const fs = require('fs')
const txt = fs.readFileSync('miniprogram/data/listening.ts', 'utf-8')
const idx = txt.lastIndexOf('"id":')
const chunk = txt.slice(idx)
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
let qNum = 0, opts = []
for (const t of texts) {
  const qm = t.match(/^(\d+)\./)
  if (qm) {
    if (opts.length > 0) {
      const m = opts.length < 4 ? ' *** MISSING ' + (4 - opts.length) + ' ***' : ''
      console.log('  Q' + qNum + ': ' + opts.join(',') + m)
    }
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
      if (om && !opts.includes(om[1])) opts.push(om[1])
    }
  }
}
if (opts.length > 0) {
  const m = opts.length < 4 ? ' *** MISSING ' + (4 - opts.length) + ' ***' : ''
  console.log('  Q' + qNum + ': ' + opts.join(',') + m)
}
