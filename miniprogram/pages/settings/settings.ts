import { getDarkMode, toggleDarkMode } from '../../utils/theme'

interface ISettingsData {
  listen: number
  sentence: number
  translation: number
  writing: number
  darkMode: boolean
  version: string
  cacheSize: string  [key: string]: any

}

interface ISettingsMethods {
  change(e: WechatMiniprogram.TouchEvent): void
  toggleDark(): void
  clearCache(): void
  getCacheSize(): string
  goReminder(): void
  goFeedback(): void
  exportData(): void
  importData(): void  [key: string]: any

}

Page<ISettingsData, ISettingsMethods>({
  data: {
    listen: 1,
    sentence: 5,
    translation: 1,
    writing: 1,
    fsTitle: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['settings'] && getApp<IAppOption>().globalData.fontSizes['settings'].title || 16,
    body: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['settings'] && getApp<IAppOption>().globalData.fontSizes['settings'].body || 16,
    opt: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['settings'] && getApp<IAppOption>().globalData.fontSizes['settings'].opt || 16,
    btn: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['settings'] && getApp<IAppOption>().globalData.fontSizes['settings'].btn || 16,
    sm: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['settings'] && getApp<IAppOption>().globalData.fontSizes['settings'].sm || 16,

    fsOpen: false,

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
            vocabWords: [],
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

  exportData() {
    const app = getApp<IAppOption>()
    const json = JSON.stringify(app.globalData.studyData, null, 2)
    try {
      const fs = wx.getFileSystemManager()
      const fileName = `cet4_backup_${new Date().toISOString().slice(0, 10)}.txt`
      const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
      fs.writeFileSync(filePath, json, 'utf-8')
      ;(wx as any).shareFileMessage({ filePath, fileName })
      wx.showToast({ title: '发送备份到文件传输助手', icon: 'none' })
    } catch (e) {
      wx.setClipboardData({ data: json })
      wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
    }
  },

  importData() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: (res) => {
        const file = res.tempFiles[0]
        if (!file.name.endsWith('.json')) { wx.showToast({ title: '请选择 .json 文件', icon: 'none' }); return }
        try {
          const fs = wx.getFileSystemManager()
          const content = fs.readFileSync(file.path, 'utf-8')
          const data = JSON.parse(content as string)
          const app = getApp<IAppOption>()
          app.globalData.studyData = { ...app.globalData.studyData, ...data }
          wx.setStorageSync('studyData', app.globalData.studyData)
          wx.showToast({ title: '数据已恢复！', icon: 'success' })
        } catch (_) {
          wx.showToast({ title: '文件格式错误', icon: 'none' })
        }
      },
    })
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string || 'body'
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    const key = 'settings'
    const old = this.data[cat as keyof typeof this.data] as number || 16
    let v = Math.max(10, Math.min(28, old + d))
    this.setData({ [cat]: v })
    const app = getApp<IAppOption>()
    if (!app.globalData.fontSizes) app.globalData.fontSizes = {}
    if (!app.globalData.fontSizes[key]) app.globalData.fontSizes[key] = { title: 16, body: 16, opt: 16, btn: 16, sm: 16 }
    app.globalData.fontSizes[key][cat] = v
    wx.setStorageSync('fontSizes', app.globalData.fontSizes)
  },
})
