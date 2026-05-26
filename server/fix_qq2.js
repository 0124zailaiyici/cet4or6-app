const fs = require('fs'), path = require('path')

let n = 0
function scan(dir) {
  if (dir.includes('node_modules') || !fs.statSync(dir).isDirectory()) return
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    let o = t

    // 1. (expr) ?? val   →   (expr) != null ? (expr) : val
    t = t.replace(/(\([^()]+\))\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')

    // 2. word[.prop[index]] ?? val   →   word[.prop[index]] != null ? ... : val
    t = t.replace(/(\w[\w.\[\]]+)\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')

    if (t !== o) { fs.writeFileSync(p, t, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
scan('miniprogram/utils')
console.log(n + ' files')
