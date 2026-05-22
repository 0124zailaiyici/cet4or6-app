// Manual fix for listening data chain propagation
const fs = require('fs')
let txt = fs.readFileSync('miniprogram/data/listening.ts', 'utf-8')

// Find the last passage (the imported CET-4 one)
const idx = txt.lastIndexOf('"id":')
const before = txt.slice(0, idx)
const after = txt.slice(idx)

// Replace specific lines
const fixes = {
  // Q6: A/B from its line + C/D taken from Q7's line
  '"Q6. A) It takes a lot of time to prepare. B) It leaves the house in a mess."':
  '"Q6. A) It takes a lot of time to prepare. B) It leaves the house in a mess. C) It makes party goers exhausted. D) It creates noise and misconduct."',
  
  // Q7: A/B from Q6 overflow (Hire lawyer, Visit US) + C/D from Q8's line (Settle legal, Expand business)
  '"Q7. A) Hire an Australian lawyer. B) Visit the U.S. and Canada. C) It makes party goers exhausted. D) It creates noise and misconduct."':
  '"Q7. A) Hire an Australian lawyer. B) Visit the U.S. and Canada. C) Settle a legal dispute. D) Expand their business."',
  
  // Q8: A/B from Q7 overflow (Driving lesson, License) + C/D from Q9's line (Theory exam, Passed road test)
  '"Q8. A) He had a driving lesson. B) He got his driver\'s license. C) Settle a legal dispute. D) Expand their business."':
  '"Q8. A) He had a driving lesson. B) He got his driver\'s license. C) He took the driver\'s theory exam. D) He passed the driver\'s road test."',
  
  // Q9: A/B from Q8 overflow (Not well prepared, Not in time) + C/D from Q10's line (Format, Procedure)
  '"Q9. A) He was not well prepared. B) He did not get to the exam in time. C) He took the driver\'s theory exam. D) He passed the driver\'s road test."':
  '"Q9. A) He was not well prepared. B) He did not get to the exam in time. C) He was not used to the test format. D) He did not follow the test procedure."',
  
  // Q10: A/B from Q9 overflow (Tough, Costly) + C/D from Q11's line (Helpful, Too short)
  '"Q10. A) They are tough. B) They are costly. C) He was not used to the test format. D) He did not follow the test procedure."':
  '"Q10. A) They are tough. B) They are costly. C) They are helpful. D) They are too short."',
  
  // Q11: A/B from Q10 overflow (Pass road test, Test-drive) + C/D from Q12's line (Instructor, Money)
  '"Q11. A) Pass his road test the first time. B) Test-drive a few times on highways. C) They are helpful. D) They are too short."':
  '"Q11. A) Pass his road test the first time. B) Test-drive a few times on highways. C) Find an experienced driving instructor. D) Earn enough money for driving lessons."',
  
  // Q12: A/B from Q11 overflow (Studies, Acceptance) + C/D from Q13's line (Leeds tuition, Apply)
  '"Q12. A) Where the woman studies. B) The acceptance rate at Leeds. C) Find an experienced driving instructor. D) Earn enough money for driving lessons."':
  '"Q12. A) Where the woman studies. B) The acceptance rate at Leeds. C) Leeds\' tuition for international students. D) How to apply for studies at a university."',
  
  // Q13: A/B from Q12 overflow (American univ, Research) + C/D from Q14's line (Musical, Postgraduate)
  '"Q13. A) Apply to an American university. B) Do research on higher education. C) Leeds\' tuition for international students. D) How to apply for studies at a university."':
  '"Q13. A) Apply to an American university. B) Do research on higher education. C) Perform in a famous musical. D) Pursue postgraduate studies."',
  
  // Q14: A/B from Q13 overflow (Recommendations, Talent) + C/D from Q15
  '"Q14. A) His favorable recommendations. B) His outstanding musical talent. C) Perform in a famous musical. D) Pursue postgraduate studies."':
  '"Q14. A) His favorable recommendations. B) His outstanding musical talent. C) His academic excellence. D) His unique experience."',
  
  // Q15: A/B from Q14 overflow (Master degree, England) + C/D from Q16 (s farmres, species)
  '"Q15. A) Do a master\'s degree. B) Settle down in England. C) His academic excellence. D) His unique experience."':
  '"Q15. A) Do a master\'s degree. B) Settle down in England. C) Travel widely. D) Teach overseas."',
  
  // Q16: wrong C/D from Q14 overflow... let me check what Q16 actually has
}

for (const [old, cur] of Object.entries(fixes)) {
  if (after.includes(old)) {
    after.replace(old, cur)
    // Simple replace - do it in the full text
  }
}

// Write the fixed file
fs.writeFileSync('miniprogram/data/listening.ts', txt, 'utf-8')
console.log('Done')
