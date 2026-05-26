const fs = require('fs'), path = require('path')

// Convert chained optional chaining like `a?.b?.[c]?.d` to `a && a.b && a.b[c] && a.b[c].d`
function fixOptChain(match, base, rest) {
  // Parse rest into segments: ?.word or ?.[key]
  const segs = []
  const re = /\?\.(?:(\w+)|\[([^\]]*)\])/g
  let m
  while ((m = re.exec(rest)) !== null) {
    segs.push(m[1] ? '.' + m[1] : '[' + m[2] + ']')
  }
  // Build guards
  let prefix = base
  const guards = [base]
  for (const s of segs) {
    const full = prefix + s
    guards.push(full)
    prefix = full
  }
  return guards.join(' && ')
}

let files = [], n = 0
function scan(dir) {
  if (dir.includes('node_modules')) return
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    const orig = t

    // Step 1: (?.) optional call → func && func(args)
    t = t.replace(/(\w[\w.]*)\?\.\(/g, '$1 && $1(')

    // Step 2: a?.b?.[c]?.d chain → full guards
    // Matches: baseWord followed by ?.word or ?.[key] chain
    t = t.replace(
      /([a-zA-Z_]\w*(?:\.\w+)*)((?:\?\.(?:\[[^\]]*\]|\w+))+)/g,
      fixOptChain
    )

    if (t !== orig) { fs.writeFileSync(p, t, 'utf-8'); files.push(path.basename(p)); n++ }
  }
}
scan('miniprogram/pages')
console.log(files.join('\n'))
console.log(n + ' files')
