import writingsData from '../../../data/writings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    prompt: null as any,
    answer: '',
    fs: getApp<IAppOption>().globalData.fontSize || 16,

    fsOpen: false,

    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ fs: getApp<IAppOption>().globalData.fontSize || 16,
 fsOpen: false,
 darkMode: getDarkMode() })
    const writings = writingsData as any[]
    const prompt = writings[0] || null
    const saved = ((getApp<IAppOption>().globalData.studyData as any).writingAnswers || {})[prompt && prompt.id || 0] || ''
    this.setData({ prompt, answer: saved })
  },

  onInput(e: any) {
    this.setData({ answer: e.detail.value })
  },

  save() {
    if (!this.data.answer.trim()) { wx.showToast({ title: '请先写内容', icon: 'none' }); return }
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData as any
    if (!sd.writingAnswers) sd.writingAnswers = {}
    sd.writingAnswers[this.data.prompt && this.data.prompt.id || 0] = this.data.answer
    wx.setStorageSync('studyData', sd)
    wx.showToast({ title: '已保存', icon: 'success' })
    wx.navigateBack()
  },

  goBack() { wx.navigateBack() },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    let v = Math.max(12, Math.min(26, this.data.fs + d))
    this.setData({ fs: v })
    const app = getApp<IAppOption>()
    app.globalData.fontSize = v
    wx.setStorageSync('fontSize', v)
  },
})
