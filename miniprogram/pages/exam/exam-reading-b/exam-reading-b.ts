import readingsData from '../../../data/readings'
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
    this.setData({
      passage: { ...p, _ans: ans, _ma: ans.matchAnswers || {} },
      _paraPages: paraPages,
      _paraPageIdx: 0,
      _curParas: paraPages[0] || [],
      _stmtPages: stmtPages,
      _stmtPageIdx: 0,
      _curStmts: stmtPages[0] || [],
      _stmtMax: stmtPages.length,
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
    const qi = Number(e.currentTarget.dataset.qi)
    this.setData({ activeStmt: this.data.activeStmt === qi ? -1 : qi })
  },

  onMatchLetter(e: any) {
    const val = e.currentTarget.dataset.val
    const qi = this.data.activeStmt
    if (qi < 0) { wx.showToast({ title: '请先点选一条陈述', icon: 'none' }); return }
    const p: any = this.data.passage
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
  const mid = Math.ceil(paras.length / 2)
  return [paras.slice(0, mid), paras.slice(mid)]
}

function splitBStmts(questions: string[]): { qi: number; q: string }[][] {
  const items = questions.map((q: string, qi: number) => ({ qi, q }))
  const pages: { qi: number; q: string }[][] = []
  for (let i = 0; i < items.length; i += 5) pages.push(items.slice(i, i + 5))
  return pages
}
