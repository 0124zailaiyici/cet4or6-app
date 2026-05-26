const fs = require('fs'), path = require('path')
let files = [], n = 0
function scan(dir) {
  if (dir.includes('node_modules')) return
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    const orig = t
    // 1. func?.(args) -> func && func(args)
    t = t.replace(/(\w[\w.]*)\?\.\(/g, '$1 && $1(')
    // 2. word?.[key] -> word && word[key]  
    t = t.replace(/(\w[\w.]*)\?\.\[/g, '$1 && $1[')
    // 3. word[n]?.prop -> word[n] && word[n].prop
    t = t.replace(/([\w.]+)\[([^\]]*)\]\?\.(\w+)/g, '$1[$2] && $1[$2].$3')
    // 4. word[n]?.[key] -> word[n] && word[n][key]
    t = t.replace(/([\w.]+)\[([^\]]*)\]\?\.\[/g, '$1[$2] && $1[$2][')
    // 5. simple word?.prop (MUST be last)
    t = t.replace(/(\w[\w.]*)\?\.(\w+)/g, '$1 && $1.$2')
    if (t !== orig) { fs.writeFileSync(p, t, 'utf-8'); files.push(path.basename(p)); n++ }
  }
}
scan('miniprogram/pages')
console.log(files.join('\n'))
console.log(n + ' files')
