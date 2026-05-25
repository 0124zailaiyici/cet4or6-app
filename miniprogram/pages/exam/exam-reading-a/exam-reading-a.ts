import readingsData from '../../../data/readings'
import readingAnnotations from '../../reading/reading_annotations'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passage: null as any,
    _pages: [] as any[][],
    _pageIdx: 0,
    _curSegs: [] as any[],
    _sel: {} as Record<string, string>,
    _used: [] as boolean[],
    _active: '',
    _touchX: 0,
    _submitted: false,
    showResult: false,
    _correctCount: 0,
    _totalCount: 0,
    _blankResults: {} as Record<string, string>,
    _optionResults: [] as string[],
    _resultItems: [] as any[],
    _letters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'],
    darkMode: false,
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
    const ba = ans.blankAnswers || {}
    const used = (p.options || []).map((w: string) => Object.values(ba).includes(w))
    const segs = parseSegments(p.passage || '', Object.keys(p.correctAnswers))
    const pages = splitPages(segs)
    let submitted = false, blankResults: Record<string, string> = {}, optionResults: string[] = [], resultItems: any[] = [], correctCount = 0
    if ((ans as any).submitted) {
      submitted = true
      const ca = p.correctAnswers || {}
      const opts = p.options || []
      const annot = (readingAnnotations as any)[p.id]
      Object.keys(ca).forEach(k => {
        const ua = ba[k]
        const isCorrect = ua === ca[k]
        if (isCorrect) correctCount++
        blankResults[k] = isCorrect ? 'ok' : 'ko'
        resultItems.push({ label: `第${k}空`, userAnswer: ua || '未填', correctAnswer: ca[k], isCorrect, locate: annot?.qLocate?.[k] || '', hint: annot?.qHint?.[k] || '' })
      })
      optionResults = opts.map((w: string) => {
        const isCorrect = Object.values(ca).includes(w)
        const isUsed = Object.values(ba).includes(w)
        if (isUsed && !isCorrect) return 'ko'
        if (isUsed && isCorrect) return 'ok'
        if (isCorrect) return 'ok'
        return ''
      })
    }
    this.setData({ passage: p, _pages: pages, _pageIdx: 0, _curSegs: pages[0] || [], _sel: ba, _used: used, _active: '', _submitted: submitted, showResult: false, _correctCount: correctCount, _totalCount: Object.keys(p.correctAnswers || {}).length, _blankResults: blankResults, _optionResults: optionResults, _resultItems: resultItems })
  },

  onTouchStart(e: any) { this.data._touchX = e.touches[0].clientX },
  onTouchEnd(e: any) {
    const dx = e.changedTouches[0].clientX - this.data._touchX
    const pages = this.data._pages
    if (dx < -50 && this.data._pageIdx < pages.length - 1) {
      const idx = this.data._pageIdx + 1
      this.setData({ _pageIdx: idx, _curSegs: pages[idx] || [] })
    } else if (dx > 50 && this.data._pageIdx > 0) {
      const idx = this.data._pageIdx - 1
      this.setData({ _pageIdx: idx, _curSegs: pages[idx] || [] })
    }
  },

  onBlankTap(e: any) {
    if (this.data._submitted) return
    const key = e.currentTarget.dataset.key
    this.setData({ _active: this.data._active === key ? '' : key })
  },

  onChipTap(e: any) {
    if (this.data._submitted) return
    if (!this.data._active) { wx.showToast({ title: '请先在文章中点击一个空', icon: 'none' }); return }
    const word = e.currentTarget.dataset.word
    const key = this.data._active
    const p: any = this.data.passage
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
    const newFlags = (opts || []).map((w: string) => Object.values(ba).includes(w))
    const segs = parseSegments(p.passage || '', Object.keys(p.correctAnswers))
    const pages = splitPages(segs)
    this.setData({ _active: '', _sel: ba, _used: newFlags, _pages: pages, _curSegs: pages[this.data._pageIdx] || [] })
  },

  showResultAgain() { this.setData({ showResult: true }) },
  hideResult() { this.setData({ showResult: false }) },

  jumpToParagraph(e: any) {
    const loc = e.currentTarget.dataset.locate as string
    const pIdx = parseInt(loc.replace(/[^0-9]/g, '')) - 1
    const target = Math.min(pIdx, this.data._pages.length - 1)
    this.setData({ _pageIdx: target, _curSegs: this.data._pages[target] || [] })
    wx.pageScrollTo({ selector: '.pass-zone', duration: 300, offsetTop: 80 })
  },

  goBack() { wx.navigateBack() },
})

function parseSegments(text: string, keys: string[]): any[] {
  const pat = new RegExp('\\b(' + keys.join('|') + ')\\b', 'g')
  const segs: any[] = []
  let last = 0, m: RegExpExecArray | null
  while ((m = pat.exec(text)) !== null) {
    if (m.index > last) segs.push({ type: 'sep', text: text.slice(last, m.index) })
    segs.push({ type: 'blank', num: m[1] })
    last = m.index + m[0].length
  }
  if (last < text.length) segs.push({ type: 'sep', text: text.slice(last) })
  return segs
}

function splitPages(segs: any[]): any[][] {
  const total = segs.reduce((s: number, seg: any) => s + (seg.text?.length || 1), 0)
  const mid = Math.ceil(total / 2)
  let acc = 0
  for (let i = 0; i < segs.length; i++) {
    acc += segs[i].text?.length || 1
    if (acc >= mid && i > 1) return [segs.slice(0, i), segs.slice(i)]
  }
  return [segs]
}
