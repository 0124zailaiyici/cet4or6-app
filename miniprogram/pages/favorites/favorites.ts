import sentencesData from '../../data/sentences'

interface ISentence {
  id: number
  english: string
  chinese: string
  keywords: string[]
  topic: string
}

interface IFavoritesData {
  tab: number
  tabs: string[]
  favSentences: ISentence[]
  hardListens: { text: string; passageTitle: string }[]
  masteredIds: number[]
}

interface IFavoritesMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  removeFavorite(e: WechatMiniprogram.TouchEvent): void
  refresh(): void
}

Page<IFavoritesData, IFavoritesMethods>({
  data: {
    tab: 0,
    tabs: ['⭐ 收藏句子', '❗ 难句记录'],
    favSentences: [],
    hardListens: [],
    masteredIds: [],
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const app = getApp<IAppOption>()
    const all = sentencesData as ISentence[]
    const favIds = app.globalData.studyData.favoriteSentenceIds

    this.setData({
      favSentences: all.filter(s => favIds.indexOf(s.id) !== -1),
      masteredIds: app.globalData.studyData.masteredSentences,
    })
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab })
  },

  removeFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const app = getApp<IAppOption>()
    const ids = app.globalData.studyData.favoriteSentenceIds
    const idx = ids.indexOf(id)
    if (idx !== -1) ids.splice(idx, 1)
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.refresh()
    wx.showToast({ title: '已取消收藏', icon: 'none' })
  },
})
