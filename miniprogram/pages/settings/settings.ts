interface ISettingsData {
  listen: number
  sentence: number
  translation: number
  writing: number
}

interface ISettingsMethods {
  change(e: WechatMiniprogram.TouchEvent): void
}

Page<ISettingsData, ISettingsMethods>({
  data: {
    listen: 1,
    sentence: 5,
    translation: 1,
    writing: 1,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    const g = app.globalData.studyData.dailyGoal
    this.setData({ listen: g.listen, sentence: g.sentence, translation: g.translation, writing: g.writing })
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
})
