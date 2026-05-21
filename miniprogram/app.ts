App<IAppOption>({
  globalData: {
    userInfo: undefined,
    studyData: wx.getStorageSync('studyData') || {
      completedListens: [],
      masteredSentences: [],
      translationRecords: [],
      writingRecords: [],
      checkInDates: []
    }
  },
  onLaunch() {
    const studyData = wx.getStorageSync('studyData')
    if (!studyData) {
      wx.setStorageSync('studyData', this.globalData.studyData)
    }
  }
})
