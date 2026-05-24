import readingsData from '../../../data/readings'
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
    this.setData({ passage: p, _pages: pages, _pageIdx: 0, _curSegs: pages[0] || [], _sel: ba, _used: used, _active: '' })
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
    const key = e.currentTarget.dataset.key
    this.setData({ _active: this.data._active === key ? '' : key })
  },

  onChipTap(e: any) {
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
