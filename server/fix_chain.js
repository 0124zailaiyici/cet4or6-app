const fs = require('fs'), path = require('path')

function scan(dir) {
    if (dir.includes('node_modules')) return
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name)
        if (f.isDirectory()) { scan(p); continue }
        if (!p.endsWith('.ts')) continue
        let t = fs.readFileSync(p, 'utf-8')
        const orig = t

        // Pattern: fix any standalone variable names that were left over from ?. replacement
        // These appear as: `found && found.qLocate` where part of the chain was: annot?.qLocate?.[k]
        // After first pass: annot && annot.qLocate?.[k]
        // After second pass: annot && annot.qLocate && qLocate[k]  -- qLocate is standalone!
        // Fix: Look for patterns like `annot && annot.XXX && XXX` and replace with `annot && annot.XXX && annot.XXX`
        
        // Strategy: Find triple patterns like "a && a.X && X" and fix to "a && a.X && a.X"
        // Also: "a && a.X && X.Y" → "a && a.X && a.X.Y"
        t = t.replace(
            /(\w[\w.]*) && \1\.(\w+)(?:&&\s*\2(?!\.|\[))/g,
            '$1 && $1.$2 && $1.$2'
        )
        
        // Also handle bracket notation: a && a[b] && b[k] → a && a[b] && a[b][k]
        // FIXME: This is getting too complex. Let me just fix known patterns.
        
        if (t !== orig) { fs.writeFileSync(p, t, 'utf-8'); console.log('Fixed:', path.basename(p)) }
    }
}
scan('miniprogram/pages')
console.log('done')
