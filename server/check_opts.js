const fs = require('fs')
const txt = fs.readFileSync('miniprogram/data/listening.ts', 'utf-8')
const m = txt.match(/const listeningData =([\s\S]*)export default/)
if (!m) { console.log('not found'); process.exit(1) }
const data = JSON.parse(m[1].replace(/'/g, '"'))
const last = data[data.length - 1]
const s = last.sentences
console.log('Total sentences:', s.length)
let qNum = 0
let current = []
for (const line of s) {
  const t = line.text.trim()
  const qm = t.match(/^(\d+)\./)
  if (qm) {
    if (current.length > 0) console.log('Q' + qNum + ': opts=' + current.length + ' ' + JSON.stringify(current))
    qNum = parseInt(qm[1])
    current = []
    const opts = t.split(/(?=[A-D]\))/).filter(Boolean)
    for (const o of opts) {
      const om = o.match(/^([A-D])\)\s*(.*)/)
      if (om) current.push(om[1] + ': ' + om[2].slice(0, 40))
    }
  } else if (/^[A-D]\)/.test(t)) {
    const opts = t.split(/(?=[A-D]\))/).filter(Boolean)
    for (const o of opts) {
      const om = o.match(/^([A-D])\)\s*(.*)/)
      if (om) current.push(om[1] + ': ' + om[2].slice(0, 40))
    }
  }
}
if (current.length > 0) console.log('Q' + qNum + ': opts=' + current.length + ' ' + JSON.stringify(current))
