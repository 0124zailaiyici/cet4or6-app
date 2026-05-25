import writingsData from '../../../data/writings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    prompt: null as any,
    answer: '',
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const writings = writingsData as any[]
    const prompt = writings[0] || null
    const saved = ((getApp<IAppOption>().globalData.studyData as any).writingAnswers || {})[prompt?.id || 0] || ''
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
    sd.writingAnswers[this.data.prompt?.id || 0] = this.data.answer
    wx.setStorageSync('studyData', sd)
    wx.showToast({ title: '已保存', icon: 'success' })
    wx.navigateBack()
  },

  goBack() { wx.navigateBack() },
})
