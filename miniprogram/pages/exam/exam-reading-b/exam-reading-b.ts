import readingsData from '../../../data/readings'
import readingAnnotations from '../../reading/reading_annotations'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passage: null as any,
    activeStmt: -1,
    _paraPages: [] as any[][],
    _paraPageIdx: 0,
    _curParas: [] as any[],
    _stmtPages: [] as { qi: number; q: string }[][],
    _stmtPageIdx: 0,
    _curStmts: [] as { qi: number; q: string }[],
    _stmtMax: 1,
    _touchX: 0,
    _touchStmtX: 0,
    _submitted: false,
    showResult: false,
    _correctCount: 0,
    _totalCount: 0,
    _stmtResults: {} as Record<number, string>,
    _letterResults: {} as Record<string, string>,
    _resultItems: [] as any[],
    _availLetters: [] as string[],
    _scrollToResult: '',
    darkMode: false,
    letters: 'ABCDEFGHIJKLMN'.split(''),
  },

  onLoad(opts: any) {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const id = Number(opts.id)
    const rData = readingsData as any[]
    const p = rData.find((r: any) => r.id === id)
    if (!p) return
    const app = getApp<IAppOption>()
    const ans = app.globalData.studyData.readingAnswers[id] || {}
    const paras = fmtBPassage(p.passage || '')
    const paraPages = splitBParas(paras)
    const stmtPages = splitBStmts(p.questions || [])
    let submitted = false, stmtResults: Record<number, string> = {}, letterResults: Record<string, string> = {}, resultItems: any[] = [], correctCount = 0
    const ma = ans.matchAnswers || {}
    if ((ans as any).submitted) {
      submitted = true
      const ca = p.correctAnswers || {}
      const annot = (readingAnnotations as any)[p.id]
      Object.keys(ca).forEach(k => {
        const qi = Number(k)
        const ua = ma[qi]
        const isCorrect = ua === ca[k]
        if (isCorrect) correctCount++
        stmtResults[qi] = isCorrect ? 'ok' : 'ko'
        const correctLetter = ca[k]
        if (!letterResults[correctLetter] || letterResults[correctLetter] === 'ok') letterResults[correctLetter] = 'ok'
        if (ua && ua !== correctLetter) letterResults[ua] = 'ko'
        resultItems.push({ label: `#${qi + 36}`, questionStem: (p.questions || [])[qi] || '', userAnswer: ua || '未选', correctAnswer: `第${correctLetter}段`, isCorrect, locate: annot && annot.qLocate && annot.qLocate[String(qi)] || '', hint: annot && annot.qHint && annot.qHint[String(qi)] || '' })
      })
    }
    const avail = this.data.letters.filter((l: string) => !Object.values(ma).includes(l))
    this.setData({
      passage: { ...p, _ans: ans, _ma: ma },
      _paraPages: paraPages,
      _paraPageIdx: 0,
      _curParas: paraPages[0] || [],
      _stmtPages: stmtPages,
      _stmtPageIdx: 0,
      _curStmts: stmtPages[0] || [],
      _stmtMax: stmtPages.length,
      _submitted: submitted,
      showResult: false,
      _correctCount: correctCount,
      _totalCount: Object.keys(p.correctAnswers || {}).length,
      _stmtResults: stmtResults,
      _letterResults: letterResults,
      _resultItems: resultItems,
      _availLetters: avail,
    })
  },

  onTouchStart(e: any) { this.data._touchX = e.touches[0].clientX },
  onTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data._touchX
    const pp = this.data._paraPages
    if (dx < -50 && this.data._paraPageIdx < pp.length - 1) {
      const idx = this.data._paraPageIdx + 1
      this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] })
    } else if (dx > 50 && this.data._paraPageIdx > 0) {
      const idx = this.data._paraPageIdx - 1
      this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] })
    }
  },

  onStmtTouchStart(e: any) { this.data._touchStmtX = e.touches[0].clientX },
  onStmtTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data._touchStmtX
    const sp = this.data._stmtPages
    if (dx < -50 && this.data._stmtPageIdx < sp.length - 1) {
      const idx = this.data._stmtPageIdx + 1
      this.setData({ _stmtPageIdx: idx, _curStmts: sp[idx] || [] })
    } else if (dx > 50 && this.data._stmtPageIdx > 0) {
      const idx = this.data._stmtPageIdx - 1
      this.setData({ _stmtPageIdx: idx, _curStmts: sp[idx] || [] })
    }
  },

  refresh(id: number) {
    const app = getApp<IAppOption>()
    const ans = app.globalData.studyData.readingAnswers[id] || {}
    const p: any = { ...this.data.passage, _ans: ans, _ma: ans.matchAnswers || {} }
    this.setData({ passage: p })
  },

  onSelectStmt(e: any) {
    if (this.data._submitted) return
    const qi = Number(e.currentTarget.dataset.qi)
    this.setData({ activeStmt: this.data.activeStmt === qi ? -1 : qi })
  },

  showResultAgain() { this.setData({ showResult: true }) },
  hideResult() { this.setData({ showResult: false }) },

  removeMatch(e: any) {
    if (this.data._submitted) return
    const idx = Number(e.currentTarget.dataset.idx)
    const p: any = this.data.passage
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ma = { ...(ans.matchAnswers || {}) }
    delete ma[idx]
    const avail = this.data.letters.filter((l: string) => !Object.values(ma).includes(l))
    ans = { ...ans, matchAnswers: ma }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ _availLetters: avail })
    this.refresh(p.id)
  },

  onMatchLetter(e: any) {
    if (this.data._submitted) return
    const val = e.currentTarget.dataset.val
    const qi = this.data.activeStmt
    if (qi < 0) { wx.showToast({ title: '请先点选一条陈述', icon: 'none' }); return }
    const p: any = this.data.passage
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ma = { ...(ans.matchAnswers || {}) }
    if (ma[qi] === val) { delete ma[qi] }
    else {
      Object.keys(ma).forEach(k => { if (ma[Number(k)] === val) delete ma[Number(k)] })
      ma[qi] = val
    }
    const avail = this.data.letters.filter((l: string) => !Object.values(ma).includes(l))
    ans = { ...ans, matchAnswers: ma }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ activeStmt: -1, _availLetters: avail })
    this.refresh(p.id)
  },

  jumpToParagraph(e: any) {
    const loc = e.currentTarget.dataset.locate as string
    const letter = loc.replace(/[段\s]/g, '')
    const paras = this.data._paraPages
    const target = paras.findIndex((page: any[]) => page.some((para: any) => para.letter === letter))
    if (target >= 0) this.setData({ _paraPageIdx: target, _curParas: paras[target] || [] })
  },
  scrollToResultItem(e: any) {
    this.setData({ _scrollToResult: 'r-' + e.currentTarget.dataset.idx })
  },

  goBack() { wx.navigateBack() },
})

function fmtBPassage(text: string): { letter: string; text: string }[] {
  const parts = text.split(/(?=[A-N][)）])/g)
  return parts.filter(Boolean).map(p => {
    const m = p.match(/^([A-N][)）])/)
    return m ? { letter: m[1].replace(/[)）]/, ''), text: p.slice(m[0].length).trim() } : { letter: '', text: p.trim() }
  })
}

function splitBParas(paras: { letter: string; text: string }[]): any[][] {
  const pages: any[][] = []
  for (let i = 0; i < paras.length; i += 2) pages.push(paras.slice(i, i + 2))
  return pages
}

function splitBStmts(questions: string[]): { qi: number; q: string }[][] {
  const items = questions.map((q: string, qi: number) => ({ qi, q }))
  const pages: { qi: number; q: string }[][] = []
  for (let i = 0; i < items.length; i += 5) pages.push(items.slice(i, i + 5))
  return pages
}
