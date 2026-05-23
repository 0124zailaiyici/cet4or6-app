const fs = require('fs')
const path = require('path')
const pdf = require('pdf-parse')

async function main() {
  const dir = path.join(__dirname, '..', 'answer_keys')
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'))

  for (const f of files) {
    const buf = fs.readFileSync(path.join(dir, f))
    const data = await pdf(buf)
    
    // Only match in the answer section (after "答案详解" or after question text)
    // Pattern: line starting with question number, then answer letter on next line with 解析
    const lines = data.text.split('\n')
    let answers = {}
    let inListening = false
    let currentQ = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Detect listening answer section start
      if (line.includes('Listening Comprehension')) { inListening = true; continue }
      // Listening section ends when Reading/Translation starts
      if (inListening && (line.includes('Part III') || line.includes('Reading') || line.includes('Translation'))) {
        inListening = false; continue
      }
      if (!inListening) continue
      
      // Match question number: "1. " at start of line
      const qm = line.match(/^(\d+)\.\s*/)
      if (qm) {
        const num = parseInt(qm[1])
        if (num >= 1 && num <= 25) {
          currentQ = num
          // Check if answer letter is on the same line
          const am = line.match(/([A-D])）【精析】/)
          if (am) {
            answers[currentQ] = am[1]
          }
        }
      }
      
      // Check next line for answer letter
      if (currentQ > 0 && !answers[currentQ]) {
        const am = line.match(/^([A-D])）【精析】/)
        if (am) {
          answers[currentQ] = am[1]
        }
      }
    }
    
    console.log('=== ' + f + ' ===')
    console.log('Listening answers:')
    for (let q = 1; q <= 25; q++) {
      console.log(`  Q${q}: ${answers[q] || '???'}`)
    }
    console.log('JSON:', JSON.stringify(answers))
  }
}

main().catch(console.error)
