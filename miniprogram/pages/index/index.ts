import { doCheckIn, calcStreak, isCheckedInToday } from '../../utils/checkin'

interface IModuleItem {
  id: string
  title: string
  icon: string
  desc: string
  url: string
  count: number
  color: string
}

interface IHomeData {
  modules: IModuleItem[]
  todayStats: {
    listened: number
    sentences: number
    translations: number
    writings: number
    total: number
  }
  greeting: string
  checkedIn: boolean
  streak: number
}

interface IHomeMethods {
  goTo(e: WechatMiniprogram.TouchEvent): void
  handleCheckIn(): void
  refresh(): void
}

Page<IHomeData, IHomeMethods>({
  data: {
    modules: [
      { id: 'listening', title: '听力精听', icon: '🎵', desc: '单句循环 · 听写填空', url: '/pages/listening/listening', count: 5, color: '#b5d8f7' },
      { id: 'sentences', title: '语境句子', icon: '💬', desc: '卡片学习 · 关键词高亮', url: '/pages/sentences/sentences', count: 50, color: '#c5e1a5' },
      { id: 'translation', title: '翻译练习', icon: '🌟', desc: 'AI 批改 · 逐句评分', url: '/pages/translation/translation', count: 10, color: '#ffd3b6' },
      { id: 'writing', title: '写作教学', icon: '✨', desc: '句型 · 段落 · 全文', url: '/pages/writing/writing', count: 5, color: '#d8b4fe' },
    ],
    todayStats: {
      listened: 0,
      sentences: 0,
      translations: 0,
      writings: 0,
      total: 0,
    },
    greeting: '',
    checkedIn: false,
    streak: 0,
  },

  onLoad() {
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const hour = new Date().getHours()
    let greeting = '晚上好 🌙'
    if (hour < 12) greeting = '早上好 🌤'
    else if (hour < 18) greeting = '下午好 ☀️'

    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData

    this.setData({
      greeting,
      checkedIn: isCheckedInToday(),
      streak: calcStreak(sd.checkInDates),
      todayStats: {
        listened: sd.completedListens.length,
        sentences: sd.masteredSentences.length,
        translations: sd.translationRecords.length,
        writings: sd.writingRecords.length,
        total: sd.completedListens.length + sd.masteredSentences.length + sd.translationRecords.length + sd.writingRecords.length,
      },
    })
  },

  goTo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    wx.navigateTo({ url })
  },

  handleCheckIn() {
    const streak = doCheckIn()
    this.setData({ checkedIn: true, streak })
    wx.showToast({ title: `打卡成功！连续 ${streak} 天`, icon: 'success' })
  },
})
