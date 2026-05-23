import { applyTheme } from './utils/theme'

const defaults = {
  completedListens: [] as number[],
  masteredSentences: [] as number[],
  translationRecords: [] as { id: number; userAnswer: string; score: number; date: string }[],
  writingRecords: [] as { id: number; score: number; date: string }[],
  checkInDates: [] as string[],
  favoriteSentenceIds: [] as number[],
  hardSentences: [] as { passageId: number; sentenceIndex: number; text: string; passageTitle: string }[],
  readingAnswers: {} as Record<number, { blankAnswers: Record<string, string>; usedFlags: boolean[] }>,
  todayActivity: { date: '', listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 },
  dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 }
}

App<IAppOption>({
  globalData: {
    userInfo: undefined,
    darkMode: wx.getStorageSync('darkMode') || false,
    studyData: (() => {
      const stored = wx.getStorageSync('studyData')
      return stored ? { ...defaults, ...stored, hardSentences: stored.hardSentences || [], readingAnswers: stored.readingAnswers || {} } : { ...defaults }
    })()
  },
  onLaunch() {
    const studyData = wx.getStorageSync('studyData')
    if (!studyData) {
      wx.setStorageSync('studyData', this.globalData.studyData)
    }
    if (this.globalData.darkMode) {
      applyTheme(true)
    }
  }
})
