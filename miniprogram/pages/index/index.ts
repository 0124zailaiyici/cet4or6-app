import { doCheckIn, calcStreak, isCheckedInToday } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IHomeData {
  greeting: string
  checkedIn: boolean
  streak: number
  favoriteCount: number
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

    const listened = sd.completedListens.length
    const sentences = sd.masteredSentences.length
    const translations = sd.translationRecords.length
    const writings = sd.writingRecords.length

    const calcPct = (done: number, target: number) => target > 0 ? Math.min(100, Math.round(done / target * 100)) : 0
    const totalTarget = goal.listen + goal.sentence + goal.translation + goal.writing
    const totalDone = listened + sentences + translations + writings

    this.setData({
      greeting,
      checkedIn: isCheckedInToday(),
      streak: calcStreak(sd.checkInDates),
      favoriteCount: sd.favoriteSentenceIds.length,
      todayStats: { listened, sentences, translations, writings },
      goalStats: {
        listenPct: calcPct(listened, goal.listen),
        sentencePct: calcPct(sentences, goal.sentence),
        translationPct: calcPct(translations, goal.translation),
        writingPct: calcPct(writings, goal.writing),
        overallPct: calcPct(totalDone, totalTarget),
      },
      darkMode: getDarkMode(),
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
