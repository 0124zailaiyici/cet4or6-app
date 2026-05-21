import { calcStreak, getMonthDays } from '../../utils/checkin'

interface ICalCell {
  day: number | null
  checked: boolean
  isToday: boolean
}

interface IStatData {
  totalCompleted: number
  listenedCount: number
  masteredCount: number
  translationCount: number
  writingCount: number
  maxScores: number[]
  scoreLabels: string[]
  streak: number
  totalCheckins: number
  calendarRows: ICalCell[][]
  monthYear: string
  darkMode: boolean
}

interface IStatMethods {
  clearData(): void
  refresh(): void
}

Page<IStatData, IStatMethods>({
  data: {
    totalCompleted: 0,
    listenedCount: 0,
    masteredCount: 0,
    translationCount: 0,
    writingCount: 0,
    maxScores: [],
    scoreLabels: [],
    streak: 0,
    totalCheckins: 0,
    calendarRows: [],
    monthYear: '',
    darkMode: false,
  },

  onLoad() {
    this.refresh()
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    this.refresh()
  },

  refresh() {
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const mStr = String(month).padStart(2, '0')
    const today = now.getDate()

    const flatCells = getMonthDays(year, month)
    const rows: ICalCell[][] = []
    let row: ICalCell[] = []
    for (const d of flatCells) {
      const dayStr = d !== null ? String(d).padStart(2, '0') : ''
      const checked = d !== null && sd.checkInDates.indexOf(`${year}-${mStr}-${dayStr}`) !== -1
      row.push({ day: d, checked, isToday: d === today })
      if (row.length === 7) {
        rows.push(row)
        row = []
      }
    }
    if (row.length > 0) rows.push(row)

    this.setData({
      streak: calcStreak(sd.checkInDates),
      totalCheckins: sd.checkInDates.length,
      calendarRows: rows,
      monthYear: `${year}年${month}月`,
      totalCompleted: sd.completedListens.length + sd.masteredSentences.length + sd.translationRecords.length + sd.writingRecords.length,
      listenedCount: sd.completedListens.length,
      masteredCount: sd.masteredSentences.length,
      translationCount: sd.translationRecords.length,
      writingCount: sd.writingRecords.length,
      maxScores: sd.translationRecords.slice(-7).map(r => r.score),
      scoreLabels: sd.translationRecords.slice(-7).map((_, i) => `#${i + 1}`),
    })
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有学习记录，此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          const empty = {
            completedListens: [],
            masteredSentences: [],
            translationRecords: [],
            writingRecords: [],
            checkInDates: [],
            favoriteSentenceIds: [],
            dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 },
          }
          const app = getApp<IAppOption>()
          app.globalData.studyData = empty
          wx.setStorageSync('studyData', empty)
          this.refresh()
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      },
    })
  },
})
