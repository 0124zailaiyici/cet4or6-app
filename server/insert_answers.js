const fs = require('fs')
const path = require('path')

const fp = path.join(__dirname, '..', 'miniprogram', 'data', 'listening.ts')
let txt = fs.readFileSync(fp, 'utf-8')

// Find the opening of 2019062 entry
const id2019062 = '1779442949822'
const idx2019062 = txt.indexOf(`"id": ${id2019062}`)
if (idx2019062 === -1) { console.log('2019062 not found'); process.exit(1) }

// Find the `},` before it (closing of 2019061)
const closingIdx = txt.lastIndexOf('},', idx2019062)
console.log('Closing }, at:', closingIdx)

// Find the line start of the closing },{ pair
// We want to remove the line "  }," and replace with "    correctAnswers: {...},\n  },"
// Find where this }, line starts
const lineStart = txt.lastIndexOf('\n', closingIdx) + 1
const lineEnd = txt.indexOf('\n', closingIdx)

console.log('Line:', JSON.stringify(txt.slice(lineStart, lineEnd)))
console.log('Next line:', JSON.stringify(txt.slice(lineEnd + 1, txt.indexOf('\n', lineEnd + 1))))

// Remove everything from the }, to just before the {
// The }, closes the entry. We need to replace:
//   },\n  {\n    "id": ...
// with:
//     "correctAnswers": {...}\n  },\n  {\n    "id": ...

const replacement = '    "correctAnswers": {"1":"A","2":"A","3":"B","4":"D","5":"C","6":"B","7":"D","8":"C","9":"A","10":"B","11":"A","12":"C","13":"D","14":"B","15":"D","16":"C","17":"B","18":"A","19":"D","20":"B","21":"C","22":"D","23":"C","24":"A","25":"B"},\n  },\n'

// Find the current state - there's a }, already before correctAnswers
// Let me read the current text around that area
const current = txt.slice(closingIdx - 20, closingIdx + 80)
console.log('\nCurrent text around closing:')
console.log(current)

// The current text has: 
//  "fullText": "...",
//},                    ← this is the original closing, should be removed
//    "correctAnswers":  ← this was already inserted
//...
//},                    ← duplicate closing
//{
//    "id": 1779442949822,

// Since correctAnswers is already there (from previous attempt), let me just fix the structure:
// Remove the first }, and rejoin

// Find the pattern "},\n    \"correctAnswers\""
const wrongPattern = /\},\s*\n\s+\"correctAnswers\"/
const match = txt.match(wrongPattern)
if (match) {
  console.log('\nFound wrong pattern at:', match.index)
  // Replace: "  },\n    \"correctAnswers\":" with ",\n    \"correctAnswers\":"
  txt = txt.replace(/  \},(\s*\n\s+\"correctAnswers\")/, '$1')
  console.log('Fixed stray closing brace')
}

fs.writeFileSync(fp, txt, 'utf-8')
console.log('\nDone')
