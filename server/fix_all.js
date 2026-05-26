const fs = require('fs'), path = require('path')

function fixFile(t) {
  const orig = t

  // === 1. Fix ?. (optional chaining) ===
  // a) func?.(args) -> func && func(args)
  t = t.replace(/(\w[\w.]*)\?\.\(/g, '$1 && $1(')
  // b) a?.b?.[c]?.d chain -> a && a.b && a.b[c] && a.b[c].d
  t = t.replace(
    /([a-zA-Z_]\w*(?:\.\w+)*)((?:\?\.(?:\[[^\]]*\]|\w+))+)/g,
    (match, base, rest) => {
      const segs = []
      const re = /\?\.(?:(\w+)|\[([^\]]*)\])/g
      let m
      while ((m = re.exec(rest)) !== null) {
        segs.push(m[1] ? '.' + m[1] : '[' + m[2] + ']')
      }
      let prefix = base
      const guards = [base]
      for (const s of segs) {
        const full = prefix + s
        guards.push(full)
        prefix = full
      }
      return guards.join(' && ')
    }
  )

  // c) Remaining )?.prop pattern: func(args)?.prop -> (func(args) || {}).prop
  // Match xxx)?.word where xxx does NOT contain ?. inside
  t = t.replace(/([\s\S]+?)\)\?\.(\w+)/g, (m, before, prop) => {
    // Find the matching open paren for this closing paren
    // Simple heuristic: if before has no unclosed parens, wrap the whole thing
    return '(' + before + ') || {}).' + prop
  })

  // d) Remaining ]?.prop pattern: X[Y]?.prop -> X[Y] && X[Y].prop
  t = t.replace(/([\w.]+)\[([^\]]*)\]\?\.(\w+)/g, '$1[$2] && $1[$2].$3')

  // e) )?. with bracket: func(args)?.[key] -> (func(args) || {})[key]
  t = t.replace(/([\s\S]+?) \)\?\.\[/g, (m, before) => {
    return '(' + before + ') || {})['
  })
  // But remove space before ) in the replacement
  // Actually fix the spacing issue
  t = t.replace(/\(([\s\S]+?) \)\|\|/g, '($1)||')

  // === 2. Fix ?? (nullish coalescing) ===
  // a) (expr) ?? val -> (expr) != null ? (expr) : val
  t = t.replace(/(\([^()]+\))\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')
  // b) {obj}[key] ?? val -> {obj}[key] != null ? {obj}[key] : val
  t = t.replace(/(\{[^}]*\}\[[^\]]*\])\s*\?\?\s*(-?\d+)/g, '$1 != null ? $1 : $2')
  // c) simple word(.prop)?[index]? ?? val
  t = t.replace(/([\w.\[\]]+)\s*\?\?\s*(-?\d+|[\w.\[\]]+)/g, '$1 != null ? $1 : $2')

  return t !== orig ? t : null
}

let n = 0
function scan(dir) {
  if (dir.includes('node_modules') || !fs.statSync(dir).isDirectory()) return
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f)
    if (fs.statSync(p).isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    const r = fixFile(t)
    if (r !== null) { fs.writeFileSync(p, r, 'utf-8'); n++; console.log(path.basename(p)) }
  }
}
scan('miniprogram/pages')
scan('miniprogram/utils')
console.log('\n' + n + ' files')
