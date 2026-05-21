import { getDarkMode, toggleDarkMode } from '../../utils/theme'

interface ISettingsData {
  listen: number
  sentence: number
  translation: number
  writing: number
  darkMode: boolean
}

interface ISettingsMethods {
  change(e: WechatMiniprogram.TouchEvent): void
  toggleDark(): void
}

Page<ISettingsData, ISettingsMethods>({
  data: {
    listen: 1,
    sentence: 5,
    translation: 1,
    writing: 1,
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    const g = app.globalData.studyData.dailyGoal
    this.setData({
      listen: g.listen, sentence: g.sentence, translation: g.translation, writing: g.writing,
      darkMode: getDarkMode(),
    })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode() })
  },

  change(e: WechatMiniprogram.TouchEvent) {
    const field = e.currentTarget.dataset.field as string
    const delta = e.currentTarget.dataset.delta as number
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
})
