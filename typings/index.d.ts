/// <reference path="./types/index.d.ts" />

interface IStudyData {
  completedListens: number[]
  todayActivity: { date: string; listen: number; sentence: number; translation: number; writing: number; total: number }
  vocabWords: { word: string; phonetic: string; definition: string; source: string; status: string; correctStreak: number }[]
  masteredSentences: number[]
  translationRecords: { id: number; userAnswer: string; score: number; dimensions: { vocabulary: number; grammar: number; semantics: number; expression: number }; reference: string; suggestions?: string; date: string }[]
  writingRecords: { id: number; score: number; date: string }[]
  checkInDates: string[]
  favoriteSentenceIds: number[]
  hardSentences: { passageId: number; sentenceIndex: number; text: string; passageTitle: string }[]
  readingAnswers: Record<number, { blankAnswers: Record<string, string>; usedFlags: boolean[]; matchAnswers?: Record<number, string>; cAnswers?: Record<number, string> }>
  listeningAnswers: Record<number, Record<number, number>>
  dailyGoal: {
    listen: number
    sentence: number
    translation: number
    writing: number
  }
}

interface IAppOption {
  globalData: {
    userInfo?: any
    darkMode: boolean
    studyData: IStudyData
    examDeadline: number
    examSet: string
    fontSize: number
    fontSizes: Record<string, any>
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}