import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IVocabWord {
  word: string
  phonetic: string
  definition: string
  source: string
  status: 'new' | 'learning' | 'review' | 'master'
  correctStreak: number
}

interface IVocabData {
  words: IVocabWord[]
  filteredWords: IVocabWord[]
  tab: number
  mastered: number
  learning: number
  reviewCount: number
  darkMode: boolean
  gameWord: IVocabWord | null
  gameOptions: string[]
  gameIndex: number
  gameCorrect: number
}

interface IVocabMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  startGame(e: WechatMiniprogram.TouchEvent): void
  pickOption(e: WechatMiniprogram.TouchEvent): void
  closeGame(): void
  addWord(): void
  loadWords(): void
}

const STOP_WORDS = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','shall','should','may','might','must','can','could','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','and','but','or','not','no','yes','of','in','on','at','to','for','with','by','from','as','about','than','also','so','if','when','all','any','each','every','both','few','more','most','other','some','such','only','own','same','very','just','who','which','what','how','where','why','one','two','new','now','then','up','out','into','over','after','before','between','through','during','above','below','here','there','way','well','back','because','too','much','make','made','like','just','people','years','first','many','time','more'])

function extractWords(): IVocabWord[] {
  const words: Record<string, IVocabWord> = {}
  for (const r of (readingsData as any[])) {
    const passage = r.passage || ''
    const source = r.title || ''
    const tokens = passage.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w: string) => w.length >= 4 && !STOP_WORDS.has(w))
    for (const t of new Set<string>(tokens)) {
      if (!words[t]) {
        words[t] = { word: t, phonetic: '', definition: '', source, status: 'new', correctStreak: 0 }
      }
    }
  }
  return Object.values(words)
}

Page<IVocabData, IVocabMethods>({
  data: {
    words: [],
    filteredWords: [],
    tab: 0,
    mastered: 0,
    learning: 0,
    reviewCount: 0,
    darkMode: false,
    gameWord: null,
    gameOptions: [],
    gameIndex: -1,
    gameCorrect: -1,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadWords()
  },

  loadWords() {
    const app = getApp<IAppOption>()
    let stored = app.globalData.studyData.vocabWords
    if (!stored || stored.length === 0) {
      stored = extractWords()
      app.globalData.studyData.vocabWords = stored
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
    const mastered = stored.filter((w: any) => w.status === 'master').length
    const learning = stored.filter((w: any) => w.status !== 'master').length
    const review = stored.filter((w: any) => w.status === 'review').length
    this.setData({
      words: stored as any,
      filteredWords: stored.filter((w: any) => w.status !== 'master') as any,
      mastered,
      learning,
      reviewCount: review,
    })
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    let filtered = this.data.words
    if (tab === 0) filtered = this.data.words.filter(w => w.status !== 'master')
    else if (tab === 1) filtered = this.data.words.filter(w => w.status === 'review')
    else filtered = this.data.words.filter(w => w.status === 'master')
    this.setData({ tab, filteredWords: filtered })
  },

  startGame(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const word = this.data.filteredWords[idx]
    if (!word) return
    // Generate 4 options (1 correct + 3 random)
    const all = this.data.words.filter(w => w.word !== word.word)
    const shuffled = all.sort(() => Math.random() - 0.5).slice(0, 3)
    const options = [word.definition || '（待补充）', ...shuffled.map(w => w.definition || '（待补充）')].sort(() => Math.random() - 0.5)
    this.setData({ gameWord: word, gameOptions: options, gameIndex: -1, gameCorrect: -1 })
  },

  pickOption(e: WechatMiniprogram.TouchEvent) {
    const oi = Number(e.currentTarget.dataset.oi)
    const correctIdx = this.data.gameOptions.indexOf(this.data.gameWord?.definition || '')
    const isCorrect = oi === correctIdx
    this.setData({ gameIndex: oi, gameCorrect: correctIdx })

    if (!this.data.gameWord) return
    const app = getApp<IAppOption>()
    const words = app.globalData.studyData.vocabWords
    const w = words.find(w => w.word === this.data.gameWord!.word)
    if (!w) return

    if (isCorrect) {
      w.correctStreak++
      w.status = w.correctStreak >= 3 ? 'master' : 'learning'
    } else {
      w.correctStreak = Math.max(0, w.correctStreak - 1)
      w.status = 'review'
    }
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.loadWords()
  },

  closeGame() {
    this.setData({ gameWord: null, gameOptions: [], gameIndex: -1, gameCorrect: -1 })
  },

  addWord() {
    wx.showModal({
      title: '添加单词',
      editable: true,
      placeholderText: '输入英文单词',
      success: (res) => {
        if (res.confirm && res.content) {
          const word = res.content.trim().toLowerCase()
          const app = getApp<IAppOption>()
          if (app.globalData.studyData.vocabWords.find(w => w.word === word)) {
            wx.showToast({ title: '单词已存在', icon: 'none' })
            return
          }
          app.globalData.studyData.vocabWords.push({
            word, phonetic: '', definition: '', source: '手动添加',
            status: 'new', correctStreak: 0,
          })
          wx.setStorageSync('studyData', app.globalData.studyData)
          this.loadWords()
          wx.showToast({ title: '已添加 ' + word, icon: 'success' })
        }
      },
    })
  },
})
