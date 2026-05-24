import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passage: null as any,
    activeStmt: -1,
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
    this.setData({ passage: { ...p, _ans: ans, _ma: ans.matchAnswers || {}, _paras: paras } })
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
  const parts = text.split(/(?=[A-N]）)/g)
  return parts.filter(Boolean).map(p => {
    const m = p.match(/^([A-N]）)/)
    return m ? { letter: m[1].replace('）', ''), text: p.slice(m[0].length).trim() } : { letter: '', text: p.trim() }
  })
}
