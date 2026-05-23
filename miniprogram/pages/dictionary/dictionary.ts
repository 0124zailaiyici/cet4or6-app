import { lookupWord, checkHealth, aiFullDict } from '../../utils/api'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IMeaning {
  partOfSpeech: string
  _posClass: string
  synonyms: string[]
  antonyms: string[]
  definitions: { definition: string; example?: string; definitionCn?: string; exampleCn?: string }[]
}

interface IWordResult {
  word: string
  phonetic: string
  audio: string
  chinese: string
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
  aiAvailable: boolean
  aiEnabled: boolean
  exampleCount: number
}

const POS_MAP: Record<string, string> = {
  '名词': 'noun', 'noun': 'noun',
  '动词': 'verb', 'verb': 'verb',
  '形容词': 'adjective', 'adjective': 'adjective',
  '副词': 'adverb', 'adverb': 'adverb',
  '介词': 'preposition', 'preposition': 'preposition',
  '连词': 'conjunction', 'conjunction': 'conjunction',
  '代词': 'pronoun', 'pronoun': 'pronoun',
  '感叹词': 'interjection', 'interjection': 'interjection',
}

Page<IDictData>({
  data: {
    query: '',
    result: null,
    error: '',
    loading: false,
    history: [],
    darkMode: false,
    aiAvailable: false,
    aiEnabled: false,
    exampleCount: 0,
  },

  onLoad() {
    this._applyDarkMode()
    const raw = wx.getStorageSync('dictHistory')
    if (raw) this.setData({ history: raw })
    this.setData({ aiEnabled: wx.getStorageSync('dictAiEnabled') === true })
    checkHealth().then(r => {
      if (r.apiKey) this.setData({ aiAvailable: true })
    }).catch(() => {})
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
      let result: IWordResult

      if (this.data.aiAvailable && this.data.aiEnabled) {
        try {
          const ai = await aiFullDict(q)
          result = ai as IWordResult
          if (result.meanings) {
            result.meanings.forEach(m => { m._posClass = POS_MAP[m.partOfSpeech] || m.partOfSpeech })
          }
        } catch {
          this.setData({ aiEnabled: false })
          wx.setStorageSync('dictAiEnabled', false)
          return this.search()
        }
      } else {
        const data = await lookupWord(q)
        const entry = Array.isArray(data) ? data[0] : data
        const phonetics = entry.phonetics || []
        const phonetic = entry.phonetic || phonetics.find((p: any) => p.text)?.text || ''
        const audio = phonetics.find((p: any) => p.audio)?.audio || ''
        const chinese = entry.chinese || ''

        result = {
          word: entry.word,
          phonetic,
          audio,
          chinese,
          meanings: entry.meanings?.map((m: any) => ({
            partOfSpeech: m.partOfSpeech,
            _posClass: POS_MAP[m.partOfSpeech] || m.partOfSpeech,
            synonyms: m.synonyms?.slice(0, 5) || [],
            antonyms: m.antonyms?.slice(0, 5) || [],
            definitions: m.definitions?.slice(0, 3).map((d: any) => ({
              definition: d.definition,
              definitionCn: d.definitionCn || '',
              example: d.example || '',
              exampleCn: d.exampleCn || '',
            })) || [],
          })) || [],
          sourceUrls: entry.sourceUrls || [],
        }
      }
      const exampleCount = result.meanings.reduce((s, m) => s + m.definitions.filter(d => d.example).length, 0)
      this.setData({ result, exampleCount, loading: false, error: '' })

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

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('dictAiEnabled', val)
  },

  playAudio() {
    const audioSrc = this.data.result?.audio
    if (!audioSrc) return
    const ctx = wx.createInnerAudioContext()
    ctx.src = audioSrc
    ctx.play()
  },
})
