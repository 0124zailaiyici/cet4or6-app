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
  goalStats: {
    listenPct: number
    sentencePct: number
    translationPct: number
    writingPct: number
    overallPct: number
  }
  greeting: string
  checkedIn: boolean
  streak: number
  darkMode: boolean
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
      { id: 'favorites', title: '收藏夹', icon: '⭐', desc: '收藏句子 · 难句本', url: '/pages/favorites/favorites', count: 0, color: '#ffd700' },
    ],
    todayStats: {
      listened: 0,
      sentences: 0,
      translations: 0,
      writings: 0,
      total: 0,
    },
    goalStats: {
      listenPct: 0,
      sentencePct: 0,
      translationPct: 0,
      writingPct: 0,
      overallPct: 0,
    },
    greeting: '',
    checkedIn: false,
    streak: 0,
    darkMode: false,
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
    const goal = sd.dailyGoal

    const listened = sd.completedListens.length
    const sentences = sd.masteredSentences.length
    const translations = sd.translationRecords.length
    const writings = sd.writingRecords.length

    const calcPct = (done: number, target: number) => target > 0 ? Math.min(100, Math.round(done / target * 100)) : 0
    const listenPct = calcPct(listened, goal.listen)
    const sentencePct = calcPct(sentences, goal.sentence)
    const translationPct = calcPct(translations, goal.translation)
    const writingPct = calcPct(writings, goal.writing)
    const totalTarget = goal.listen + goal.sentence + goal.translation + goal.writing
    const totalDone = listened + sentences + translations + writings
    const overallPct = calcPct(totalDone, totalTarget)

    const modules = this.data.modules
    modules[4].count = sd.favoriteSentenceIds.length

    this.setData({
      modules,
      greeting,
      checkedIn: isCheckedInToday(),
      streak: calcStreak(sd.checkInDates),
      todayStats: { listened, sentences, translations, writings, total: totalDone },
      goalStats: { listenPct, sentencePct, translationPct, writingPct, overallPct },
      darkMode: app.globalData.darkMode,
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
