import readingsData from '../../../../data/readings'
import { applyTheme, getDarkMode } from '../../../../utils/theme'

Page({
  data: {
    passage: null as any,
    activeBlank: '',
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
    const blankKeys = Object.keys(p.correctAnswers)
    const usedFlags = (p.options || []).map((w: string) => Object.values(ba).includes(w))
    const pat = new RegExp('\\b(' + blankKeys.join('|') + ')\\b', 'g')
    const segs: any[] = []
    let lastIdx = 0, m: RegExpExecArray | null
    while ((m = pat.exec(p.passage)) !== null) {
      if (m.index > lastIdx) segs.push({ type: 'sep', text: p.passage.slice(lastIdx, m.index) })
      segs.push({ type: 'blank', num: m[1] })
      lastIdx = m.index + m[0].length
    }
    if (lastIdx < p.passage.length) segs.push({ type: 'sep', text: p.passage.slice(lastIdx) })
    this.setData({ passage: { ...p, _ans: ans, _ba: ba, _usedFlags: usedFlags, _segments: segs } })
  },

  refresh(id: number) {
    const app = getApp<IAppOption>()
    const ans = app.globalData.studyData.readingAnswers[id] || {}
    const p: any = { ...this.data.passage, _ans: ans, _ba: ans.blankAnswers || {} }
    p._usedFlags = (p.options || []).map((w: string) => Object.values(p._ba).includes(w))
    const blankKeys = Object.keys(p.correctAnswers)
    const pat = new RegExp('\\b(' + blankKeys.join('|') + ')\\b', 'g')
    const segs: any[] = []
    let lastIdx = 0, m: RegExpExecArray | null
    while ((m = pat.exec(p.passage)) !== null) {
      if (m.index > lastIdx) segs.push({ type: 'sep', text: p.passage.slice(lastIdx, m.index) })
      segs.push({ type: 'blank', num: m[1] })
      lastIdx = m.index + m[0].length
    }
    if (lastIdx < p.passage.length) segs.push({ type: 'sep', text: p.passage.slice(lastIdx) })
    p._segments = segs
    this.setData({ passage: p })
  },

  onBlankTap(e: any) {
    const key = e.currentTarget.dataset.key
    this.setData({ activeBlank: this.data.activeBlank === key ? '' : key })
  },

  onChipTap(e: any) {
    if (!this.data.activeBlank) { wx.showToast({ title: '请先在文章中点击一个空', icon: 'none' }); return }
    const word = e.currentTarget.dataset.word
    const key = this.data.activeBlank
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
    this.setData({ activeBlank: '' })
    this.refresh(p.id)
  },

  goBack() { wx.navigateBack() },
})
