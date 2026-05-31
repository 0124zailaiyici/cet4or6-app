import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import { calcStreak } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

Page({
  data: {
    streak: 0, totalItems: 0, accuracy: 0, monthDays: 0,
    achievements: [] as { emoji: string; name: string; unlocked: boolean }[],
    calendar: [] as { day: number | null; level: number; isToday: boolean }[][],
    monthLabel: '',
    fsTitle: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['profile'] && getApp<IAppOption>().globalData.fontSizes['profile'].title || 16,
    body: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['profile'] && getApp<IAppOption>().globalData.fontSizes['profile'].body || 16,
    opt: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['profile'] && getApp<IAppOption>().globalData.fontSizes['profile'].opt || 16,
    btn: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['profile'] && getApp<IAppOption>().globalData.fontSizes['profile'].btn || 16,
    sm: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['profile'] && getApp<IAppOption>().globalData.fontSizes['profile'].sm || 16,

    fsOpen: false,

    darkMode: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadData()
  },

  loadData() {
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData
    const streak = calcStreak(sd.checkInDates)

    // Correct/wrong from reading & listening
    const getStats = () => {
      let correct = 0, total = 0
      if (sd.readingAnswers) {
        for (const pidStr of Object.keys(sd.readingAnswers)) {
          const ans = sd.readingAnswers[Number(pidStr)]
          const p = (readingsData as any[]).find((r: any) => r.id === Number(pidStr))
          if (!p || !p.correctAnswers || !ans || !ans.cAnswers) continue
          for (const qi of Object.keys(p.correctAnswers)) {
            if (p.correctAnswers[qi] === (ans.cAnswers as any)[Number(qi)]) correct++
            total++
          }
        }
      }
      if (sd.listeningAnswers) {
        for (const pidStr of Object.keys(sd.listeningAnswers)) {
          const ans = sd.listeningAnswers[Number(pidStr)]
          const p = (listeningData as any[]).find((l: any) => l.id === Number(pidStr))
          if (!p && p.correctAnswers) continue
          for (const qi of Object.keys(p.correctAnswers)) {
            for (const piStr of Object.keys(ans)) {
              const sentText = p.sentences && p.sentences[Number(piStr)] && p.sentences[Number(piStr)].text || ''
              if ((sentText.match(/^Q(\d+)\./) || [])[1] === qi && ['A','B','C','D'][ans[Number(piStr)]] === p.correctAnswers[qi]) correct++
            }
            total++
          }
        }
      }
      return { correct, total }
    }
    const stats = getStats()
    const totalItems = stats.total
    const accuracy = totalItems > 0 ? Math.round(stats.correct / totalItems * 100) : 0

    // Calendar
    const now = new Date(), year = now.getFullYear(), month = now.getMonth() + 1
    const daysInMonth = new Date(year, month, 0).getDate()
    const firstDay = new Date(year, month - 1, 1).getDay()
    const cells: { day: number | null; level: number; isToday: boolean }[] = []
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, level: 0, isToday: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const checked = sd.checkInDates.includes(dateStr)
      const lv = checked ? (d === now.getDate() ? 3 : (sd.todayActivity && sd.todayActivity.date === dateStr ? 2 : 1)) : 0
      cells.push({ day: d, level: lv, isToday: d === now.getDate() })
    }
    const calRows: typeof cells[] = []
    for (let i = 0; i < cells.length; i += 7) {
      const row = cells.slice(i, i + 7)
      while (row.length < 7) row.push({ day: null, level: 0, isToday: false })
      calRows.push(row)
    }

    // Achievements
    const totalQ = stats.total
    const achievements = [
      { emoji: '🔥', name: '连续 7 天', unlocked: streak >= 7 },
      { emoji: '🎯', name: '100 题', unlocked: totalQ >= 100 },
      { emoji: '💯', name: '正确率 >80%', unlocked: totalQ > 0 && stats.correct / totalQ >= 0.8 },
      { emoji: '⭐', name: '30 天', unlocked: streak >= 30 },
    ]

    this.setData({
      streak, totalItems: totalQ, accuracy, monthDays: sd.checkInDates.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length,
      calendar: calRows, achievements, monthLabel: `${year}年${month}月`,
    })
  },

  goPage(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset.url as string
    wx.navigateTo({ url })
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string || 'body'
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    const key = 'profile'
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
