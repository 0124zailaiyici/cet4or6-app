Page({
  data: {
    current: 0,
    touchX: 0,
    pages: [
      { emoji: '🎧', title: '欢迎使用\n四级备考助手', desc: '一站式 CET-4 真题练习平台\n涵盖听力、阅读、翻译、写作四大模块' },
      { emoji: '📖', title: '真题导入', desc: '支持 PDF 真题一键导入\n自动解析听力、阅读、翻译\n配合 AI 批改精准提升' },
      { emoji: '🚀', title: '开始学习', desc: '设定每日目标，坚持打卡\n错题自动收集，薄弱点逐个击破' },
    ],
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({ touchX: e.touches[0].clientX })
  },

  onTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchX
    if (dx > 50 && this.data.current > 0) {
      this.setData({ current: this.data.current - 1 })
    } else if (dx < -50 && this.data.current < 2) {
      this.setData({ current: this.data.current + 1 })
    }
  },

  next() {
    if (this.data.current < 2) {
      this.setData({ current: this.data.current + 1 })
    } else {
      this.finish()
    }
  },

  skip() {
    this.finish()
  },

  finish() {
    wx.setStorageSync('hasGuided', true)
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
