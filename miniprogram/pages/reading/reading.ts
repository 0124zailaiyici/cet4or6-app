import readingsData from '../../data/readings'
import readingAnnotations from './reading_annotations'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { doCheckIn } from '../../utils/checkin'

interface IReadingItem {
  id: number
  title: string
  sectionType: string
  passage: string
  questions: string[]
  options: string[]
  choices: string[][]
  correctAnswers: Record<string, string>
}

interface ISegment {
  type: 'word' | 'sep' | 'blank'
  text: string
  word?: string
  zh?: string
  num?: string
  paraIdx?: number
}

interface IResultItem {
  label: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  locate?: string
  hint?: string
  questionStem?: string
  allOptions?: string[]
  correctOptionIndex?: number
  userOptionIndex?: number
}

interface IReadingData {
  readings: IReadingItem[]
  current: IReadingItem | null
  currentQ: number
  passagePage: number
  passagePages: string[]
  formattedPages: string[]
  blankAnswers: Record<string, string>
  usedFlags: boolean[]
  activeBlank: string | null
  bStmtPage: number
  bStmtPages: string[][]
  matchAnswers: Record<number, string>
  activeStmt: number | null
  matchCount: number
  availLetters: string[]
  cAnswers: Record<number, string>
  cSelIdx: number
  compactOpts: boolean
  darkMode: boolean
  optionLetters: string[]
  touchStartX: number
  submitted: boolean
  score: number
  totalScore: number
  showResult: boolean
  resultItems: IResultItem[]
  completionMap: Record<number, { submitted: boolean; score: number; totalScore: number }>
  showVocab: boolean
  vocabList: Array<{ word: string; zh: string }>
  scrollTop: number
  passageParas: string[]
  highlightedPara: number
  fullTranslation: string
  showTrans: boolean
  pageParas: Array<{ text: string; paraIdx: number }>
  pageWordSegments: ISegment[]
  scrollToResult: string
  examMode: boolean
  showHint: boolean
  locateMap: Record<string, string>
  currentQLocate: string
  bStmtKeywords: string[]
  activeBlankHint: string
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
  prevQ(): void
  nextQ(): void
  prevPassage(): void
  nextPassage(): void
  splitPassage(text: string): string[]
  saveAnswers(): void
  onBlankTap(e: WechatMiniprogram.TouchEvent): void
  onOptionTap(e: WechatMiniprogram.TouchEvent): void
  onTouchStart(e: WechatMiniprogram.TouchEvent): void
  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onChoiceTap(e: WechatMiniprogram.TouchEvent): void
  saveCAnswer(): void
  updateCompact(): void
  formatBPassage(text: string): string[]
  selectStmt(e: WechatMiniprogram.TouchEvent): void
  assignLetter(e: WechatMiniprogram.TouchEvent): void
  removeMatch(e: WechatMiniprogram.TouchEvent): void
  saveMatch(): void
  submit(): void
  onShareAppMessage(): any
  hideResult(): void
  showResultAgain(): void
  jumpToParagraph(e: WechatMiniprogram.TouchEvent): void
  shareResult(): void
  resetCurrent(): void
  checkAllAnswered(): boolean
  getMissingCount(): { total: number; answered: number }
  buildResult(): IResultItem[]
  refreshCompletionMap(): void
  getPassageParas(text: string): string[]
  toggleVocab(): void
  toggleTrans(): void
  onWordTap(e: WechatMiniprogram.TouchEvent): void
  updatePageParas(): void
  tokenizeToSegments(text: string, segs: ISegment[], vocab: Record<string, string>, paraIdx: number): void
  scrollToResultItem(e: WechatMiniprogram.TouchEvent): void
  toggleHint(): void
  getBlankGrammarHint(num: string): string
}

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    currentQ: 0,
    passagePage: 0,
    passagePages: [],
    formattedPages: [],
    blankAnswers: {},
    usedFlags: [],
    activeBlank: null,
    darkMode: false,
    optionLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'],
    touchStartX: 0,
    bStmtPage: 0,
    bStmtPages: [],
    matchAnswers: {},
    activeStmt: null,
    matchCount: 0,
    availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
    cAnswers: {},
    cSelIdx: -1,
    compactOpts: false,
    submitted: false,
    score: 0,
    totalScore: 0,
    showResult: false,
    resultItems: [],
    completionMap: {},
    showVocab: false,
    vocabList: [],
    scrollTop: 0,
    passageParas: [],
    highlightedPara: -1,
    fullTranslation: '',
    showTrans: false,
    pageParas: [],
    pageWordSegments: [],
    scrollToResult: '',
    examMode: false,
    showHint: false,
    locateMap: {},
    currentQLocate: '',
    bStmtKeywords: [],
    activeBlankHint: ''
  },

  onLoad(options?: { examMode?: string }) {
    if (options && options.examMode === '1') this.setData({ examMode: true })
    const readings = readingsData as unknown as IReadingItem[]
    this.setData({ readings })
    this.refreshCompletionMap()
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.refreshCompletionMap()
  },

  refreshCompletionMap() {
    const app = getApp<IAppOption>()
    const saved = app.globalData.studyData.readingAnswers
    const map: Record<number, { submitted: boolean; score: number; totalScore: number }> = {}
    for (const r of this.data.readings) {
      const a = saved[r.id] as any
      map[r.id] = {
        submitted: !!(a && a.submitted),
        score: (a && a.score) || 0,
        totalScore: (a && a.totalScore) || 0
      }
    }
    this.setData({ completionMap: map })
  },

  select(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.readings.find(r => r.id === id)
    if (item) {
      const annot = readingAnnotations[item.id]
      const vocab = annot && annot.vocab || {}
      const pages = item.sectionType === 'B'
        ? this.formatBPassage(item.passage)
        : this.splitPassage(item.passage)
      const paras = item.sectionType === 'B' ? this.formatBPassage(item.passage) : this.getPassageParas(item.passage)
      const vocabList = Object.entries(vocab).map(([word, zh]) => ({ word, zh }))
      const fullTranslation = annot && annot.translation || ''
      const app = getApp<IAppOption>()
      const saved = app.globalData.studyData.readingAnswers[item.id]
      const matchSaved = saved && saved.matchAnswers || {}
      const cAnswerSaved = saved && saved.cAnswers || {}
      const bPages: string[][] = []
      if (item.sectionType === 'B' && item.questions.length > 0) {
        for (let i = 0; i < item.questions.length; i += 5) bPages.push(item.questions.slice(i, i + 5))
      }
      const isSubmitted = !!(saved && (saved as any).submitted)
      const st = item.sectionType
      const maxScore = st === 'A' ? 10 : st === 'B' ? 10 : 5
      const qLocate = annot && annot.qLocate || {}
      const locateMap: Record<string, string> = { ...qLocate }
      const currentQLocate = st === 'C' ? (qLocate[String(0)] || '') : ''
      const stopWords = new Set(['this','that','these','those','from','with','have','been','were','will','more','some','than','about','which','their','there','would','what','when','where','because','after','into','other','also','then','them','they','very','just','such','each','well','most','only','over','much','many','even','make','made','like','long','same','both','between','under','before','while','still','through','though','might','could','should','shall','first','second','third','last','next','another','being','doing','having','does'])
      const bStmtKeywords: string[] = []
      if (st === 'B') {
        for (let i = 0; i < (item.questions || []).length; i++) {
          const locate = qLocate[String(i)] || ''
          if (locate) {
            const letter = locate.charAt(0)
            const pi = letter.charCodeAt(0) - 'A'.charCodeAt(0)
            const paraText = (paras[pi] || '').replace(/^[A-Z][\)）]\s*/, '')
            const words = paraText.toLowerCase().split(/\W+/).filter(w => w.length >= 4 && !stopWords.has(w))
            const unique = [...new Set(words)].slice(0, 2)
            const kw = unique.join(', ')
            bStmtKeywords.push(kw.length > 16 ? kw.slice(0, 15) + '…' : kw)
          } else {
            bStmtKeywords.push('')
          }
        }
      }
      this.setData({
        current: item, currentQ: 0, passagePage: 0, passagePages: pages,
        formattedPages: [],
        blankAnswers: saved && saved.blankAnswers || {},
        usedFlags: saved && saved.usedFlags || [],
        activeBlank: null,
        bStmtPage: 0, bStmtPages: bPages,
        matchAnswers: matchSaved,
        activeStmt: null,
        availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].filter(l => !Object.values(matchSaved).includes(l)),
        cAnswers: cAnswerSaved,
        cSelIdx: (() => {
          const sl = cAnswerSaved[0]
          return sl ? 'ABCD'.indexOf(sl) : -1
        })(),
        submitted: isSubmitted,
        score: (saved && (saved as any).score) || 0,
        totalScore: maxScore,
        showResult: false,
        resultItems: [],
        showVocab: false,
        vocabList,
        scrollTop: 0,
        passageParas: paras,
        highlightedPara: -1,
        fullTranslation,
        showTrans: false,
        scrollToResult: '',
        showHint: false,
        locateMap,
        currentQLocate,
        bStmtKeywords,
        activeBlankHint: ''
      })
      this.updatePageParas()
      this.updateCompact()
    }
  },

  back() {
    if (this.data.examMode) { wx.navigateBack(); return }
    this.setData({ current: null, currentQ: 0, passagePage: 0, passagePages: [], submitted: false, score: 0, showResult: false, resultItems: [], showVocab: false, vocabList: [], passageParas: [], highlightedPara: -1, fullTranslation: '', showTrans: false, pageParas: [], pageWordSegments: [], scrollToResult: '' })
  },

  toggleVocab() {
    this.setData({ showVocab: !this.data.showVocab })
  },

  toggleTrans() {
    this.setData({ showTrans: !this.data.showTrans })
  },

  toggleHint() {
    const on = !this.data.showHint
    this.setData({ showHint: on, highlightedPara: on ? this.data.highlightedPara : -1 })
  },

  getBlankGrammarHint(num: string): string {
    const paras = this.data.passageParas
    const annot = readingAnnotations[this.data.current?.id || 0]
    const qHint = annot?.qHint || {}
    if (qHint[num]) return qHint[num]
    for (const para of paras) {
      const idx = para.indexOf(num)
      if (idx < 0) continue
      const before = para.slice(0, idx).trim().split(/\s+/)
      const b1 = before[before.length - 1]?.replace(/[^a-zA-Z]/g, '').toLowerCase() || ''
      if (['a', 'an'].includes(b1)) return '需要: 名词 (前面有 ' + b1 + ')'
      if (b1 === 'the') return '需要: 名词 (前面有 the)'
      if (['has', 'have', 'had'].includes(b1)) return '需要: 过去分词 (前面有 ' + b1 + ')'
      if (b1 === 'to') return '需要: 动词原形 (前面有 to)'
      if (['is', 'are', 'was', 'were', 'been', 'being', 'am', 'be'].includes(b1)) return '需要: 形容词或过去分词 (前面有 ' + b1 + ')'
      if (['more', 'most'].includes(b1)) return '需要: 形容词 (前面有 ' + b1 + ')'
      if (['very', 'quite', 'rather', 'extremely', 'highly', 'deeply'].includes(b1)) return '需要: 形容词 (前面有 ' + b1 + ')'
      if (['can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must'].includes(b1)) return '需要: 动词原形 (前面有情态动词 ' + b1 + ')'
      if (['of', 'for', 'in', 'on', 'at', 'by', 'with', 'from', 'about', 'into', 'during', 'since', 'without', 'between', 'under'].includes(b1)) return '需要: 名词 (前面有介词 ' + b1 + ')'
      if (['and'].includes(b1)) return '注意: 与前面并列，看前面词性'
      return '需要: 动词或名词 (根据上下文)'
    }
    return ''
  },

  onWordTap(e: WechatMiniprogram.TouchEvent) {
    const ds = e.currentTarget.dataset
    const word = (ds.word as string || '').toLowerCase().trim()
    const zh = ds.zh as string || ''
    if (!word || word.length < 2) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.vocabWords || []
    const already = existing.some((w: any) => w.word === word)
    if (already) {
      wx.showToast({ title: '已在单词本中', icon: 'none' })
      return
    }
    wx.showModal({
      title: word,
      content: zh || '暂无释义',
      showCancel: false,
      confirmText: '确认',
      success: () => {
        const vw = app.globalData.studyData.vocabWords || []
        vw.push({
          word,
          phonetic: '',
          definition: zh,
          source: this.data.current && this.data.current.title || '阅读理解',
          status: 'new',
          correctStreak: 0
        })
        app.globalData.studyData.vocabWords = vw
        wx.setStorageSync('studyData', app.globalData.studyData)
        wx.showToast({ title: '已加入单词本', icon: 'success' })
      }
    })
  },

  updatePageParas() {
    const paras = this.data.passageParas
    const page = this.data.passagePage
    const st = this.data.current && this.data.current.sectionType
    const step = st === 'B' ? 1 : 2
    const start = page * step
    const slice = paras.slice(start, start + step)
    const result = slice.map((text, i) => ({ text, paraIdx: start + i }))
    const vocab = readingAnnotations[this.data.current && this.data.current.id || 0] && readingAnnotations[this.data.current && this.data.current.id || 0].vocab || {}
    const segments: ISegment[] = []
    for (let i = 0; i < slice.length; i++) {
      const para = slice[i]
      const paraIdx = start + i
      if (st === 'A') {
        const re = /\b(\d{2})\b/g
        let last = 0, m: RegExpExecArray | null
        while ((m = re.exec(para)) !== null) {
          if (m.index > last) this.tokenizeToSegments(para.slice(last, m.index), segments, vocab, paraIdx)
          segments.push({ type: 'blank', text: m[1], num: m[1], word: m[1], paraIdx })
          last = re.lastIndex
        }
        if (last < para.length) this.tokenizeToSegments(para.slice(last), segments, vocab, paraIdx)
      } else {
        this.tokenizeToSegments(para, segments, vocab, paraIdx)
      }
    }
    this.setData({ pageParas: result, pageWordSegments: segments })
  },

  tokenizeToSegments(text: string, segs: ISegment[], vocab: Record<string, string>, paraIdx: number) {
    const tokens = text.split(/(\s+)/).filter((t: string) => t)
    for (const token of tokens) {
      const clean = token.replace(/[^a-zA-Z'-]+/g, '')
      if (clean.length >= 2 && /^[a-zA-Z]/.test(clean)) {
        const key = clean.toLowerCase()
        segs.push({ type: 'word', text: token, word: clean, zh: vocab[key] || '', paraIdx })
      } else {
        segs.push({ type: 'sep', text: token, paraIdx })
      }
    }
  },

  getPassageParas(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()
    const sentences = clean.split(/[.?!]\s*/).filter(s => s.trim().length > 5)
    const paras: string[] = []
    let currentPara = ''
    let count = 0
    const starters = ['however','but','while','in','the','although','according','as','despite','during','if','when','because','since','after','before','until','this','these','that','those','one','two','some','many','most','all','each','every','both','no','there','what','which','who','how','why','where']
    for (const s of sentences) {
      const first = s.trim().toLowerCase().split(/\s+/)[0] || ''
      const isNew = count > 0 && (starters.includes(first) || /^["""''']/.test(s.trim()))
      if (isNew || count >= 3) {
        if (currentPara) { paras.push(currentPara.trim() + '.'); currentPara = ''; count = 0 }
      }
      currentPara += (currentPara ? '. ' : '') + s.trim(); count++
    }
    if (currentPara) paras.push(currentPara.trim() + '.')
    return paras.length > 0 ? paras : [text]
  },

  // ===== Submission & Scoring =====

  checkAllAnswered(): boolean {
    const m = this.getMissingCount()
    return m.answered >= m.total
  },

  getMissingCount(): { total: number; answered: number } {
    const st = this.data.current && this.data.current.sectionType
    if (st === 'A') {
      const ba = this.data.blankAnswers
      const total = Object.keys(this.data.current && this.data.current.correctAnswers || {}).length
      return { total, answered: Object.keys(ba).length }
    }
    if (st === 'B') {
      const total = this.data.current && this.data.current.questions && this.data.current.questions.length || 0
      return { total, answered: Object.keys(this.data.matchAnswers).length }
    }
    if (st === 'C') {
      const total = this.data.current && this.data.current.questions && this.data.current.questions.length || 0
      return { total, answered: Object.keys(this.data.cAnswers).length }
    }
    return { total: 0, answered: 0 }
  },

  buildResult(): IResultItem[] {
    const item = this.data.current
    if (!item) return []
    const ca = item.correctAnswers || {}
    const annot = readingAnnotations[item.id]
    const results: IResultItem[] = []

    if (item.sectionType === 'A') {
      const ba = this.data.blankAnswers
      const sorted = Object.keys(ca).sort((a, b) => parseInt(a) - parseInt(b))
      for (const k of sorted) {
        const user = ba[k] || '(未填)'
        const correct = ca[k] || ''
        results.push({
          label: '第' + k + '空',
          userAnswer: user,
          correctAnswer: correct,
          isCorrect: user.toLowerCase().trim() === correct.toLowerCase().trim(),
          locate: annot && annot.qLocate && annot.qLocate[k] || '',
          hint: annot && annot.qHint && annot.qHint[k] || ''
        })
      }
    } else if (item.sectionType === 'B') {
      const ma = this.data.matchAnswers
      for (let i = 0; i < item.questions.length; i++) {
        const user = ma[i] || '(未匹配)'
        const ki = String(i + 36)
        results.push({
          label: '#' + ki,
          userAnswer: user,
          correctAnswer: ca[String(i)] || '',
          isCorrect: user === ca[String(i)],
          locate: annot && annot.qLocate && annot.qLocate[String(i)] || '',
          hint: annot && annot.qHint && annot.qHint[String(i)] || '',
          questionStem: item.questions[i] || ''
        })
      }
    } else if (item.sectionType === 'C') {
      const cAns = this.data.cAnswers
      const startNum = parseInt((item.questions[0] && item.questions[0].match(/^\d+/) || ['0'])[0])
      const choiceLabels = ['A', 'B', 'C', 'D']
      for (let i = 0; i < item.questions.length; i++) {
        const user = cAns[i] || '(未作答)'
        const correctLetter = ca[String(i)] || ''
        const userLetter = String(cAns[i] || '')
        results.push({
          label: 'Q' + (startNum + i),
          userAnswer: user,
          correctAnswer: correctLetter,
          isCorrect: userLetter === correctLetter,
          locate: annot && annot.qLocate && annot.qLocate[String(i)] || '',
          hint: annot && annot.qHint && annot.qHint[String(i)] || '',
          questionStem: item.questions[i] || '',
          allOptions: item.choices[i] || [],
          correctOptionIndex: choiceLabels.indexOf(correctLetter),
          userOptionIndex: choiceLabels.indexOf(userLetter)
        })
      }
    }
    return results
  },

  submit() {
    if (this.data.submitted) {
      wx.showToast({ title: '已提交过', icon: 'none' })
      return
    }
    const missing = this.getMissingCount()
    if (missing.total === 0) {
      wx.showToast({ title: '暂无题目可答', icon: 'none' })
      return
    }
    if (missing.answered < missing.total) {
      wx.showModal({
        title: '题目未答完',
        content: `已完成 ${missing.answered}/${missing.total}，还有 ${missing.total - missing.answered} 题未作答`,
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }
    const results = this.buildResult()
    const correctCount = results.filter(r => r.isCorrect).length
    const totalCount = results.length
    this.setData({
      submitted: true,
      score: correctCount,
      totalScore: totalCount,
      showResult: true,
      resultItems: results,
      scrollToResult: ''
    })

    const id = this.data.current && this.data.current.id
    if (id) {
      const app = getApp<IAppOption>()
      const existing = app.globalData.studyData.readingAnswers[id] || { blankAnswers: {}, usedFlags: [] }
      ;(existing as any).submitted = true
      ;(existing as any).score = correctCount
      ;(existing as any).totalScore = totalCount
      app.globalData.studyData.readingAnswers[id] = existing
      wx.setStorageSync('studyData', app.globalData.studyData)

      const map = { ...this.data.completionMap }
      map[id] = { submitted: true, score: correctCount, totalScore: totalCount }
      this.setData({ completionMap: map })
    }
    doCheckIn('reading')
  },

  hideResult() {
    this.setData({ showResult: false, highlightedPara: -1 })
  },

  showResultAgain() {
    this.setData({ showResult: true })
  },

  onShareAppMessage() {
    const s = this.data
    if (s.submitted && s.showResult) {
      return {
        title: `📖 阅读理解 ${s.score}/${s.totalScore} — 我在四级备考助手做题中！`,
        path: '/pages/reading/reading',
      }
    }
    return { title: '📖 四级备考助手 — 阅读理解', path: '/pages/reading/reading' }
  },

  jumpToParagraph(e: WechatMiniprogram.TouchEvent) {
    const locate = e.currentTarget.dataset.locate as string
    if (!locate) return
    const st = this.data.current && this.data.current.sectionType
    let paraIdx = -1
    if (st === 'B') {
      const letter = locate.charAt(0)
      paraIdx = letter.charCodeAt(0) - 'A'.charCodeAt(0)
    } else {
      const num = parseInt(locate.replace(/[^0-9]/g, ''))
      if (!isNaN(num)) paraIdx = num - 1
    }
    if (paraIdx < 0) return
    const page = st === 'B' ? paraIdx : Math.floor(paraIdx / 2)
    this.setData({
      passagePage: page,
      bStmtPage: 0,
      currentQ: 0,
      scrollTop: Date.now() % 100,
      highlightedPara: paraIdx
    })
    this.updatePageParas()
  },

  resetCurrent() {
    wx.showModal({
      title: '重新开始',
      content: '将清除当前篇目的所有答案和提交记录，确定重新开始吗？',
      success: (res) => {
        if (!res.confirm) return
        const id = this.data.current && this.data.current.id
        if (id) {
          const app = getApp<IAppOption>()
          delete app.globalData.studyData.readingAnswers[id]
          wx.setStorageSync('studyData', app.globalData.studyData)
          const map = { ...this.data.completionMap }
          delete map[id]
          this.setData({ completionMap: map })
        }
        this.setData({
          submitted: false, score: 0, showResult: false, resultItems: [],
          blankAnswers: {}, usedFlags: [], activeBlank: null,
          matchAnswers: {}, matchCount: 0, activeStmt: null,
          availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
          cAnswers: {}, cSelIdx: -1,
          highlightedPara: -1,
          scrollToResult: ''
        })
      }
    })
  },

  shareResult() {
    wx.showToast({ title: '点击右上角 … → 转发给朋友', icon: 'none' })
  },

  // ===== Section A =====

  splitPassage(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()
    const sentences = clean.split(/[.?!]\s*/).filter(s => s.trim().length > 5)
    const paras: string[] = []
    let currentPara = ''
    let count = 0
    const starters = ['however','but','while','in','the','although','according','as','despite','during','if','when','because','since','after','before','until','this','these','that','those','one','two','some','many','most','all','each','every','both','no','there','what','which','who','how','why','where']
    for (const s of sentences) {
      const first = s.trim().toLowerCase().split(/\s+/)[0] || ''
      const isNew = count > 0 && (starters.includes(first) || /^["""''']/.test(s.trim()))
      if (isNew || count >= 3) {
        if (currentPara) { paras.push(currentPara.trim() + '.'); currentPara = ''; count = 0 }
      }
      currentPara += (currentPara ? '. ' : '') + s.trim(); count++
    }
    if (currentPara) paras.push(currentPara.trim() + '.')
    const pages: string[] = []
    for (let i = 0; i < paras.length; i += 2) pages.push(paras.slice(i, i + 2).join('\n\n'))
    return pages.length > 0 ? pages : [text]
  },

  onBlankTap(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const num = e.currentTarget.dataset.num as string
    const ba = { ...this.data.blankAnswers }
    if (ba[num]) {
      const word = ba[num]
      delete ba[num]
      const used = [...this.data.usedFlags]
      const idx = this.data.current!.options.indexOf(word)
      if (idx > -1) used[idx] = false
      this.setData({ blankAnswers: ba, usedFlags: used, activeBlank: null, activeBlankHint: '' })
    } else {
      const newActive = this.data.activeBlank === num ? null : num
      const hint = newActive ? this.getBlankGrammarHint(num) : ''
      this.setData({ activeBlank: newActive, activeBlankHint: hint })
    }
    this.saveAnswers()
  },

  onOptionTap(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const idx = e.currentTarget.dataset.idx as number
    const word = this.data.current!.options[idx]
    const active = this.data.activeBlank
    if (!active) {
      wx.showToast({ title: '请先点击文章中要填入的空白编号', icon: 'none' })
      return
    }
    const ba = { ...this.data.blankAnswers }
    const used = [...this.data.usedFlags]
    for (const k of Object.keys(ba)) {
      if (ba[k] === word) { delete ba[k]; break }
    }
    if (ba[active]) {
      const old = ba[active]
      const oi = this.data.current!.options.indexOf(old)
      if (oi > -1) used[oi] = false
    }
    ba[active] = word
    used[idx] = true
    this.setData({ blankAnswers: ba, usedFlags: used, activeBlank: null })
    this.saveAnswers()
    wx.showToast({ title: '已填入 ' + word, icon: 'none' })
  },

  saveAnswers() {
    const id = this.data.current && this.data.current.id
    if (!id) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.readingAnswers[id] || {}
    app.globalData.studyData.readingAnswers[id] = {
      blankAnswers: { ...this.data.blankAnswers },
      usedFlags: [...this.data.usedFlags],
      matchAnswers: existing.matchAnswers || {},
      cAnswers: existing.cAnswers || {},
      ...(existing as any).submitted !== undefined ? { submitted: (existing as any).submitted, score: (existing as any).score, totalScore: (existing as any).totalScore } as any : {}
    }
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  // ===== Section C navigation =====

  prevQ() {
    if (this.data.currentQ > 0) {
      const q = this.data.currentQ - 1
      const sl = this.data.cAnswers[q]
      const locate = this.data.locateMap[String(q)] || ''
      this.setData({ currentQ: q, cSelIdx: sl ? 'ABCD'.indexOf(sl) : -1, currentQLocate: locate })
      this.updateCompact()
    }
  },
  nextQ() {
    const t = this.data.current && this.data.current.questions && this.data.current.questions.length || 0
    if (this.data.currentQ < t - 1) {
      const q = this.data.currentQ + 1
      const sl = this.data.cAnswers[q]
      const locate = this.data.locateMap[String(q)] || ''
      this.setData({ currentQ: q, cSelIdx: sl ? 'ABCD'.indexOf(sl) : -1, currentQLocate: locate })
      this.updateCompact()
    }
  },
  prevPassage() {
    if (this.data.passagePage > 0) {
      this.setData({ passagePage: this.data.passagePage - 1, highlightedPara: -1 })
      this.updatePageParas()
    }
  },
  nextPassage() {
    if (this.data.passagePage < this.data.passagePages.length - 1) {
      this.setData({ passagePage: this.data.passagePage + 1, highlightedPara: -1 })
      this.updatePageParas()
    }
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) { this.setData({ touchStartX: e.touches[0].clientX     })
  },

  scrollToResultItem(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as string
    if (!idx) return
    this.setData({ scrollToResult: 'r-' + idx })
  },
  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx > 50) this.prevPassage(); else if (dx < -50) this.nextPassage()
  },

  // ===== Section B =====

  formatBPassage(text: string): string[] {
    if (!text) return ['']
    const parts = text.split(/(?=[A-Z][\)）])/g).filter(s => s.trim())
    const pages: string[] = []
    for (let i = 0; i < parts.length; i++) pages.push(parts[i].trim())
    return pages.length > 0 ? pages : [text]
  },

  selectStmt(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const idx = parseInt(e.currentTarget.dataset.idx as string)
    this.setData({ activeStmt: this.data.activeStmt === idx ? null : idx })
  },

  assignLetter(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const letter = e.currentTarget.dataset.letter as string
    const stmt = this.data.activeStmt
    if (stmt === null) {
      wx.showToast({ title: '请先点击一条陈述', icon: 'none' })
      return
    }
    const ma = { ...this.data.matchAnswers }
    if (ma[stmt] === letter) { delete ma[stmt] }
    else { ma[stmt] = letter }
    const avail = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].filter(l => !Object.values(ma).includes(l))
    this.setData({ matchAnswers: ma, activeStmt: null, availLetters: avail, matchCount: Object.keys(ma).length })
    this.saveMatch()
  },

  removeMatch(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const idx = parseInt(e.currentTarget.dataset.idx as string)
    const ma = { ...this.data.matchAnswers }
    delete ma[idx]
    const avail = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].filter(l => !Object.values(ma).includes(l))
    this.setData({ matchAnswers: ma, availLetters: avail, matchCount: Object.keys(ma).length })
    this.saveMatch()
  },

  saveMatch() {
    const id = this.data.current && this.data.current.id
    if (!id) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.readingAnswers[id] || { blankAnswers: {}, usedFlags: [] }
    existing.matchAnswers = { ...this.data.matchAnswers }
    app.globalData.studyData.readingAnswers[id] = existing
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  // ===== Section C =====

  onChoiceTap(e: WechatMiniprogram.TouchEvent) {
    if (this.data.submitted) return
    const choice = e.currentTarget.dataset.letter as string
    if (!choice) return
    const idx = this.data.currentQ
    const ci = 'ABCD'.indexOf(choice)
    if (ci === -1) return
    const ca = { ...this.data.cAnswers }
    if (ca[idx] === choice) {
      delete ca[idx]
      this.setData({ cAnswers: ca, cSelIdx: -1 })
    } else {
      ca[idx] = choice
      this.setData({ cAnswers: ca, cSelIdx: ci })
    }
    this.saveCAnswer()
  },

  updateCompact() {
    const choices = this.data.current && this.data.current.choices && this.data.current.choices[this.data.currentQ]
    if (!choices || choices.length < 4) { this.setData({ compactOpts: false }); return }
    const allShort = choices.every((c: string) => c.length < 25)
    this.setData({ compactOpts: allShort })
  },

  saveCAnswer() {
    const id = this.data.current && this.data.current.id
    if (!id) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.readingAnswers[id] || { blankAnswers: {}, usedFlags: [] }
    existing.cAnswers = { ...this.data.cAnswers }
    app.globalData.studyData.readingAnswers[id] = existing
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (this.data.current && this.data.current.sectionType === 'B') {
      if (dx > 50 && this.data.bStmtPage > 0) this.setData({ bStmtPage: this.data.bStmtPage - 1 })
      else if (dx < -50 && this.data.bStmtPage < this.data.bStmtPages.length - 1) this.setData({ bStmtPage: this.data.bStmtPage + 1 })
    } else {
      if (dx > 50) this.prevQ()
      else if (dx < -50) this.nextQ()
    }
  },
})
