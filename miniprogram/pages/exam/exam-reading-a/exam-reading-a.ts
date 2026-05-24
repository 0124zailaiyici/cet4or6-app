import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

const OPT = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O']

Page({
  data: {
    passage: null as any,
    _segments: [] as any[],
    _sel: {} as Record<string, string>,
    _used: [] as boolean[],
    _active: '',
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
    const segs = parseSegments(p.passage || '', Object.keys(p.correctAnswers), ba)
    this.setData({ passage: p, _segments: segs, _sel: ba, _used: used, _active: '' })
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
    const segs = parseSegments(p.passage || '', Object.keys(p.correctAnswers), ba)
    this.setData({ _active: '', _sel: ba, _used: newFlags, _segments: segs })
  },

  goBack() { wx.navigateBack() },
})

function parseSegments(text: string, keys: string[], sel: Record<string, string>): any[] {
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
