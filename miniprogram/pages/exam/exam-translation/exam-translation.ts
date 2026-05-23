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
    this.setData({ item: translations.find((t: any) => t.source?.includes('真题')) || translations[0] || null })
  },

  onInput(e: any) {
    this.setData({ answer: e.detail.value })
  },

  save() {
    if (!this.data.answer.trim()) { wx.showToast({ title: '请先翻译', icon: 'none' }); return }
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.translationRecords || []
    records.push({ id: this.data.item?.id || 0, userAnswer: this.data.answer, score: 0, date: new Date().toISOString() })
    app.globalData.studyData.translationRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    wx.navigateBack()
  },
})
