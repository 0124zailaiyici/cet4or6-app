const fs = require('fs')
const path = require('path')

const transcriptData = JSON.parse(fs.readFileSync(path.join(__dirname, 'audio', 'transcript_data.json'), 'utf-8'))
const tsPath = path.join(__dirname, '..', 'miniprogram', 'data', 'listening_generated.ts')
let tsContent = fs.readFileSync(tsPath, 'utf-8')

// Build a map: qNum -> { transcript, highlights, answerKey }
const qMap = {}
for (const group of transcriptData.groups) {
  for (let q = group.qStart; q <= group.qEnd; q++) {
    qMap[q] = {
      transcript: group.transcript,
      highlights: group.highlights.filter(h => h.qNum === q).map(h => h.text),
      answerKey: (group.answers.find(a => a.q === q) || {}).letter || '',
    }
  }
}

// Find all sentence objects in the content and inject data
// Pattern: {"text":"N. ...","start":...,"end":...}
let updated = 0
for (let q = 1; q <= 25; q++) {
  const data = qMap[q]
  if (!data) { console.log(`  Q${q}: no data`); continue }

  // Replace: find "end": NUMBER and inject after it (before the closing })
  // Look for {"text":"Q?q. ... but only when followed by "start" and "end"
  // Use a simpler approach: match the entire sentence object
  const escText = data.transcript
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')

  const highlightsStr = '[' + data.highlights.map(h => '"' + h.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(', ') + ']'

  const injectFields = `,\n    "transcript": "${escText}",\n    "highlights": ${highlightsStr},\n    "answerKey": "${data.answerKey}"`

  // Use a regex that matches the sentence object for this question number
  // Pattern: {"text":"Q?q. ...anything... "end": NUMBER}
  // The tricky part is matching across lines without being greedy
  // Strategy: match "text":"q." then find the matching "end":NUMBER

  // Simpler: find the "text":"q. pattern, then locate "end": NUMBER,
  // check if already has transcript, inject if not
  const textPattern = `"text"\\s*:\\s*"${q}\\.`
  // Find all positions
  let idx = 0
  while (idx < tsContent.length) {
    const textMatch = tsContent.slice(idx).match(new RegExp(textPattern))
    if (!textMatch) break

    const startPos = idx + textMatch.index
    // Find "end": NUMBER after this position
    const endMatch = tsContent.slice(startPos).match(/"end"\s*:\s*\d+/)
    if (!endMatch) { idx = startPos + 1; continue }

    const endPos = startPos + endMatch.index + endMatch[0].length

    // Check if already injected
    const afterEnd = tsContent.slice(endPos, endPos + 20)
    if (afterEnd.includes('"transcript"')) {
      idx = endPos
      continue
    }

    // Inject
    tsContent = tsContent.slice(0, endPos) + injectFields + tsContent.slice(endPos)
    updated++
    idx = endPos + injectFields.length
  }
}

fs.writeFileSync(tsPath, tsContent, 'utf-8')
console.log(`Updated ${updated} sentences`)
