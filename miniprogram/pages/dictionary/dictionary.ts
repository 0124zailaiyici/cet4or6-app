import { lookupWord } from '../../utils/api'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IMeaning {
  partOfSpeech: string
  definitions: { definition: string; example?: string }[]
}

interface IWordResult {
  word: string
  phonetic: string
  audio: string
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

Page<IDictData>({
  data: {
    query: '',
    result: null,
    error: '',
    loading: false,
    history: [],
    darkMode: false,
  },

  onLoad() {
    this._applyDarkMode()
    const raw = wx.getStorageSync('dictHistory')
    if (raw) this.setData({ history: raw })
  },

  onShow() {
    this._applyDarkMode()
  },

  _applyDarkMode() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ query: e.detail.value, error: '', result: null })
  },

  async search(e?: WechatMiniprogram.TouchEvent) {
    const word = e?.currentTarget?.dataset?.word as string | undefined
    const q = (word || this.data.query).trim()
    if (!q) return
    this.setData({ loading: true, error: '', result: null })
    if (word) this.setData({ query: word })

    try {
      const data = await lookupWord(q)
      const entry = Array.isArray(data) ? data[0] : data
      const phonetics = entry.phonetics || []
      const phonetic = entry.phonetic || phonetics.find((p: any) => p.text)?.text || ''
      const audio = phonetics.find((p: any) => p.audio)?.audio || ''
      const result: IWordResult = {
        word: entry.word,
        phonetic,
        audio,
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
      if (!history.includes(q.toLowerCase())) {
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

  playAudio() {
    const audioSrc = this.data.result?.audio
    if (!audioSrc) return
    const ctx = wx.createInnerAudioContext()
    ctx.src = audioSrc
    ctx.play()
  },
})
