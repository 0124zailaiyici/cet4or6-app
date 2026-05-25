import readingsData from '../../../data/readings'
import readingAnnotations from '../../reading/reading_annotations'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passage: null as any,
    currentQ: 0,
    _paraPages: [] as string[][],
    _paraPageIdx: 0,
    _curParas: [] as string[],
    _touchParaX: 0,
    _submitted: false,
    showResult: false,
    _correctCount: 0,
    _totalCount: 0,
    _qResults: {} as Record<number, string>,
    _resultItems: [] as any[],
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
    let submitted = false, qResults: Record<number, string> = {}, resultItems: any[] = [], correctCount = 0
    if ((ans as any).submitted) {
      submitted = true
      const correct = p.correctAnswers || {}
      const annot = (readingAnnotations as any)[p.id]
      Object.keys(correct).forEach(k => {
        const qi = Number(k)
        const ua = ca[qi]
        const correctOption = (p.choices?.[qi] || []).find((ch: string) => ch.startsWith(correct[k])) || ''
        const isCorrect = ua === correctOption
        if (isCorrect) correctCount++
        qResults[qi] = isCorrect ? 'ok' : 'ko'
        const allOpts = (p.choices?.[qi] || []).map((ch: string) => ch)
        const correctIdx = allOpts.findIndex((ch: string) => ch.startsWith(correct[k]))
        const userIdx = ua ? allOpts.findIndex((ch: string) => ch === ua) : -1
        resultItems.push({ label: `Q${qi + 46}`, questionStem: (p.questions || [])[qi] || '', userAnswer: ua ? ua.slice(0, 1).toUpperCase() + ')' : '未选', correctAnswer: correct[k] + ')', isCorrect, allOptions: allOpts, correctOptionIndex: correctIdx, userOptionIndex: userIdx, locate: annot?.qLocate?.[String(qi)] || '', hint: annot?.qHint?.[String(qi)] || '' })
      })
    }
    this.setData({ passage: { ...p, _ans: ans, _ca: ca, _choices: choices }, _paraPages: paraPages, _paraPageIdx: 0, _curParas: paraPages[0] || [], _submitted: submitted, showResult: false, _correctCount: correctCount, _totalCount: Object.keys(p.correctAnswers || {}).length, _qResults: qResults, _resultItems: resultItems })
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
    if (this.data._submitted) return
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

  showResultAgain() { this.setData({ showResult: true }) },
  hideResult() { this.setData({ showResult: false }) },

  jumpToParagraph(e: any) {
    const loc = e.currentTarget.dataset.locate as string
    const pIdx = parseInt(loc.replace(/[^0-9]/g, '')) - 1
    let acc = 0
    const target = this.data._paraPages.findIndex((page: string[]) => { acc += page.length; return acc > pIdx })
    const pageIdx = Math.max(0, target < 0 ? this.data._paraPages.length - 1 : target)
    this.setData({ _paraPageIdx: pageIdx, _curParas: this.data._paraPages[pageIdx] || [] })
    wx.pageScrollTo({ selector: '.pass-zone', duration: 300, offsetTop: 80 })
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
