import { applyTheme, getDarkMode } from '../../utils/theme'

Page({
  data: {
    fbType: '功能异常',
    fbText: '',
    types: ['功能异常', '功能建议', '体验评价', '其他'],
    fsTitle: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['feedback'] && getApp<IAppOption>().globalData.fontSizes['feedback'].title || 20,
    body: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['feedback'] && getApp<IAppOption>().globalData.fontSizes['feedback'].body || 18,
    opt: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['feedback'] && getApp<IAppOption>().globalData.fontSizes['feedback'].opt || 17,
    btn: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['feedback'] && getApp<IAppOption>().globalData.fontSizes['feedback'].btn || 19,
    sm: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['feedback'] && getApp<IAppOption>().globalData.fontSizes['feedback'].sm || 15,

    fsOpen: false,

    darkMode: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
  },

  setType(e: WechatMiniprogram.TouchEvent) {
    this.setData({ fbType: e.currentTarget.dataset.type as string })
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ fbText: e.detail.value })
  },

  submit() {
    if (!this.data.fbText.trim()) {
      wx.showToast({ title: '请输入反馈内容', icon: 'none' })
      return
    }
    const app = getApp<IAppOption>()
    const info = {
      type: this.data.fbType,
      text: this.data.fbText.trim(),
      time: new Date().toISOString(),
      version: app.globalData.studyData ? '1.0.0' : '1.0.0',
    }
    const list = wx.getStorageSync('feedbackList') || []
    list.push(info)
    wx.setStorageSync('feedbackList', list)
    this.setData({ fbText: '' })
    wx.showToast({ title: '感谢反馈！', icon: 'success' })
  },

  openPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视你的隐私。\n\n1. 学习数据仅存储在手机本地（wx.setStorageSync），不会上传至任何服务器。\n2. AI 评分功能仅在手动开启后，通过本地代理服务器调用，中间传输不记录你的输入内容。\n3. 我们不收集任何个人信息（手机号、微信 ID、位置等）。\n4. 清除缓存或卸载应用会删除所有本地数据。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  openTerms() {
    wx.showModal({
      title: '用户协议',
      content: '使用即表示同意以下条款：\n\n1. 本应用仅供个人学习使用，不得用于商业用途。\n2. 所有真题内容版权归教育部考试中心及原作者所有。\n3. AI 评分仅供参考，不构成考试评分依据。\n4. 应用中的建议和学习计划不保证考试结果。\n5. 我们保留更新协议的权利，更新后继续使用即视为同意。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string || 'body'
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    const key = 'feedback'
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
