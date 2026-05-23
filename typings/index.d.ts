/// <reference path="./types/index.d.ts" />

interface IStudyData {
  completedListens: number[]
  todayActivity: { date: string; listen: number; sentence: number; translation: number; writing: number; total: number }
  masteredSentences: number[]
  translationRecords: { id: number; userAnswer: string; score: number; date: string }[]
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
    userInfo?: WechatMiniprogram.UserInfo,
    studyData: IStudyData,
    darkMode: boolean
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}