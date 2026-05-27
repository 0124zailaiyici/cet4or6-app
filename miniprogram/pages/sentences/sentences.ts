import sentencesData from '../../data/sentences'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { doCheckIn } from '../../utils/checkin'
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
  viewMode: 'list' | 'immersion' | 'puzzle'
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
  favStatus: boolean[]
  masterStatus: boolean[]
  immFavStatus: boolean
  immMasterStatus: boolean
  // Puzzle mode
  puzzleWords: string[]
  puzzleSelected: number[]
  puzzleAnswers: number[]
  puzzleWordUsed: boolean[]
  puzzleScore: number
  puzzleCombo: number
  puzzleIndex: number
  puzzleTotal: number
  puzzleTime: number
  puzzleFinished: boolean
  puzzleStars: number
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
  startPuzzle(): void
  loadPuzzleSentence(sentences: ISentence[]): void
  tapPuzzleWord(e: WechatMiniprogram.TouchEvent): void
  untapPuzzleWord(e: WechatMiniprogram.TouchEvent): void
  checkPuzzleAnswer(): void
  finishPuzzle(): void
  restartPuzzle(): void
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
    favStatus: [],
    masterStatus: [],
    immFavStatus: false,
    immMasterStatus: false,
    puzzleWords: [],
    puzzleSelected: [],
    puzzleAnswers: [],
    puzzleWordUsed: [],
    puzzleScore: 0,
    puzzleCombo: 0,
    puzzleIndex: 0,
    puzzleTotal: 0,
    puzzleTime: 30,
    puzzleFinished: false,
    puzzleStars: 0,
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
      favStatus: sentences.map(s => (app.globalData.studyData.favoriteSentenceIds || []).indexOf(s.id) >= 0),
      masterStatus: sentences.map(s => (app.globalData.studyData.masteredSentences || []).indexOf(s.id) >= 0),
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
    this.doFilter()
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
    const favStatus = filtered.map(s => favSet.has(s.id))
    const masterStatus = filtered.map(s => masteredSet.has(s.id))
    this.setData({ filteredSentences: filtered, favTexts, masterTexts, favStatus, masterStatus })
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
    const masterStatus = this.data.filteredSentences.map(s => masteredSet.has(s.id))
    const immIdx = this.data.immersionIndex
    const immMasterStatus = this.data.filteredSentences.length > immIdx ? masteredSet.has(this.data.filteredSentences[immIdx].id) : false
    this.setData({
      masteredIds: masteredArr,
      masterTexts,
      masterStatus,
      immMasterStatus,
      topicCounts: { ...this.data.topicCounts, '已掌握': masteredArr.length, '未掌握': this.data.allSentences.length - masteredArr.length },
      filteredSentences: this.data.filteredSentences.slice(),
    })
    this.doFilter()

    const app = getApp<IAppOption>()
    app.globalData.studyData.masteredSentences = masteredArr
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn('sentence')
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
    const favStatus = this.data.filteredSentences.map(s => favSet.has(s.id))
    const immIdx = this.data.immersionIndex
    const immFavStatus = this.data.filteredSentences.length > immIdx ? favSet.has(this.data.filteredSentences[immIdx].id) : false
    this.setData({ favoriteIds: favArr, favTexts, favStatus, immFavStatus, filteredSentences: this.data.filteredSentences.slice() })

    const app = getApp<IAppOption>()
    app.globalData.studyData.favoriteSentenceIds = favArr
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  goDict() {
    wx.navigateTo({ url: '/pages/dictionary/dictionary' })
  },

  noop() {},

  switchMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset.mode as 'list' | 'immersion' | 'puzzle'
    if (this.data.viewMode === 'puzzle') stopPuzzleTimer()
    this.setData({ viewMode: mode, immersionIndex: 0 } as any)
    if (mode === 'puzzle') {
      this.startPuzzle()
    }
  },

  prevSentence() {
    if (this.data.immersionIndex > 0) {
      const idx = this.data.immersionIndex - 1
      const s = this.data.filteredSentences[idx]
      this.setData({
        immersionIndex: idx,
        immFavStatus: this.data.favoriteIds.indexOf(s.id) >= 0,
        immMasterStatus: this.data.masteredIds.indexOf(s.id) >= 0,
      })
    }
  },

  nextSentence() {
    const max = this.data.filteredSentences.length - 1
    if (this.data.immersionIndex < max) {
      const idx = this.data.immersionIndex + 1
      const s = this.data.filteredSentences[idx]
      this.setData({
        immersionIndex: idx,
        immFavStatus: this.data.favoriteIds.indexOf(s.id) >= 0,
        immMasterStatus: this.data.masteredIds.indexOf(s.id) >= 0,
      })
    }
  },

  startPuzzle() {
    const sentences = this.data.filteredSentences.filter(s => !s.english.includes('"') && s.english.split(' ').length >= 3 && s.english.split(' ').length <= 12)
    if (sentences.length === 0) {
      wx.showToast({ title: '没有适合拼图的句子', icon: 'none' })
      this.setData({ viewMode: 'list' } as any)
      return
    }
    stopPuzzleTimer()
    puzzleSentenceList = sentences
    this.setData({
      puzzleTotal: Math.min(sentences.length, 8),
      puzzleIndex: 0,
      puzzleScore: 0,
      puzzleCombo: 0,
      puzzleTime: 30,
      puzzleFinished: false,
      puzzleStars: 0,
    } as any)
    this.loadPuzzleSentence(sentences)
  },

  loadPuzzleSentence(sentences: ISentence[]) {
    const idx = this.data.puzzleIndex
    if (idx >= sentences.length || idx >= this.data.puzzleTotal) {
      this.finishPuzzle()
      return
    }
    const s = sentences[idx]
    const words = s.english.replace(/[.,!?;:'"]/g, '').split(/\s+/).filter(w => w.length > 0)
    const correct = words.map((_, i) => i)
    const shuffled = words.map((w, i) => ({ w, i })).sort(() => Math.random() - 0.5).map(x => x.i)

    this.setData({
      puzzleWords: shuffled.map(i => words[i]),
      puzzleAnswers: correct,
      puzzleSelected: [],
      puzzleWordUsed: shuffled.map(() => false),
      puzzleTime: Math.max(15, 30 - idx * 2),
      puzzleFinished: false,
    } as any)

    stopPuzzleTimer()
    puzzleTimer = setInterval(() => {
      let t = this.data.puzzleTime - 1
      if (t <= 0) {
        stopPuzzleTimer()
        this.setData({ puzzleTime: 0, puzzleCombo: 0, puzzleFinished: true } as any)
        wx.showToast({ title: '⏰ 时间到！', icon: 'none', duration: 1000 })
        setTimeout(() => {
          const next = this.data.puzzleIndex + 1
          if (next >= puzzleSentenceList.length || next >= this.data.puzzleTotal) {
            this.finishPuzzle()
          } else {
            this.setData({ puzzleIndex: next, puzzleFinished: false } as any)
            this.loadPuzzleSentence(puzzleSentenceList)
          }
        }, 1200)
      } else {
        this.setData({ puzzleTime: t } as any)
      }
    }, 1000)
  },

  tapPuzzleWord(e: WechatMiniprogram.TouchEvent) {
    if (this.data.puzzleFinished) return
    const wi = Number(e.currentTarget.dataset.wi)
    const used = this.data.puzzleWordUsed
    if (used[wi]) return
    const selected = this.data.puzzleSelected
    selected.push(wi)
    used[wi] = true
    this.setData({ puzzleSelected: selected, puzzleWordUsed: used } as any)

    if (selected.length === this.data.puzzleAnswers.length) {
      this.checkPuzzleAnswer()
    }
  },

  untapPuzzleWord(e: WechatMiniprogram.TouchEvent) {
    if (this.data.puzzleFinished) return
    const wi = Number(e.currentTarget.dataset.wi)
    let selected = this.data.puzzleSelected
    const used = this.data.puzzleWordUsed
    const idx = selected.indexOf(wi)
    if (idx >= 0) {
      selected.splice(idx, 1)
      used[wi] = false
      this.setData({ puzzleSelected: selected, puzzleWordUsed: used } as any)
    }
  },

  checkPuzzleAnswer() {
    stopPuzzleTimer()
    const selected = this.data.puzzleSelected
    const answers = this.data.puzzleAnswers
    const sentences = this.data.filteredSentences.filter(s => !s.english.includes('"') && s.english.split(' ').length >= 3 && s.english.split(' ').length <= 12)
    let allCorrect = true
    for (let i = 0; i < answers.length; i++) {
      if (selected[i] !== answers[i]) {
        allCorrect = false
        break
      }
    }
    if (allCorrect) {
      const combo = this.data.puzzleCombo + 1
      const bonus = combo > 1 ? combo * 5 : 0
      const timeBonus = this.data.puzzleTime
      const score = this.data.puzzleScore + 10 + bonus + timeBonus
      this.setData({
        puzzleCombo: combo,
        puzzleScore: score,
        puzzleFinished: true,
      } as any)
      wx.showToast({ title: `✓ 正确！+${10 + bonus + timeBonus}分`, icon: 'none', duration: 1000 })
      setTimeout(() => {
        this.setData({
          puzzleIndex: this.data.puzzleIndex + 1,
          puzzleFinished: false,
        } as any)
        this.loadPuzzleSentence(sentences)
      }, 1200)
    } else {
      this.setData({ puzzleCombo: 0, puzzleFinished: true } as any)
      wx.showToast({ title: '✗ 顺序不对，再试试', icon: 'none', duration: 1000 })
      setTimeout(() => {
        this.setData({
          puzzleSelected: [],
          puzzleFinished: false,
        } as any)
      }, 800)
    }
  },

  finishPuzzle() {
    stopPuzzleTimer()
    const total = Math.min(this.data.filteredSentences.filter(s => !s.english.includes('"') && s.english.split(' ').length >= 3 && s.english.split(' ').length <= 12).length, this.data.puzzleTotal)
    const maxScore = total * 50 + 100
    const ratio = this.data.puzzleScore / maxScore
    let stars = 0
    if (ratio >= 0.8) stars = 3
    else if (ratio >= 0.5) stars = 2
    else if (ratio > 0) stars = 1
    this.setData({ puzzleFinished: true, puzzleStars: stars } as any)
  },

  restartPuzzle() {
    this.setData({ puzzleScore: 0, puzzleCombo: 0, puzzleIndex: 0, puzzleFinished: false, puzzleStars: 0 } as any)
    this.startPuzzle()
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
      const favStatus = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0)
      const masterStatus = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0)

      this.setData({
        allSentences,
        topics,
        topicCounts,
        favTexts,
        masterTexts,
        favStatus,
        masterStatus,
        showGenModal: false,
        generating: false,
      })
      this.doFilter()

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
      const favStatus = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0)
      const masterStatus = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0)

      this.setData({
        allSentences,
        topics,
        topicCounts: tc,
        favTexts,
        masterTexts,
        favStatus,
        masterStatus,
        showPasteModal: false,
        parsing: false,
      })
      this.doFilter()

      wx.showToast({ title: `已导入 ${results.length} 个句子`, icon: 'success' })
    } catch (err: any) {
      wx.showToast({ title: err.message || '解析失败', icon: 'none' })
      this.setData({ parsing: false })
    }
  },

  onShareAppMessage() {
    return {
      title: `💬 语境句子 — 已掌握 ${this.data.masteredIds.length} 句！`,
      path: '/pages/sentences/sentences',
    }
  },
})

let puzzleTimer: ReturnType<typeof setInterval> | null = null
let puzzleSentenceList: ISentence[] = []

function stopPuzzleTimer() {
  if (puzzleTimer) { clearInterval(puzzleTimer); puzzleTimer = null }
}
