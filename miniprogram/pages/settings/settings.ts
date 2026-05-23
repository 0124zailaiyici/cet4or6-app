import { getDarkMode, toggleDarkMode } from '../../utils/theme'

interface ISettingsData {
  listen: number
  sentence: number
  translation: number
  writing: number
  darkMode: boolean
  version: string
  cacheSize: string
}

interface ISettingsMethods {
  change(e: WechatMiniprogram.TouchEvent): void
  toggleDark(): void
  clearCache(): void
  getCacheSize(): string
  goReminder(): void
  goFeedback(): void
}

Page<ISettingsData, ISettingsMethods>({
  data: {
    listen: 1,
    sentence: 5,
    translation: 1,
    writing: 1,
    darkMode: false,
    version: '1.0.0',
    cacheSize: '',
  },

  onLoad() {
    const app = getApp<IAppOption>()
    const g = app.globalData.studyData.dailyGoal
    this.setData({
      listen: g.listen, sentence: g.sentence, translation: g.translation, writing: g.writing,
      darkMode: getDarkMode(),
      cacheSize: this.getCacheSize(),
    })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode() })
  },

  change(e: WechatMiniprogram.TouchEvent) {
    const field = e.currentTarget.dataset.field as string
    const delta = Number(e.currentTarget.dataset.delta)
    const key = field as 'listen' | 'sentence' | 'translation' | 'writing'
    const val = Math.max(0, this.data[key] + delta)

    const app = getApp<IAppOption>()
    app.globalData.studyData.dailyGoal[key] = val
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ [key]: val })
  },

  toggleDark() {
    const newVal = toggleDarkMode()
    this.setData({ darkMode: newVal })
    wx.showToast({ title: newVal ? '已切换暗黑模式' : '已切换浅色模式', icon: 'none' })
  },

  getCacheSize(): string {
    try {
      const info = wx.getStorageInfoSync()
      const kb = Math.round(info.currentSize)
      return kb > 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`
    } catch (_) {
      return ''
    }
  },

  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除所有学习记录和数据，此操作不可撤销。',
      confirmText: '确认清除',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync()
          } catch (_) {}
          const app = getApp<IAppOption>()
          app.globalData.studyData = {
            completedListens: [],
            masteredSentences: [],
            translationRecords: [],
            writingRecords: [],
            checkInDates: [],
            favoriteSentenceIds: [],
            hardSentences: [],
            readingAnswers: {},
            listeningAnswers: {},
            todayActivity: { date: '', listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 },
            dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 },
          }
          wx.setStorageSync('studyData', app.globalData.studyData)
          wx.setStorageSync('darkMode', false)
          this.setData({ cacheSize: '0KB', listen: 1, sentence: 5, translation: 1, writing: 1, darkMode: false })
          wx.showToast({ title: '已清除所有数据', icon: 'success' })
        }
      },
    })
  },

  goReminder() {
    wx.navigateTo({ url: '/pages/reminder/reminder' })
  },

  goFeedback() {
    wx.navigateTo({ url: '/pages/feedback/feedback' })
  },
})
