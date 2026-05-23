import sentencesData from '../../data/sentences'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { generateSentence, parseSentences } from '../../utils/api'

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
  topicCounts: Record<string, number>
  currentTopic: string
  masteredIds: number[]
  favoriteIds: number[]
  searchQuery: string
  darkMode: boolean
  viewMode: 'list' | 'immersion'
  immersionIndex: number
  scrollHeight: number
  showGenModal: boolean
  genInput: string
  genType: 'word' | 'topic'
  genCount: number
  generating: boolean
  showPasteModal: boolean
  pasteText: string
  parsing: boolean
  favTexts: string[]
  masterTexts: string[]
}

interface ISentencesMethods {
  filterByTopic(e: WechatMiniprogram.TouchEvent): void
  toggleFavorite(e: WechatMiniprogram.TouchEvent): void
  toggleMaster(e: WechatMiniprogram.TouchEvent): void
  onSearchInput(e: WechatMiniprogram.Input): void
  clearSearch(): void
  doFilter(): void
  goDict(): void
  noop(): void
  switchMode(e: WechatMiniprogram.TouchEvent): void
  prevSentence(): void
  nextSentence(): void
  openGenModal(): void
  closeGenModal(): void
  onGenInput(e: WechatMiniprogram.Input): void
  setGenType(e: WechatMiniprogram.TouchEvent): void
  adjustGenCount(e: WechatMiniprogram.TouchEvent): void
  doGenerate(): void
  openPasteModal(): void
  closePasteModal(): void
  onPasteInput(e: WechatMiniprogram.Input): void
  doParse(): void
}

Page<ISentencesData, ISentencesMethods>({
  data: {
    allSentences: [],
    filteredSentences: [],
    topics: [],
    topicCounts: {},
    currentTopic: '全部',
    masteredIds: [],
    favoriteIds: [],
    searchQuery: '',
    darkMode: false,
    viewMode: 'list',
    immersionIndex: 0,
    scrollHeight: 600,
    showGenModal: false,
    genInput: '',
    genType: 'word',
    genCount: 3,
    generating: false,
    showPasteModal: false,
    pasteText: '',
    parsing: false,
    favTexts: [],
    masterTexts: [],
  },

  onLoad(options: { id?: string }) {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })

    let scrollH = 400
    try {
      const sys = (wx as any).getWindowInfo()
      const px = sys.windowWidth / 750
      scrollH = Math.floor(sys.windowHeight - 310 * px - 80 * px - 90 * px - (sys.statusBarHeight || 20) - 10)
      if (scrollH < 200) scrollH = 400
    } catch (_) {}

    this.setData({ scrollHeight: scrollH })
    const sentences = sentencesData as ISentence[]
    const topics = [...new Set(sentences.map(s => s.topic))]
    topics.unshift('全部')
    const topicCounts: Record<string, number> = {}
    sentences.forEach(s => {
      topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1
    })
    topics.push('已掌握', '未掌握')
    topicCounts['已掌握'] = 0
    topicCounts['未掌握'] = sentences.length

    this.setData({
      allSentences: sentences,
      filteredSentences: sentences,
      topics,
      topicCounts,
      masteredIds: app.globalData.studyData.masteredSentences || [],
      favoriteIds: app.globalData.studyData.favoriteSentenceIds || [],
      favTexts: sentences.map(s => (app.globalData.studyData.favoriteSentenceIds || []).indexOf(s.id) >= 0 ? '已收藏' : '收藏'),
      masterTexts: sentences.map(s => (app.globalData.studyData.masteredSentences || []).indexOf(s.id) >= 0 ? '已掌握' : '掌握'),
    })

    if (options.id) {
      const idx = sentences.findIndex(s => s.id === Number(options.id))
      if (idx >= 0) {
        this.setData({ viewMode: 'immersion', immersionIndex: idx })
      }
    }
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  doFilter() {
    const q = this.data.searchQuery.toLowerCase().trim()
    const masteredSet = new Set(this.data.masteredIds)
    const favSet = new Set(this.data.favoriteIds)
    let filtered = this.data.allSentences

    if (this.data.currentTopic === '已掌握') {
      filtered = filtered.filter(s => masteredSet.has(s.id))
    } else if (this.data.currentTopic === '未掌握') {
      filtered = filtered.filter(s => !masteredSet.has(s.id))
    } else if (this.data.currentTopic !== '全部') {
      filtered = filtered.filter(s => s.topic === this.data.currentTopic)
    }

    if (q) {
      filtered = filtered.filter(s =>
        s.english.toLowerCase().indexOf(q) !== -1 ||
        s.chinese.indexOf(q) !== -1 ||
        s.keywords.some(k => k.toLowerCase().indexOf(q) !== -1)
      )
    }

    const favTexts = filtered.map(s => favSet.has(s.id) ? '已收藏' : '收藏')
    const masterTexts = filtered.map(s => masteredSet.has(s.id) ? '已掌握' : '掌握')
    this.setData({ filteredSentences: filtered, favTexts, masterTexts })
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

  toggleMaster(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id
    const idNum = Number(id)
    const before = this.data.masteredIds
    const mastered = new Set(before)
    if (mastered.has(idNum)) mastered.delete(idNum)
    else mastered.add(idNum)
    const masteredArr = [...mastered]
    const masteredSet = new Set(masteredArr)
    const masterTexts = this.data.filteredSentences.map(s => masteredSet.has(s.id) ? '已掌握' : '掌握')
    this.setData({
      masteredIds: masteredArr,
      masterTexts,
      topicCounts: { ...this.data.topicCounts, '已掌握': masteredArr.length, '未掌握': this.data.allSentences.length - masteredArr.length },
      filteredSentences: this.data.filteredSentences.slice(),
    })
    this.doFilter()

    const app = getApp<IAppOption>()
    app.globalData.studyData.masteredSentences = masteredArr
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  toggleFavorite(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id
    const idNum = Number(id)
    const before = this.data.favoriteIds
    const fav = new Set(before)
    if (fav.has(idNum)) fav.delete(idNum)
    else fav.add(idNum)
    const favArr = [...fav]
    const favSet = new Set(favArr)
    const favTexts = this.data.filteredSentences.map(s => favSet.has(s.id) ? '已收藏' : '收藏')
    this.setData({ favoriteIds: favArr, favTexts, filteredSentences: this.data.filteredSentences.slice() })

    const app = getApp<IAppOption>()
    app.globalData.studyData.favoriteSentenceIds = favArr
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  goDict() {
    wx.navigateTo({ url: '/pages/dictionary/dictionary' })
  },

  noop() {},

  switchMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as 'list' | 'immersion'
    this.setData({ viewMode: mode, immersionIndex: 0 })
  },

  prevSentence() {
    if (this.data.immersionIndex > 0) {
      this.setData({ immersionIndex: this.data.immersionIndex - 1 })
    }
  },

  nextSentence() {
    const max = this.data.filteredSentences.length - 1
    if (this.data.immersionIndex < max) {
      this.setData({ immersionIndex: this.data.immersionIndex + 1 })
    }
  },

  openGenModal() {
    this.setData({ showGenModal: true, genInput: '' })
  },

  closeGenModal() {
    this.setData({ showGenModal: false })
  },

  onGenInput(e: WechatMiniprogram.Input) {
    this.setData({ genInput: e.detail.value })
  },

  setGenType(e: WechatMiniprogram.TouchEvent) {
    this.setData({ genType: e.currentTarget.dataset.type as 'word' | 'topic' })
  },

  adjustGenCount(e: WechatMiniprogram.TouchEvent) {
    const delta = parseInt(e.currentTarget.dataset.delta as string, 10)
    const next = this.data.genCount + delta
    if (next >= 1 && next <= 5) {
      this.setData({ genCount: next })
    }
  },

  async doGenerate() {
    const input = this.data.genInput.trim()
    if (!input) {
      wx.showToast({ title: '请输入单词或话题', icon: 'none' })
      return
    }

    this.setData({ generating: true })
    try {
      const params: { word?: string; topic?: string; count: number } = {
        count: this.data.genCount,
      }
      if (this.data.genType === 'word') {
        params.word = input
      } else {
        params.topic = input
      }

      const results = await generateSentence(params)

      const maxId = Math.max(0, ...this.data.allSentences.map(s => s.id))
      const newSentences: ISentence[] = results.map((item, i) => ({
        id: maxId + i + 1,
        english: item.english,
        chinese: item.chinese,
        keywords: item.keywords,
        topic: item.topic,
      }))

      const allSentences = [...this.data.allSentences, ...newSentences]
      const topics = [...new Set(allSentences.map(s => s.topic))]
      topics.unshift('全部')
      topics.push('已掌握', '未掌握')
      const topicCounts: Record<string, number> = {}
      allSentences.forEach(s => {
        topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1
      })
      topicCounts['已掌握'] = this.data.masteredIds.length
      topicCounts['未掌握'] = allSentences.length - this.data.masteredIds.length
      const favTexts = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0 ? '已收藏' : '收藏')
      const masterTexts = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0 ? '已掌握' : '掌握')

      this.setData({
        allSentences,
        topics,
        topicCounts,
        favTexts,
        masterTexts,
        showGenModal: false,
        generating: false,
      })
      this.doFilter()
      const hash = allSentences.length + '|' + allSentences[0]?.english + '|' + allSentences[allSentences.length - 1]?.english
      wx.setStorageSync('sentenceHash', hash)

      wx.showToast({ title: `已生成 ${results.length} 个句子`, icon: 'success' })
    } catch (err: any) {
      wx.showToast({ title: err.message || '生成失败', icon: 'none' })
      this.setData({ generating: false })
    }
  },

  openPasteModal() {
    this.setData({ showPasteModal: true, pasteText: '' })
  },

  closePasteModal() {
    this.setData({ showPasteModal: false })
  },

  onPasteInput(e: WechatMiniprogram.Input) {
    this.setData({ pasteText: e.detail.value })
  },

  async doParse() {
    const text = this.data.pasteText.trim()
    if (text.length < 10) {
      wx.showToast({ title: '文本太短，至少10个字符', icon: 'none' })
      return
    }

    this.setData({ parsing: true })
    try {
      const results = await parseSentences(text)

      const maxId = Math.max(0, ...this.data.allSentences.map(s => s.id))
      const newSentences: ISentence[] = results.map((item, i) => ({
        id: maxId + i + 1,
        english: item.english,
        chinese: item.chinese,
        keywords: item.keywords,
        topic: item.topic,
      }))

      const allSentences = [...this.data.allSentences, ...newSentences]
      const topics = [...new Set(allSentences.map(s => s.topic))]
      topics.unshift('全部')
      topics.push('已掌握', '未掌握')
      const tc: Record<string, number> = {}
      allSentences.forEach(s => {
        tc[s.topic] = (tc[s.topic] || 0) + 1
      })
      tc['已掌握'] = this.data.masteredIds.length
      tc['未掌握'] = allSentences.length - this.data.masteredIds.length
      const favTexts = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0 ? '已收藏' : '收藏')
      const masterTexts = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0 ? '已掌握' : '掌握')

      this.setData({
        allSentences,
        topics,
        topicCounts: tc,
        favTexts,
        masterTexts,
        showPasteModal: false,
        parsing: false,
      })

      this.setData({
        allSentences,
        topics,
        topicCounts: tc,
        showPasteModal: false,
    parsing: false,
    favTexts: [],
    masterTexts: [],
      })
      this.doFilter()
      const hash = allSentences.length + '|' + allSentences[0]?.english + '|' + allSentences[allSentences.length - 1]?.english
      wx.setStorageSync('sentenceHash', hash)

      wx.showToast({ title: `已导入 ${results.length} 个句子`, icon: 'success' })
    } catch (err: any) {
      wx.showToast({ title: err.message || '解析失败', icon: 'none' })
      this.setData({ parsing: false })
    }
  },
})
