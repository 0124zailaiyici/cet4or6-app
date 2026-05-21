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
  searchQuery: string
}

interface ISentencesMethods {
  filterByTopic(e: WechatMiniprogram.TouchEvent): void
  toggleExpand(e: WechatMiniprogram.TouchEvent): void
  toggleMaster(e: WechatMiniprogram.TouchEvent): void
  toggleFavorite(e: WechatMiniprogram.TouchEvent): void
  onSearchInput(e: WechatMiniprogram.Input): void
  clearSearch(): void
  doFilter(): void
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
    searchQuery: '',
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

  doFilter() {
    const q = this.data.searchQuery.toLowerCase().trim()
    let filtered = this.data.allSentences

    if (this.data.currentTopic !== '全部') {
      filtered = filtered.filter(s => s.topic === this.data.currentTopic)
    }

    if (q) {
      filtered = filtered.filter(s =>
        s.english.toLowerCase().indexOf(q) !== -1 ||
        s.chinese.indexOf(q) !== -1 ||
        s.keywords.some(k => k.toLowerCase().indexOf(q) !== -1)
      )
    }

    this.setData({ filteredSentences: filtered })
  },

  onSearchInput(e: WechatMiniprogram.Input) {
    this.setData({ searchQuery: e.detail.value })
    this.doFilter()
  },

  clearSearch() {
    this.setData({ searchQuery: '' })
    this.doFilter()
  },

  filterByTopic(e: WechatMiniprogram.TouchEvent) {
    const topic = e.currentTarget.dataset.topic as string
    this.setData({ currentTopic: topic })
    this.doFilter()
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
