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
    // ]?.prop → ] && .prop  然后 cleanup
    // This handles: entry.phonetics[0]?.text → entry.phonetics[0] && entry.phonetics[0].text
    t = t.replace(/\]\?\.(\w+)/g, '] && $&')
    t = t.replace(/\]\?\.\[/g, '] && $&')
    // )?.prop → ) || {}).prop  (function call optional chaining)
    t = t.replace(/\)\?\.(\w+)/g, ' || {}).$1')
    t = t.replace(/\)\?\.\[/g, ' || {})[$&')
    if (t !== orig) { fs.writeFileSync(p, t, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
console.log(n + ' files')
