import { correctTranslation } from '../../utils/api'
import translationsData from '../../data/translations'
import { doCheckIn } from '../../utils/checkin'

interface ITranslation {
  id: number
  chinese: string
  reference: string
  source: string
}

interface ITranslationRecord {
  id: number
  userAnswer: string
  score: number
  date: string
}

interface ITranslationData {
  mode: 'list' | 'detail'
  translations: ITranslation[]
  currentItem: ITranslation | null
  userAnswer: string
  result: {
    score: number
    suggestions: string
    show: boolean
  } | null
  history: ITranslationRecord[]
  completedIds: number[]
  submitting: boolean
  darkMode: boolean
}

interface ITranslationMethods {
  enterDetail(e: WechatMiniprogram.TouchEvent): void
  backToList(): void
  onInput(e: WechatMiniprogram.Input): void
  submit(): void
  calcScore(answer: string, ref: string): number
}

Page<ITranslationData, ITranslationMethods>({
  data: {
    mode: 'list',
    translations: [],
    currentItem: null,
    userAnswer: '',
    result: null,
    history: [],
    completedIds: [],
    submitting: false,
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    const items = translationsData as ITranslation[]
    const history = app.globalData.studyData.translationRecords
    const completedIds = history.map(r => r.id)
    this.setData({ translations: items, history, completedIds })
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.translations.find(t => t.id === id) || null
    this.setData({
      mode: 'detail',
      currentItem: item,
      userAnswer: '',
      result: null,
    })
  },

  backToList() {
    this.setData({ mode: 'list', currentItem: null, result: null })
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ userAnswer: e.detail.value })
  },

  async submit() {
    const { userAnswer, currentItem } = this.data
    if (!userAnswer.trim() || !currentItem) {
      wx.showToast({ title: '请输入翻译', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const answer = userAnswer.trim()
    let score = 0
    let suggestions = ''

    try {
      const ai = await correctTranslation(currentItem.chinese, answer)
      score = ai.score
      suggestions = ai.suggestions
    } catch {
      const ref = currentItem.reference
      score = this.calcScore(answer, ref)
      suggestions = score >= 90
        ? '翻译很准确，继续保持！'
        : score >= 70
          ? `翻译基本正确。建议参考：${ref}`
          : `需要改进。参考译文：${ref}`
    }

    const record: ITranslationRecord = {
      id: currentItem.id,
      userAnswer: answer,
      score,
      date: new Date().toISOString().slice(0, 10),
    }

    const app = getApp<IAppOption>()
    const records = [...app.globalData.studyData.translationRecords, record]
    app.globalData.studyData.translationRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn()

    const allIds = records.map(r => r.id)
    this.setData({
      result: { score, suggestions, show: true },
      submitting: false,
      history: records,
      completedIds: allIds,
    })
  },

  calcScore(answer: string, ref: string): number {
    const aWords = new Set(answer.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/))
    const rWords = new Set(ref.toLowerCase().replace(/[.,!?;:'"]/g, '').split(/\s+/))
    if (rWords.size === 0) return 0
    let hit = 0
    for (const word of aWords) {
      if (rWords.has(word)) hit++
    }
    return Math.round((hit / rWords.size) * 100)
  },
})
