App<IAppOption>({
  globalData: {
    userInfo: undefined,
    studyData: wx.getStorageSync('studyData') || {
      completedListens: [],
      masteredSentences: [],
      translationRecords: [],
      writingRecords: [],
      checkInDates: [],
      favoriteSentenceIds: [],
      dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 }
    }
  },
  onLaunch() {
    const studyData = wx.getStorageSync('studyData')
    if (!studyData) {
      wx.setStorageSync('studyData', this.globalData.studyData)
    }
  }
})
