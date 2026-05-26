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

    // 1. ?.()
    t = t.replace(/(\w[\w.]*)\?\.\(/g, '$1 && $1(')
    // 2. ?. chain  a?.b?.[c]?.d -> a && a.b && a.b[c] && a.b[c].d
    t = t.replace(/([a-zA-Z_]\w*(?:\.\w+)*)((?:\?\.(?:\[[^\]]*\]|\w+))+)/g, (m, base, rest) => {
      const segs = []; const re = /\?\.(?:(\w+)|\[([^\]]*)\])/g; let x
      while ((x = re.exec(rest))) segs.push(x[1] ? '.' + x[1] : '[' + x[2] + ']')
      let pfx = base; const g = [base]
      for (const s of segs) { const f = pfx + s; g.push(f); pfx = f }
      return g.join(' && ')
    })
    // 3. (expr)?.prop
    t = t.replace(/\(([^)]+)\)\?\.(\w+)/g, '($1 || {}).$2')
    // 4. func(args)?.prop (no nested parens)
    t = t.replace(/(\w[\w.]+)\(([^()]*)\)\?\.(\w+)/g, '($1($2) || {}).$3')
    // 5. X[Y]?.prop
    t = t.replace(/([\w.]+)\[([^\]]*)\]\?\.(\w+)/g, '$1[$2] && $1[$2].$3')
    // 6. ??. (paren) -> != null ternary
    t = t.replace(/(\([^()]+\))\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')
    // 7. ??. {obj}[key]
    t = t.replace(/(\{[^}]*\}\[[^\]]*\])\s*\?\?\s*(-?\d+)/g, '$1 != null ? $1 : $2')
    // 8. ??. simple
    t = t.replace(/([\w.\[\]]+)\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')

    if (t !== o) { fs.writeFileSync(p, t, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
console.log(n + ' files')
