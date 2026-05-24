import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

interface IRPassage {
  id: number; sectionType: string; passage: string; questions: string[]
  options: string[]; choices: string[][]; correctAnswers: Record<string, string>
}

Page({
  data: {
    passages: [] as any[],
    idx: 0,
    darkMode: false,
    letters: 'ABCDEFGHIJKLMN'.split(''),
    activeStmt: -1,
    activeBlank: '',
    touchStartX: 0,
    currentCQ: 0,
    bStmtPage: 0,
    passagePage: 0,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadPassages()
  },

  loadPassages() {
    const rData = readingsData as IRPassage[]
    const app = getApp<IAppOption>()
    const ids = (app.globalData.examSet === '2019062') ? rData.slice(4, 8).map(r => r.id) : rData.slice(0, 4).map(r => r.id)
    const passages = ids.map(id => {
      const p = rData.find(r => r.id === id)
      if (!p) return null
      return this.decorate(p, app.globalData.studyData.readingAnswers[id])
    }).filter(Boolean)
    this.setData({ passages })
  },

  decorate(p: IRPassage, raw: any) {
    const ans = raw || {}
    const r: any = { ...p, _ans: ans }

    const text = p.passage || ''
    const chunk = 600
    const pages: string[] = []
    for (let i = 0; i < text.length; i += chunk) pages.push(text.slice(i, i + chunk))
    if (pages.length === 0) pages.push('')
    r._passagePages = pages

    if (p.sectionType === 'A') {
      const ba = ans.blankAnswers || {}
      const blankKeys = Object.keys(p.correctAnswers)
      r._blankMap = ba
      r._chipUsed = (p.options || []).map((w: string) => Object.values(ba).includes(w))
      const pat = new RegExp('\\b(' + blankKeys.join('|') + ')\\b', 'g')
      const segs: any[] = []
      let lastIdx = 0, m: RegExpExecArray | null
      while ((m = pat.exec(text)) !== null) {
        if (m.index > lastIdx) segs.push({ type: 'sep', text: text.slice(lastIdx, m.index) })
        segs.push({ type: 'blank', num: m[1] })
        lastIdx = m.index + m[0].length
      }
      if (lastIdx < text.length) segs.push({ type: 'sep', text: text.slice(lastIdx) })
      const segPages: any[][] = []
      for (let i = 0; i < pages.length; i++) {
        const start = i * chunk
        const end = start + chunk
        segPages.push(segs.filter(s => {
          if (s.type === 'sep') {
            const sStart = text.indexOf(s.text)
            const sEnd = sStart + s.text.length
            return sEnd > start && sStart < end
          }
          if (s.type === 'blank') {
            const numRegex = new RegExp('\\b' + s.num + '\\b')
            const match = text.slice(start, end).match(numRegex)
            return !!match
          }
          return false
        }))
      }
      r._segPages = segPages
    }
    if (p.sectionType === 'B') {
      const qs = p.questions || []
      const perPage = 5
      const stmtPages: any[][] = []
      for (let i = 0; i < qs.length; i += perPage) stmtPages.push(qs.slice(i, i + perPage))
      r._bStmtPages = stmtPages
      r._matchAns = ans.matchAnswers || {}
    }
    if (p.sectionType === 'C') {
      r._cAns = ans.cAnswers || {}
      r._cqChoices = (p.questions || []).map((_, qi) => (p.choices && p.choices[qi]) ? p.choices[qi] : ['A','B','C','D'])
    }
    return r
  },

  refresh(id: number) {
    const app = getApp<IAppOption>()
    const passages = [...this.data.passages]
    const pi = passages.findIndex((p: any) => p.id === id)
    if (pi >= 0) passages[pi] = this.decorate(passages[pi], app.globalData.studyData.readingAnswers[id])
    this.setData({ passages })
  },

  onBlankTap(e: any) {
    const key = e.currentTarget.dataset.key
    this.setData({ activeBlank: this.data.activeBlank === key ? '' : key })
  },

  onChipTap(e: any) {
    if (!this.data.activeBlank) { wx.showToast({ title: '请先点击文章中的空', icon: 'none' }); return }
    const word = e.currentTarget.dataset.word
    const key = this.data.activeBlank
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ba = { ...ans.blankAnswers }
    const used = [...(ans.usedFlags || [])]
    const opts = p.options || []
    if (ba[key] === word) { delete ba[key]; const oi = opts.indexOf(word); if (oi >= 0) used[oi] = false }
    else {
      if (ba[key]) { const oi = opts.indexOf(ba[key]); if (oi >= 0) used[oi] = false }
      ba[key] = word; const oi = opts.indexOf(word); if (oi >= 0) used[oi] = true
    }
    ans = { ...ans, blankAnswers: ba, usedFlags: used }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ activeBlank: '' })
    this.refresh(p.id)
  },

  onSelectC(e: any) {
    const qi = Number(e.currentTarget.dataset.qi)
    const val = e.currentTarget.dataset.val
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ca = { ...(ans.cAnswers || {}) }
    if (ca[qi] === val) delete ca[qi]
    else ca[qi] = val
    ans = { ...ans, cAnswers: ca }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.refresh(p.id)
  },

  onSelectStmt(e: any) { this.setData({ activeStmt: Number(e.currentTarget.dataset.qi) }) },
  onMatchLetter(e: any) {
    const val = e.currentTarget.dataset.val
    const qi = this.data.activeStmt
    if (qi < 0) { wx.showToast({ title: '请先点选一条陈述', icon: 'none' }); return }
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ma = { ...(ans.matchAnswers || {}) }
    if (ma[qi] === val) delete ma[qi]
    else ma[qi] = val
    ans = { ...ans, matchAnswers: ma }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ activeStmt: -1 })
    this.refresh(p.id)
  },

  prev() { if (this.data.idx > 0) this.setData({ idx: this.data.idx - 1, activeStmt: -1, activeBlank: '', currentCQ: 0, bStmtPage: 0, passagePage: 0 }) },
  next() { if (this.data.idx < this.data.passages.length - 1) this.setData({ idx: this.data.idx + 1, activeStmt: -1, activeBlank: '', currentCQ: 0, bStmtPage: 0, passagePage: 0 }) },

  onTouchStart(e: any) { this.data.touchStartX = e.touches[0].clientX },
  onTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx > 50) this.prev()
    else if (dx < -50) this.next()
  },

  onPassTouchStart(e: any) { this.data.touchStartX = e.touches[0].clientX },
  onPassTouchEnd(e: any) {
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx < -50 && this.data.passagePage < (p._passagePages?.length || 1) - 1) this.setData({ passagePage: this.data.passagePage + 1 })
    else if (dx > 50 && this.data.passagePage > 0) this.setData({ passagePage: this.data.passagePage - 1 })
  },

  onBStmtTouchStart(e: any) { this.data.touchStartX = e.touches[0].clientX },
  onBStmtTouchEnd(e: any) {
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx < -50 && this.data.bStmtPage < (p._bStmtPages?.length || 1) - 1) this.setData({ bStmtPage: this.data.bStmtPage + 1 })
    else if (dx > 50 && this.data.bStmtPage > 0) this.setData({ bStmtPage: this.data.bStmtPage - 1 })
  },

  onCQTouchStart(e: any) { this.data.touchStartX = e.touches[0].clientX },
  onCQTouchEnd(e: any) {
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx < -50 && this.data.currentCQ < (p._cqChoices?.length || 1) - 1) this.setData({ currentCQ: this.data.currentCQ + 1 })
    else if (dx > 50 && this.data.currentCQ > 0) this.setData({ currentCQ: this.data.currentCQ - 1 })
  },

  goBack() { wx.navigateBack() },
})
