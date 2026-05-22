import sentencesData from '../../data/sentences'
import { applyTheme, getDarkMode } from '../../utils/theme'

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
  scrollTop: number
  darkMode: boolean
}

Page<IFavoritesData, {}>({
  data: {
    tab: 0,
    tabs: ['⭐ 收藏句子', '❗ 难句记录'],
    favSentences: [],
    hardListens: [],
    scrollTop: 0,
    darkMode: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    this.refresh()
  },

  refresh() {
    const app = getApp<IAppOption>()
    const all = sentencesData as ISentence[]
    const favIds = app.globalData.studyData.favoriteSentenceIds
    const idSet = new Set(favIds)

    this.setData({
      favSentences: all.filter(s => idSet.has(s.id)),
      hardListens: app.globalData.studyData.hardSentences || [],
    })
  },

  removeHard(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.index as number
    const app = getApp<IAppOption>()
    const h = app.globalData.studyData.hardSentences
    if (!h || idx < 0 || idx >= h.length) return
    wx.showModal({
      title: '移除难句',
      content: '确定移除此难句记录吗？',
      success: (res) => {
        if (res.confirm) {
          h.splice(idx, 1)
          wx.setStorageSync('studyData', app.globalData.studyData)
          this.refresh()
          wx.showToast({ title: '已移除难句', icon: 'none' })
        }
      }
    })
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, scrollTop: 0 })
  },

  removeFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const app = getApp<IAppOption>()
    const ids = app.globalData.studyData.favoriteSentenceIds
    wx.showModal({
      title: '取消收藏',
      content: '确定取消收藏这个句子吗？',
      success: (res) => {
        if (res.confirm) {
          const idx = ids.indexOf(id)
          if (idx !== -1) ids.splice(idx, 1)
          wx.setStorageSync('studyData', app.globalData.studyData)
          this.refresh()
          wx.showToast({ title: '已取消收藏', icon: 'none' })
        }
      }
    })
  },
})
