import readingsData from '../../../../data/readings'
import { applyTheme, getDarkMode } from '../../../../utils/theme'

Page({
  data: {
    passage: null as any,
    currentQ: 0,
    darkMode: false,
    touchX: 0,
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
    const ca = ans.cAnswers || {}
    const choices = (p.questions || []).map((_: string, qi: number) => (p.choices && p.choices[qi]) ? p.choices[qi] : ['A','B','C','D'])
    this.setData({ passage: { ...p, _ans: ans, _ca: ca, _choices: choices } })
  },

  refresh(id: number) {
    const app = getApp<IAppOption>()
    const ans = app.globalData.studyData.readingAnswers[id] || {}
    const p: any = { ...this.data.passage, _ans: ans, _ca: ans.cAnswers || {} }
    this.setData({ passage: p })
  },

  onSelect(e: any) {
    const qi = Number(e.currentTarget.dataset.qi)
    const val = e.currentTarget.dataset.val
    const p: any = this.data.passage
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

  onTouchStart(e: any) { this.data.touchX = e.touches[0].clientX },
  onTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data.touchX
    const p: any = this.data.passage
    if (!p) return
    if (dx < -50 && this.data.currentQ < (p._choices?.length || 1) - 1) this.setData({ currentQ: this.data.currentQ + 1 })
    else if (dx > 50 && this.data.currentQ > 0) this.setData({ currentQ: this.data.currentQ - 1 })
  },

  goBack() { wx.navigateBack() },
})
