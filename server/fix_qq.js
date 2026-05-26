const fs = require('fs'), path = require('path')
// Replace a ?? b with a != null ? a : b
function fixQQ(t) {
  return t.replace(/([\w.\[\]()]+)\s*\?\?\s*/g, (m, expr) => {
    // Only fix simple expressions (no commas, no {} )
    // expr is something like: var, a.b, a[b], func(), (a && b)
    return expr + ' != null ? ' + expr + ' : '
  })
}
let n = 0
function scan(dir) {
  if (dir.includes('node_modules') || !fs.statSync(dir).isDirectory()) return
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    const o = t
    t = fixQQ(t)
    if (t !== o) { fs.writeFileSync(p, t, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
console.log(n + ' files')
