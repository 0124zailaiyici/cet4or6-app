import { applyTheme, getDarkMode } from '../../utils/theme'

Page({
  data: {
    fbType: '功能异常',
    fbText: '',
    types: ['功能异常', '功能建议', '体验评价', '其他'],
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
      content: '我们重视你的隐私。学习数据仅存储在本地设备，不上传至服务器。AI 功能仅在启用时通过本地代理调用，不存储你的输入内容。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },

  openTerms() {
    wx.showModal({
      title: '用户协议',
      content: '本应用仅供学习使用。所有真题内容版权归原作者所有。AI 评分仅供参考，不作为考试评分依据。',
      showCancel: false,
      confirmText: '我知道了',
    })
  },
})
