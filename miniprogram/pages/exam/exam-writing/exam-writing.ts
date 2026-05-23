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
    this.setData({ prompt: writings[0] || null })
  },

  onInput(e: any) {
    this.setData({ answer: e.detail.value })
  },

  save() {
    if (!this.data.answer.trim()) { wx.showToast({ title: '请先写内容', icon: 'none' }); return }
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords || []
    records.push({ id: this.data.prompt?.id || 0, score: 0, date: new Date().toISOString() })
    app.globalData.studyData.writingRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    wx.navigateBack()
  },
})
