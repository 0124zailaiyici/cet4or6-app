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
    if (p.sectionType === 'A') {
      const ba = ans.blankAnswers || {}
      const flags = (p.options || []).map((w: string) => Object.values(ba).includes(w))
      r._firstKey = Object.keys(p.correctAnswers)[0] || ''
      r._chipUsed = flags
      r._selBlank = ba
    }
    if (p.sectionType === 'B') {
      r._matchAns = ans.matchAnswers || {}
    }
    if (p.sectionType === 'C') {
      r._cAns = ans.cAnswers || {}
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

  saveAns(id: number, key: string, val: any) {
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[id] || { blankAnswers: {}, usedFlags: [] }
    ans[key] = val
    app.globalData.studyData.readingAnswers[id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.refresh(id)
  },

  onBlankTap(e: any) {
    const key = e.currentTarget.dataset.key
    const word = e.currentTarget.dataset.word
    const p: any = this.data.passages[this.data.idx]
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ba = { ...(ans.blankAnswers || {}) }
    const used = [...(ans.usedFlags || [])]
    const opts = p.options || []
    if (ba[key] === word) {
      delete ba[key]
      const oi = opts.indexOf(word); if (oi >= 0) used[oi] = false
    } else {
      if (ba[key]) { const oi = opts.indexOf(ba[key]); if (oi >= 0) used[oi] = false }
      ba[key] = word
      const oi = opts.indexOf(word); if (oi >= 0) used[oi] = true
    }
    ans = { ...ans, blankAnswers: ba, usedFlags: used }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
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
    this.saveAns(p.id, 'cAnswers', ca)
  },

  onSelectStmt(e: any) {
    this.setData({ activeStmt: Number(e.currentTarget.dataset.qi) })
  },

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
    this.saveAns(p.id, 'matchAnswers', ma)
    this.setData({ activeStmt: -1 })
  },

  prev() { if (this.data.idx > 0) this.setData({ idx: this.data.idx - 1, activeStmt: -1 }) },
  next() { if (this.data.idx < this.data.passages.length - 1) this.setData({ idx: this.data.idx + 1, activeStmt: -1 }) },
  goBack() { wx.navigateBack() },
})
