const fs = require('fs'), path = require('path')
let n = 0
function scan(dir) {
  if (dir.includes('node_modules')) return
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    const orig = t
    // a.b?.c → a.b && a.b.c  (完整链式路径)
    t = t.replace(/([a-zA-Z_][\w.]*)\?\.(\w+)/g, '$1 && $1.$2')
    // a?.[b] → a && a[b]
    t = t.replace(/([a-zA-Z_][\w.]*)\?\.\[/g, '$1 && $1[')
    if (t !== orig) { fs.writeFileSync(p, t, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
console.log(n + ' files')
