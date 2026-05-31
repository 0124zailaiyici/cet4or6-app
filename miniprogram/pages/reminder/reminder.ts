import { applyTheme, getDarkMode } from '../../utils/theme'

Page({
  data: {
    morningTime: '7:30',
    eveningTime: '21:00',
    morningTimes: ['7:00', '7:30', '8:00', '8:30'],
    eveningTimes: ['19:00', '20:00', '21:00', '22:00'],
    morningSub: false,
    eveningSub: false,
    weeklySub: false,
    fsTitle: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['reminder'] && getApp<IAppOption>().globalData.fontSizes['reminder'].title || 16,
    body: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['reminder'] && getApp<IAppOption>().globalData.fontSizes['reminder'].body || 16,
    opt: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['reminder'] && getApp<IAppOption>().globalData.fontSizes['reminder'].opt || 16,
    btn: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['reminder'] && getApp<IAppOption>().globalData.fontSizes['reminder'].btn || 16,
    sm: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['reminder'] && getApp<IAppOption>().globalData.fontSizes['reminder'].sm || 16,

    fsOpen: false,

    darkMode: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
  },

  toggleMorning() {
    if (!this.data.morningSub) {
      wx.showToast({ title: '已订阅晨间提醒', icon: 'success' })
    }
    this.setData({ morningSub: !this.data.morningSub })
  },
  toggleEvening() {
    if (!this.data.eveningSub) {
      wx.showToast({ title: '已订阅晚间提醒', icon: 'success' })
    }
    this.setData({ eveningSub: !this.data.eveningSub })
  },
  toggleWeekly() {
    if (!this.data.weeklySub) {
      wx.showToast({ title: '已订阅学习周报', icon: 'success' })
    }
    this.setData({ weeklySub: !this.data.weeklySub })
  },
  setMorningTime(e: WechatMiniprogram.TouchEvent) {
    this.setData({ morningTime: e.currentTarget.dataset.time as string })
    wx.showToast({ title: '已设为 ' + (e.currentTarget.dataset.time as string), icon: 'none' })
  },
  setEveningTime(e: WechatMiniprogram.TouchEvent) {
    this.setData({ eveningTime: e.currentTarget.dataset.time as string })
    wx.showToast({ title: '已设为 ' + (e.currentTarget.dataset.time as string), icon: 'none' })
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string || 'body'
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    const key = 'reminder'
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
