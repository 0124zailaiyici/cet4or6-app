import { buildSynonymMap } from '../data/synonyms'

const synMap = buildSynonymMap()

function norm(s: string): string[] {
  return s.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').split(/\s+/).filter(Boolean)
}

function expandSet(words: string[]): Set<string> {
  const s = new Set<string>()
  for (const w of words) {
    s.add(w)
    const syns = synMap.get(w)
    if (syns) for (const syn of syns) s.add(syn)
  }
  return s
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const inter = new Set([...a].filter(x => b.has(x)))
  const union = new Set([...a, ...b])
  return union.size > 0 ? inter.size / union.size : 0
}

function ngramSimilarity(aWords: string[], rWords: string[], n: number): number {
  const toNgrams = (words: string[]) => {
    const s = new Set<string>()
    for (let i = 0; i <= words.length - n; i++) {
      s.add(words.slice(i, i + n).join(' '))
    }
    return s
  }
  const a = toNgrams(aWords)
  const r = toNgrams(rWords)
  if (r.size === 0) return aWords.length === 0 ? 1 : 0
  return jaccard(a, r)
}

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

function levenshteinScore(aWords: string[], rWords: string[]): number {
  if (aWords.length === 0 && rWords.length === 0) return 1
  const aStr = aWords.join(' ')
  const rStr = rWords.join(' ')
  const dist = editDistance(aStr, rStr)
  const maxLen = Math.max(aStr.length, rStr.length)
  return maxLen > 0 ? 1 - dist / maxLen : 1
}

export interface ScorerResult {
  total: number
  dimensions: {
    vocabulary: number   // keywords coverage (0-100)
    grammar: number      // n-gram similarity (0-100)
    semantics: number    // acceptable answer match (0-100)
    expression: number   // structure + edit distance (0-100)
  }
  details: {
    keywordHit: number
    keywordTotal: number
    ngramAvg: number
    acceptScore: number
  }
}

export function scoreWriting(text: string): {
  score: number; dimensions: { content: number; structure: number; language: number }; suggestions: string
} {
  const wc = text.trim() ? text.trim().split(/\s+/).length : 0
  const sc = text.split(/[.!?]+/).filter(Boolean).length
  const paras = text.split('\n').filter(Boolean).length
  let content = 60, structure = 60, language = 60
  const notes: string[] = []
  if (wc < 80) { notes.push('词数不足，建议 120-180 词'); content = 40; structure = 40 }
  else if (wc >= 120 && wc <= 180) { notes.push('✅ 词数符合四级要求'); content = 75; structure = 70 }
  else { notes.push(`作文 ${wc} 词，建议 120-180 词`); content = wc > 180 ? 65 : 55 }
  if (paras < 2) { notes.push('建议分 2-3 段'); structure = Math.min(structure, 45) }
  else if (paras >= 3) { notes.push(`✅ 分为 ${paras} 段`); structure = Math.min(structure + 15, 85) }
  else structure = Math.min(structure + 5, 75)
  if (sc < 5) { notes.push('句子偏少，建议 8-15 句'); content = Math.min(content, 50) }
  else if (sc >= 8) { notes.push(`✅ ${sc} 个句子`); content = Math.min(content + 10, 85) }
  const hasIntro = /first(ly)?|to begin with|it is (widely|universally)/i.test(text)
  const hasBody = /second(ly)?|furthermore|moreover|in addition|on the (one|other) hand/i.test(text)
  const hasConcl = /in conclusion|to sum up|in my opinion|in my view/i.test(text)
  if (hasIntro) structure = Math.min(structure + 8, 90)
  if (hasBody) structure = Math.min(structure + 8, 90)
  if (hasConcl) structure = Math.min(structure + 10, 90)
  if (hasIntro && hasBody && hasConcl) notes.push('✅ 总—分—总结构清晰')
  else notes.push('💡 建议总—分—总结构')
  const avgScore = Math.round((content + structure + language) / 3)
  return { score: avgScore, dimensions: { content, structure, language }, suggestions: notes.join('\n') }
}

export function scoreTranslation(
  answer: string,
  item: { reference: string; keywords?: string[]; acceptableAnswers?: string[] }
): ScorerResult {
  const aWords = norm(answer)
  const rWords = norm(item.reference)
  const rExpanded = expandSet(rWords)

  if (rWords.length === 0) {
    return {
      total: 0,
      dimensions: { vocabulary: 0, grammar: 0, semantics: 0, expression: 0 },
      details: { keywordHit: 0, keywordTotal: 0, ngramAvg: 0, acceptScore: 0 },
    }
  }

  /* vocabulary: keyword coverage with synonym matching */
  const keywords = item.keywords || []
  let keywordHit = 0
  const kwWords = keywords.flatMap(k => norm(k))
  const aSet = new Set(aWords)
  const aExpanded = expandSet(aWords)
  const kwHits = new Set<string>()
  for (const kw of kwWords) {
    if (kwHits.has(kw)) continue
    if (aSet.has(kw)) {
      kwHits.add(kw)
      keywordHit++
    } else {
      const syns = synMap.get(kw)
      if (syns) {
        for (const s of syns) {
          if (aSet.has(s)) {
            kwHits.add(kw)
            keywordHit++
            break
          }
        }
      }
    }
  }
  const keywordTotal = kwWords.length
  const vocabulary = keywordTotal > 0
    ? Math.round((keywordHit / keywordTotal) * 100)
    : Math.round(jaccard(aExpanded, rExpanded) * 100)

  /* grammar: avg of 1-gram, 2-gram, 3-gram, 4-gram similarity */
  let ngramSum = 0
  let ngramCount = 0
  for (let n = 1; n <= 4; n++) {
    if (aWords.length >= n || rWords.length >= n) {
      ngramSum += ngramSimilarity(aWords, rWords, n)
      ngramCount++
    }
  }
  const ngramAvg = ngramCount > 0 ? ngramSum / ngramCount : 0
  const grammar = Math.round(ngramAvg * 100)

  /* semantics: best match against any acceptable answer */
  const acceptableAnswers = item.acceptableAnswers || []
  let acceptScore = 0
  if (acceptableAnswers.length > 0) {
    let best = 0
    for (const acc of acceptableAnswers) {
      const accWords = norm(acc)
      let sim = 0
      let cnt = 0
      for (let n = 1; n <= 3; n++) {
        if (aWords.length >= n || accWords.length >= n) {
          sim += ngramSimilarity(aWords, accWords, n)
          cnt++
        }
      }
      const s = cnt > 0 ? sim / cnt : 0
      if (s > best) best = s
    }
    acceptScore = best
  } else {
    /* fallback: unigram + bigram against reference */
    let sim = ngramSimilarity(aWords, rWords, 1)
    if (aWords.length >= 2 || rWords.length >= 2) {
      sim = (sim + ngramSimilarity(aWords, rWords, 2)) / 2
    }
    acceptScore = sim
  }
  const semantics = Math.round(acceptScore * 100)

  /* expression: structure score (word count + edit distance) */
  const lenRatio = rWords.length > 0
    ? Math.min(aWords.length, rWords.length) / Math.max(aWords.length, rWords.length)
    : 0
  const editScore = levenshteinScore(aWords, rWords)
  const expression = Math.round((lenRatio * 0.3 + editScore * 0.7) * 100)

  /* total */
  const total = Math.round(
    vocabulary * 0.30 +
    grammar * 0.30 +
    semantics * 0.20 +
    expression * 0.20
  )

  return {
    total,
    dimensions: { vocabulary, grammar, semantics, expression },
    details: { keywordHit, keywordTotal, ngramAvg: Math.round(ngramAvg * 100), acceptScore: Math.round(acceptScore * 100) },
  }
}
