import { calcStreak, getMonthDays } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

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
  maxScores: { score: number; label: string }[]
  streak: number
  totalCheckins: number
  calendarRows: ICalCell[][]
  monthYear: string
  darkMode: boolean
  monthChecked: number
  monthTotal: number
  listenedRatio: number
  masteredRatio: number
  translationRatio: number
  writingRatio: number
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
    streak: 0,
    totalCheckins: 0,
    calendarRows: [],
    monthYear: '',
    darkMode: false,
    monthChecked: 0,
    monthTotal: 0,
    listenedRatio: 0,
    masteredRatio: 0,
    translationRatio: 0,
    writingRatio: 0,
  },

  onLoad() {
    this.refresh()
  },

  onShow() {
    applyTheme(getDarkMode())
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
    const daysInMonth = new Date(year, month, 0).getDate()

    const flatCells = getMonthDays(year, month)
    const rows: ICalCell[][] = []
    let row: ICalCell[] = []
    let monthChecked = 0
    for (const d of flatCells) {
      const dayStr = d !== null ? String(d).padStart(2, '0') : ''
      const checked = d !== null && sd.checkInDates.indexOf(`${year}-${mStr}-${dayStr}`) !== -1
      if (checked) monthChecked++
      row.push({ day: d, checked, isToday: d === today })
      if (row.length === 7) {
        rows.push(row)
        row = []
      }
    }
    if (row.length > 0) {
      while (row.length < 7) {
        row.push({ day: null, checked: false, isToday: false })
      }
      rows.push(row)
    }

    const recent = sd.translationRecords.slice(-7)
    const maxScores = recent.map(r => ({
      score: r.score,
      label: r.date ? r.date.slice(5) : '',
    }))

    const goal = sd.dailyGoal

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
      maxScores,
      monthChecked,
      monthTotal: today,
      listenedRatio: Math.min(1, sd.completedListens.length / (today * goal.listen || 1)),
      masteredRatio: Math.min(1, sd.masteredSentences.length / (today * goal.sentence || 1)),
      translationRatio: Math.min(1, sd.translationRecords.length / (today * goal.translation || 1)),
      writingRatio: Math.min(1, sd.writingRecords.length / (today * goal.writing || 1)),
    })
  },

  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '将清除所有学习记录，此操作不可撤销。',
      success: (res) => {
        if (res.confirm) {
          const empty: IStudyData = {
            completedListens: [],
            masteredSentences: [],
            translationRecords: [],
            writingRecords: [],
            checkInDates: [],
            favoriteSentenceIds: [],
            hardSentences: [],
            readingAnswers: {},
            listeningAnswers: {},
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
