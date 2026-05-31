import sentencesData from '../../data/sentences'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface ISentence {
  id: number
  english: string
  chinese: string
  keywords: string[]
  topic: string
}

interface IHardSentence {
  passageId: number
  sentenceIndex: number
  text: string
  passageTitle: string
}

interface IFavoritesData {
  tab: number
  tabs: string[]
  favSentences: (ISentence & { mastered: boolean })[]
  hardListens: IHardSentence[]
  scrollTop: number
  darkMode: boolean  [key: string]: any

}

interface IFavoritesMethods {
  onSwitchTab(e: WechatMiniprogram.TouchEvent): void
  removeFavorite(e: WechatMiniprogram.TouchEvent): void
  removeHard(e: WechatMiniprogram.TouchEvent): void
  gotoSentence(e: WechatMiniprogram.TouchEvent): void
  goToListening(e: WechatMiniprogram.TouchEvent): void
  refresh(): void  [key: string]: any

}

Page<IFavoritesData, IFavoritesMethods>({
  data: {
    tab: 0,
    tabs: ['⭐ 收藏句子', '❗ 难句记录'],
    favSentences: [],
    hardListens: [],
    scrollTop: 0,
    fsTitle: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['favorites'] && getApp<IAppOption>().globalData.fontSizes['favorites'].title || 16,
    body: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['favorites'] && getApp<IAppOption>().globalData.fontSizes['favorites'].body || 16,
    opt: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['favorites'] && getApp<IAppOption>().globalData.fontSizes['favorites'].opt || 16,
    btn: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['favorites'] && getApp<IAppOption>().globalData.fontSizes['favorites'].btn || 16,
    sm: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['favorites'] && getApp<IAppOption>().globalData.fontSizes['favorites'].sm || 16,

    fsOpen: false,

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
    const masteredIds = app.globalData.studyData.masteredSentences || []
    const masteredSet = new Set(masteredIds)

    const favSentences = all
      .filter(s => idSet.has(s.id))
      .reverse()
      .map(s => ({ ...s, mastered: masteredSet.has(s.id) }))

    this.setData({
      favSentences,
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

  gotoSentence(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    wx.navigateTo({ url: `/pages/sentences/sentences?id=${id}` })
  },

  goToListening(e: WechatMiniprogram.TouchEvent) {
    const passageId = e.currentTarget.dataset.passageid as number
    wx.navigateTo({ url: `/pages/listening/listening?passageId=${passageId}` })
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat as string || 'body'
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    const key = 'favorites'
    const old = this.data[cat as keyof typeof this.data] as number || 16
    let v = Math.max(10, Math.min(28, old + d))
    this.setData({ [cat]: v })
    const app = getApp<IAppOption>()
    if (!app.globalData.fontSizes) app.globalData.fontSizes = {}
    if (!app.globalData.fontSizes[key]) app.globalData.fontSizes[key] = { title: 16, body: 16, opt: 16, btn: 16, sm: 16 }
    app.globalData.fontSizes[key][cat] = v
    wx.setStorageSync('fontSizes', app.globalData.fontSizes)
  },
})
