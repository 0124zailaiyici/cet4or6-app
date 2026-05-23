import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { lookupWord } from '../../utils/api'

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
  lookingUp: boolean
}

interface IVocabMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  startGame(e: WechatMiniprogram.TouchEvent): void
  pickOption(e: WechatMiniprogram.TouchEvent): void
  closeGame(): void
  addWord(): void
  loadWords(): void
  lookupWord(e: WechatMiniprogram.TouchEvent): void
}

const ALNUM_RE = /[^a-zA-Z]/g
const STOP_WORDS = new Set([
  'the','and','for','that','this','with','from','have','were','their','they','about','which','been','would','there','could','these','those','also','between','other','through','during','after','before','people','first','many','years','more','because','into','over','only','each','every','some','such','just','like','most','very','well','than','then','when','where','what','both','few','while','high','late','long','near','next','once','over','same','able','much','face','name','part'
])

const WORD_BANK: Record<string, { phonetic: string; definition: string }> = {
  abandon: { phonetic: '/əˈbændən/', definition: 'v. 抛弃，放弃' },
  legislation: { phonetic: '/ˌledʒɪsˈleɪʃn/', definition: 'n. 法规；立法' },
  dominance: { phonetic: '/ˈdɒmɪnəns/', definition: 'n. 支配；优势' },
  cognitive: { phonetic: '/ˈkɒɡnətɪv/', definition: 'adj. 认知的' },
  sibling: { phonetic: '/ˈsɪblɪŋ/', definition: 'n. 兄弟姐妹' },
  replace: { phonetic: '/rɪˈpleɪs/', definition: 'v. 取代；替换' },
  contrast: { phonetic: '/ˈkɒntrɑːst/', definition: 'n. 对比；对照' },
  restrictive: { phonetic: '/rɪˈstrɪktɪv/', definition: 'adj. 限制的' },
  indifferent: { phonetic: '/ɪnˈdɪfrənt/', definition: 'adj. 漠不关心的' },
  resemble: { phonetic: '/rɪˈzembl/', definition: 'v. 相似；像' },
  psychology: { phonetic: '/saɪˈkɒlədʒi/', definition: 'n. 心理学' },
  sponsor: { phonetic: '/ˈspɒnsə/', definition: 'v. 赞助；发起' },
  represent: { phonetic: '/ˌreprɪˈzent/', definition: 'v. 代表；表示' },
  immune: { phonetic: '/ɪˈmjuːn/', definition: 'adj. 免疫的' },
  infection: { phonetic: '/ɪnˈfekʃn/', definition: 'n. 感染；传染病' },
  colony: { phonetic: '/ˈkɒləni/', definition: 'n. 殖民地；群体' },
  volcano: { phonetic: '/vɒlˈkeɪnəʊ/', definition: 'n. 火山' },
  scholarship: { phonetic: '/ˈskɒləʃɪp/', definition: 'n. 奖学金' },
  recommendation: { phonetic: '/ˌrekəmenˈdeɪʃn/', definition: 'n. 推荐；建议' },
  graduate: { phonetic: '/ˈɡrædʒuət/', definition: 'n. 毕业生' },
  eliminate: { phonetic: '/ɪˈlɪmɪneɪt/', definition: 'v. 消除；淘汰' },
  procedure: { phonetic: '/prəˈsiːdʒə/', definition: 'n. 程序；步骤' },
  encourage: { phonetic: '/ɪnˈkʌrɪdʒ/', definition: 'v. 鼓励' },
  efficiency: { phonetic: '/ɪˈfɪʃnsi/', definition: 'n. 效率' },
  opportunity: { phonetic: '/ˌɒpəˈtjuːnəti/', definition: 'n. 机会' },
  environment: { phonetic: '/ɪnˈvaɪrənmənt/', definition: 'n. 环境' },
  technology: { phonetic: '/tekˈnɒlədʒi/', definition: 'n. 技术' },
  significant: { phonetic: '/sɪɡˈnɪfɪkənt/', definition: 'adj. 重要的；显著的' },
  establish: { phonetic: '/ɪˈstæblɪʃ/', definition: 'v. 建立' },
  committee: { phonetic: '/kəˈmɪti/', definition: 'n. 委员会' },
}

const EXTRACTED_CACHE_KEY = 'vocab_extracted_words'

function extractWords(): IVocabWord[] {
  const cached = wx.getStorageSync(EXTRACTED_CACHE_KEY) as IVocabWord[] | undefined
  if (cached && cached.length) return cached

  const wordMap: Record<string, IVocabWord> = {}
  for (const r of readingsData as Array<{ passage?: string; title?: string }>) {
    const passage = (r.passage || '').replace(ALNUM_RE, ' ')
    const source = r.title || ''
    const tokens = [...new Set(passage.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4 && !STOP_WORDS.has(w)))]
    for (const t of tokens) {
      if (wordMap[t]) {
        if (wordMap[t].source.indexOf(source) === -1) wordMap[t].source += ' / ' + source
        continue
      }
      const known = WORD_BANK[t]
      wordMap[t] = {
        word: t,
        phonetic: known?.phonetic || '',
        definition: known?.definition || '',
        source,
        status: 'new',
        correctStreak: 0,
      }
    }
  }
  const result = Object.values(wordMap)
  wx.setStorageSync(EXTRACTED_CACHE_KEY, result)
  return result
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
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
    lookingUp: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadWords()
  },

  loadWords() {
    const app = getApp<IAppOption>()
    let stored = app.globalData.studyData.vocabWords as IVocabWord[]
    if (!stored || stored.length === 0) {
      stored = extractWords()
      app.globalData.studyData.vocabWords = stored
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
    const words = stored.slice()
    const stats = { mastered: 0, learning: 0, reviewCount: 0 }
    const tab = this.data.tab
    const filtered: IVocabWord[] = []
    for (const w of words) {
      if (w.status === 'master') stats.mastered++
      else stats.learning++
      if (w.status === 'review') stats.reviewCount++
      if (tab === 0 && w.status !== 'master') filtered.push(w)
      else if (tab === 1 && w.status === 'review') filtered.push(w)
      else if (tab === 2 && w.status === 'master') filtered.push(w)
    }
    this.setData({
      words,
      filteredWords: filtered,
      ...stats,
    })
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    const words = this.data.words
    const filtered: IVocabWord[] = []
    for (const w of words) {
      if (tab === 0 && w.status !== 'master') filtered.push(w)
      else if (tab === 1 && w.status === 'review') filtered.push(w)
      else if (tab === 2 && w.status === 'master') filtered.push(w)
    }
    this.setData({ tab, filteredWords: filtered })
  },

  startGame(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const word = this.data.filteredWords[idx]
    if (!word?.definition) return
    const others = this.data.words.filter(w => w.word !== word.word && w.definition)
    const pick = shuffleInPlace(others).slice(0, 3).map(w => w.definition)
    const options = shuffleInPlace([word.definition, ...pick])
    this.setData({ gameWord: word, gameOptions: options, gameIndex: -1, gameCorrect: -1 })
  },

  pickOption(e: WechatMiniprogram.TouchEvent) {
    const oi = Number(e.currentTarget.dataset.oi)
    const def = this.data.gameWord?.definition || ''
    const correctIdx = this.data.gameOptions.indexOf(def)
    const isCorrect = oi === correctIdx
    this.setData({ gameIndex: oi, gameCorrect: correctIdx })

    const app = getApp<IAppOption>()
    const words = app.globalData.studyData.vocabWords as IVocabWord[]
    const w = words.find(v => v.word === this.data.gameWord?.word)
    if (!w) return

    w.correctStreak = isCorrect ? w.correctStreak + 1 : Math.max(0, w.correctStreak - 1)
    w.status = w.correctStreak >= 3 ? 'master' : isCorrect ? 'learning' : 'review'
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.loadWords()
  },

  closeGame() {
    this.setData({ gameWord: null, gameOptions: [], gameIndex: -1, gameCorrect: -1 })
  },

  async lookupWord(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const word = this.data.filteredWords[idx]
    if (!word) return
    this.setData({ lookingUp: true })
    try {
      const result = await lookupWord(word.word)
      const entry = Array.isArray(result) ? result[0] : result
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''
      const definition = entry.meanings?.[0]?.definitions?.[0]?.definition || ''
      if (!definition) {
        wx.showToast({ title: '未找到释义', icon: 'none' })
        return
      }
      const app = getApp<IAppOption>()
      const words = app.globalData.studyData.vocabWords as IVocabWord[]
      const w = words.find(v => v.word === word.word)
      if (w) {
        w.phonetic = phonetic
        w.definition = definition
        wx.setStorageSync('studyData', app.globalData.studyData)
        this.loadWords()
        wx.showToast({ title: `已查到「${word.word}」`, icon: 'success' })
      }
    } catch {
      wx.showToast({ title: '查询失败，请确认 server 已启动', icon: 'none' })
    }
    this.setData({ lookingUp: false })
  },

  addWord() {
    wx.showModal({
      title: '添加单词',
      editable: true,
      placeholderText: '输入英文单词',
      success: (res) => {
        if (!res.confirm || !res.content) return
        const w = res.content.trim().toLowerCase()
        const app = getApp<IAppOption>()
        const words = app.globalData.studyData.vocabWords as IVocabWord[]
        if (words.find(v => v.word === w)) {
          wx.showToast({ title: '单词已存在', icon: 'none' })
          return
        }
        const known = WORD_BANK[w]
        words.push({
          word: w,
          phonetic: known?.phonetic || '',
          definition: known?.definition || '',
          source: '手动添加',
          status: 'new',
          correctStreak: 0,
        })
        wx.setStorageSync('studyData', app.globalData.studyData)
        this.loadWords()
        wx.showToast({ title: '已添加 ' + w, icon: 'success' })
      },
    })
  },
})
