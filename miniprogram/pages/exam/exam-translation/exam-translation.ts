import translationsData from '../../../data/translations'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    item: null as any,
    answer: '',
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const translations = (translationsData as any[]).filter((t: any) => t && t.chinese)
    const item = translations.find((t: any) => t.source && t.source.includes('真题')) || translations[0] || null
    const saved = ((getApp<IAppOption>().globalData.studyData as any).translationAnswers || {})[item && item.id || 0] || ''
    this.setData({ item, answer: saved })
  },

  onInput(e: any) {
    this.setData({ answer: e.detail.value })
  },

  save() {
    if (!this.data.answer.trim()) { wx.showToast({ title: '请先翻译', icon: 'none' }); return }
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData as any
    if (!sd.translationAnswers) sd.translationAnswers = {}
    sd.translationAnswers[this.data.item && this.data.item.id || 0] = this.data.answer
    wx.setStorageSync('studyData', sd)
    wx.showToast({ title: '已保存', icon: 'success' })
    wx.navigateBack()
  },

  goBack() { wx.navigateBack() },
})
