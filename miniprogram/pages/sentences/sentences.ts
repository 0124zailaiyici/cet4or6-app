import sentencesData from '../../data/sentences'
import { doCheckIn } from '../../utils/checkin'

interface ISentence {
  id: number
  english: string
  chinese: string
  keywords: string[]
  topic: string
}

interface ISentencesData {
  allSentences: ISentence[]
  filteredSentences: ISentence[]
  topics: string[]
  currentTopic: string
  masteredIds: number[]
  expandedIds: number[]
  favoriteIds: number[]
}

interface ISentencesMethods {
  filterByTopic(e: WechatMiniprogram.TouchEvent): void
  toggleExpand(e: WechatMiniprogram.TouchEvent): void
  toggleMaster(e: WechatMiniprogram.TouchEvent): void
  toggleFavorite(e: WechatMiniprogram.TouchEvent): void
  highlightText(text: string, keywords: string[]): string
}

Page<ISentencesData, ISentencesMethods>({
  data: {
    allSentences: [],
    filteredSentences: [],
    topics: [],
    currentTopic: '全部',
    masteredIds: [],
    expandedIds: [],
    favoriteIds: [],
  },

  onLoad() {
    const sentences = sentencesData as ISentence[]
    const topics = [...new Set(sentences.map(s => s.topic))]
    topics.unshift('全部')

    const app = getApp<IAppOption>()
    this.setData({
      allSentences: sentences,
      filteredSentences: sentences,
      topics,
      masteredIds: app.globalData.studyData.masteredSentences,
      favoriteIds: app.globalData.studyData.favoriteSentenceIds,
    })
  },

  filterByTopic(e: WechatMiniprogram.TouchEvent) {
    const topic = e.currentTarget.dataset.topic as string
    const filtered = topic === '全部'
      ? this.data.allSentences
      : this.data.allSentences.filter(s => s.topic === topic)
    this.setData({ currentTopic: topic, filteredSentences: filtered })
  },

  toggleExpand(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const expanded = new Set(this.data.expandedIds)
    if (expanded.has(id)) expanded.delete(id)
    else expanded.add(id)
    this.setData({ expandedIds: [...expanded] })
  },

  toggleMaster(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const mastered = new Set(this.data.masteredIds)
    if (mastered.has(id)) {
      mastered.delete(id)
    } else {
      mastered.add(id)
      doCheckIn()
    }
    const masteredArr = [...mastered]
    this.setData({ masteredIds: masteredArr })

    const app = getApp<IAppOption>()
    app.globalData.studyData.masteredSentences = masteredArr
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  toggleFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const fav = new Set(this.data.favoriteIds)
    if (fav.has(id)) fav.delete(id)
    else fav.add(id)
    const favArr = [...fav]
    this.setData({ favoriteIds: favArr })

    const app = getApp<IAppOption>()
    app.globalData.studyData.favoriteSentenceIds = favArr
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  highlightText(text: string, keywords: string[]): string {
    let result = text
    for (const kw of keywords) {
      const parts = kw.split(' ')
      if (parts.length > 1) {
        result = result.replace(new RegExp(`(${kw})`, 'gi'), '<em class="kw">$1</em>')
      } else {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        result = result.replace(new RegExp(`(${escaped})`, 'gi'), '<em class="kw">$1</em>')
      }
    }
    return result
  },
})
