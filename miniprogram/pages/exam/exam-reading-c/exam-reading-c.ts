import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passage: null as any,
    currentQ: 0,
    _paraPages: [] as string[][],
    _paraPageIdx: 0,
    _curParas: [] as string[],
    _touchParaX: 0,
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
    const paras = splitIntoParas(p.passage || '')
    const paraPages = groupPages(paras, 2)
    this.setData({ passage: { ...p, _ans: ans, _ca: ca, _choices: choices }, _paraPages: paraPages, _paraPageIdx: 0, _curParas: paraPages[0] || [] })
  },

  onParaTouchStart(e: any) { this.data._touchParaX = e.touches[0].clientX },
  onParaTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data._touchParaX
    const pp = this.data._paraPages
    if (dx < -50 && this.data._paraPageIdx < pp.length - 1) {
      const idx = this.data._paraPageIdx + 1
      this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] })
    } else if (dx > 50 && this.data._paraPageIdx > 0) {
      const idx = this.data._paraPageIdx - 1
      this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] })
    }
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

function splitIntoParas(text: string): string[] {
  const sents = text.match(/[^.!?]+[.!?]+/g) || [text]
  const paras: string[] = []
  for (let i = 0; i < sents.length; i += 2) paras.push(sents.slice(i, i + 2).join('').trim())
  return paras.filter(Boolean)
}

function groupPages(items: string[], maxPerPage: number): string[][] {
  const pages: string[][] = []
  for (let i = 0; i < items.length; i += maxPerPage) pages.push(items.slice(i, i + maxPerPage))
  return pages
}
