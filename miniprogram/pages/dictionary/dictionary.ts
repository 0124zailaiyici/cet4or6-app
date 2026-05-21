import { lookupWord } from '../../utils/api'

interface IMeaning {
  partOfSpeech: string
  definitions: { definition: string; example?: string }[]
}

interface IWordResult {
  word: string
  phonetic: string
  meanings: IMeaning[]
  sourceUrls: string[]
}

interface IDictData {
  query: string
  result: IWordResult | null
  error: string
  loading: boolean
  history: string[]
  darkMode: boolean
}

interface IDictMethods {
  onInput(e: WechatMiniprogram.Input): void
  search(): void
  clear(): void
}

Page<IDictData, IDictMethods>({
  data: {
    query: '',
    result: null,
    error: '',
    loading: false,
    history: [],
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    this.setData({ history: app.globalData.studyData.favoriteSentenceIds.length > 0 ? [] : [] })
    const raw = wx.getStorageSync('dictHistory')
    if (raw) this.setData({ history: raw })
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ query: e.detail.value, error: '', result: null })
  },

  async search() {
    const q = this.data.query.trim()
    if (!q) return
    this.setData({ loading: true, error: '', result: null })

    try {
      const data = await lookupWord(q)
      const entry = Array.isArray(data) ? data[0] : data
      const result: IWordResult = {
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '',
        meanings: entry.meanings?.map((m: any) => ({
          partOfSpeech: m.partOfSpeech,
          definitions: m.definitions?.slice(0, 3).map((d: any) => ({
            definition: d.definition,
            example: d.example || '',
          })) || [],
        })) || [],
        sourceUrls: entry.sourceUrls || [],
      }
      this.setData({ result, loading: false, error: '' })

      const history = this.data.history
      if (history.indexOf(q.toLowerCase()) === -1) {
        history.unshift(q.toLowerCase())
        if (history.length > 20) history.pop()
        wx.setStorageSync('dictHistory', history)
        this.setData({ history })
      }
    } catch {
      this.setData({ error: '未找到该单词，请检查拼写', loading: false })
    }
  },

  clear() {
    this.setData({ query: '', result: null, error: '' })
  },
})
