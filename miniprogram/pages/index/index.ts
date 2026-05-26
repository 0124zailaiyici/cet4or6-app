import { doCheckIn, calcStreak, isCheckedInToday, getTodayActivity } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'
import readingsData from '../../data/readings'
type IReadingItem = { id: number; title: string; passage: string; questions: string[] }

interface IHomeData {
  greeting: string
  checkedIn: boolean
  streak: number
  favoriteCount: number
  readingCount: number
  todayStats: {
    listened: number
    sentences: number
    translations: number
    writings: number
  }
  goalStats: {
    listenPct: number
    sentencePct: number
    translationPct: number
    writingPct: number
    overallPct: number
  }
  darkMode: boolean
}

interface IHomeMethods {
  goTo(e: WechatMiniprogram.TouchEvent): void
  handleCheckIn(): void
  refresh(): void
}

Page<IHomeData, IHomeMethods>({
  data: {
    greeting: '',
    checkedIn: false,
    streak: 0,
    favoriteCount: 0,
    readingCount: 0,
    todayStats: { listened: 0, sentences: 0, translations: 0, writings: 0 },
    goalStats: { listenPct: 0, sentencePct: 0, translationPct: 0, writingPct: 0, overallPct: 0 },
    darkMode: false,
  },

  onLoad() {
    this.refresh()
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    applyTheme(getDarkMode())
    const hour = new Date().getHours()
    let greeting = '晚上好 🌙'
    if (hour < 12) greeting = '早上好 🌤'
    else if (hour < 18) greeting = '下午好 ☀️'

    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData
    const goal = sd.dailyGoal
    const today = getTodayActivity()

    // Show today's activity counts
    this.setData({
      greeting,
      checkedIn: isCheckedInToday(),
      streak: calcStreak(sd.checkInDates),
      favoriteCount: sd.favoriteSentenceIds.length,
      readingCount: (readingsData as IReadingItem[]).length,
      todayStats: { listened: today.listen, sentences: today.sentence, translations: today.translation, writings: today.writing },
      goalStats: {
        listenPct: goal.listen > 0 ? Math.min(100, Math.round(today.listen / goal.listen * 100)) : 0,
        sentencePct: goal.sentence > 0 ? Math.min(100, Math.round(today.sentence / goal.sentence * 100)) : 0,
        translationPct: goal.translation > 0 ? Math.min(100, Math.round(today.translation / goal.translation * 100)) : 0,
        writingPct: goal.writing > 0 ? Math.min(100, Math.round(today.writing / goal.writing * 100)) : 0,
        overallPct: goal.listen + goal.sentence + goal.translation + goal.writing > 0
          ? Math.min(100, Math.round(today.total / (goal.listen + goal.sentence + goal.translation + goal.writing) * 100)) : 0,
      },
      darkMode: getDarkMode(),
    })
  },

  goTo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    if (url.includes('vocab') || url.includes('settings') || url.includes('profile') || url.includes('statistics')) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  handleCheckIn() {
    const streak = doCheckIn('daily')
    this.setData({ checkedIn: true, streak })
    wx.showToast({ title: `打卡成功！连续 ${streak} 天`, icon: 'success' })
  },
})
