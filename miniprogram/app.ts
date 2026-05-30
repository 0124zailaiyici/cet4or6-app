import { applyTheme } from './utils/theme'

const API_BASE = (() => { try { return wx.getStorageSync('api_base') || 'https://cet4or6-app-production.up.railway.app' } catch(e) { return 'https://cet4or6-app-production.up.railway.app' } })()

const defaults = {
  completedListens: [] as number[],
  masteredSentences: [] as number[],
  translationRecords: [] as { id: number; userAnswer: string; score: number; dimensions: { vocabulary: number; grammar: number; semantics: number; expression: number }; reference: string; suggestions?: string; date: string }[],
  writingRecords: [] as { id: number; score: number; date: string }[],
  checkInDates: [] as string[],
  favoriteSentenceIds: [] as number[],
  hardSentences: [] as { passageId: number; sentenceIndex: number; text: string; passageTitle: string }[],
  readingAnswers: {} as Record<number, { blankAnswers: Record<string, string>; usedFlags: boolean[] }>,
  listeningAnswers: {} as Record<number, Record<number, number>>,
  todayActivity: { date: '', listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 },
  vocabWords: [] as { word: string; phonetic: string; definition: string; source: string; status: string; correctStreak: number }[],
  dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 }
}

App<IAppOption>({
  globalData: {
    userInfo: undefined,
    darkMode: wx.getStorageSync('darkMode') || false,
    examDeadline: 0,
    examSet: '',
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
    // 首次启动显示引导页
    if (!wx.getStorageSync('hasGuided')) {
      wx.reLaunch({ url: '/pages/guide/guide' })
    }
  }
})
