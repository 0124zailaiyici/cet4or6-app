/// <reference path="./types/index.d.ts" />

interface IStudyData {
  completedListens: number[]
  masteredSentences: number[]
  translationRecords: { id: number; userAnswer: string; score: number; date: string }[]
  writingRecords: { id: number; score: number; date: string }[]
  checkInDates: string[]
}

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    studyData: IStudyData
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}