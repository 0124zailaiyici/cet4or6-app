const fs = require('fs')
const path = require('path')

let count = 0
function scan(dir) {
  if (dir.includes('node_modules')) return
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) { scan(p); continue }
    if (!p.endsWith('.ts')) continue
    let t = fs.readFileSync(p, 'utf-8')
    let changed = false

    // Pattern 1: obj?.[key] → obj && obj[key]
    t = t.replace(/(\w+)\?\.\[/g, '$1 && $1[')
    changed = true

    // Pattern 2: func()?.prop → (func() || {}).prop
    // This is complex, skip for now
    // Pattern 3: simple obj?.prop → obj && obj.prop (must be after pattern 1)
    t = t.replace(/(\w+)\?\.(\w+)/g, '$1 && $1.$2')
    changed = true

    if (changed) {
      fs.writeFileSync(p, t, 'utf-8')
      count++
      console.log(path.relative('miniprogram', p))
    }
  }
}
scan('miniprogram/pages')
console.log('\n' + count + ' files updated')
