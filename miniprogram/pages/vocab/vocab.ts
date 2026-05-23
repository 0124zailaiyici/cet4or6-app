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

const CET4_WORDS: IVocabWord[] = [
  { word: 'abandon', phonetic: '/əˈbændən/', definition: 'v. 抛弃，放弃', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'legislation', phonetic: '/ˌledʒɪsˈleɪʃn/', definition: 'n. 法规；立法', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'dominance', phonetic: '/ˈdɒmɪnəns/', definition: 'n. 支配；优势', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'cognitive', phonetic: '/ˈkɒɡnətɪv/', definition: 'adj. 认知的', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'sibling', phonetic: '/ˈsɪblɪŋ/', definition: 'n. 兄弟姐妹', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'replace', phonetic: '/rɪˈpleɪs/', definition: 'v. 取代；替换', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'contrast', phonetic: '/ˈkɒntrɑːst/', definition: 'n. 对比；对照', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'restrictive', phonetic: '/rɪˈstrɪktɪv/', definition: 'adj. 限制的', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'indifferent', phonetic: '/ɪnˈdɪfrənt/', definition: 'adj. 漠不关心的', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'resemble', phonetic: '/rɪˈzembl/', definition: 'v. 相似；像', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'sponsor', phonetic: '/ˈspɒnsə/', definition: 'v. 赞助；发起', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'represent', phonetic: '/ˌreprɪˈzent/', definition: 'v. 代表；表示', source: '选词填空 2019061', status: 'new', correctStreak: 0 },
  { word: 'immune', phonetic: '/ɪˈmjuːn/', definition: 'adj. 免疫的', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'infection', phonetic: '/ɪnˈfekʃn/', definition: 'n. 感染；传染病', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'colony', phonetic: '/ˈkɒləni/', definition: 'n. 殖民地；群体', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'scholarship', phonetic: '/ˈskɒləʃɪp/', definition: 'n. 奖学金', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'recommendation', phonetic: '/ˌrekəmenˈdeɪʃn/', definition: 'n. 推荐；建议', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'graduate', phonetic: '/ˈɡrædʒuət/', definition: 'n. 毕业生', source: '仔细阅读 2019061', status: 'new', correctStreak: 0 },
  { word: 'eliminate', phonetic: '/ɪˈlɪmɪneɪt/', definition: 'v. 消除；淘汰', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'procedure', phonetic: '/prəˈsiːdʒə/', definition: 'n. 程序；步骤', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'encourage', phonetic: '/ɪnˈkʌrɪdʒ/', definition: 'v. 鼓励', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'efficiency', phonetic: '/ɪˈfɪʃnsi/', definition: 'n. 效率', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'opportunity', phonetic: '/ˌɒpəˈtjuːnəti/', definition: 'n. 机会', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', definition: 'n. 环境', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'technology', phonetic: '/tekˈnɒlədʒi/', definition: 'n. 技术', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/', definition: 'adj. 重要的；显著的', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'establish', phonetic: '/ɪˈstæblɪʃ/', definition: 'v. 建立', source: '四级核心词', status: 'new', correctStreak: 0 },
  { word: 'committee', phonetic: '/kəˈmɪti/', definition: 'n. 委员会', source: '四级核心词', status: 'new', correctStreak: 0 },
]

function extractWords(): IVocabWord[] {
  return CET4_WORDS
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
