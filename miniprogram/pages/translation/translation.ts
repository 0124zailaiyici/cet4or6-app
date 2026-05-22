import { correctTranslation } from '../../utils/api'
import translationsData from '../../data/translations'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface ITranslation {
  id: number
  chinese: string
  reference: string
  source: string
}

interface IDimensions {
  vocabulary: number
  grammar: number
  semantics: number
  expression: number
}

interface ITranslationRecord {
  id: number
  userAnswer: string
  score: number
  dimensions?: IDimensions
  suggestions?: string
  reference?: string
  date: string
}

interface ITranslationData {
  mode: 'list' | 'detail'
  translations: ITranslation[]
  currentItem: ITranslation | null
  userAnswer: string
  result: {
    score: number
    dimensions?: IDimensions
    suggestions: string
    reference: string
    show: boolean
  } | null
  history: ITranslationRecord[]
  questionHistory: ITranslationRecord[]
  completedIds: number[]
  submitting: boolean
  darkMode: boolean
}

Page({
  data: {
    mode: 'list',
    translations: [],
    currentItem: null,
    userAnswer: '',
    result: null,
    history: [],
    questionHistory: [],
    completedIds: [],
    submitting: false,
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    const items = translationsData as ITranslation[]
    const history = (app.globalData.studyData.translationRecords || []) as ITranslationRecord[]
    const completedIds = [...new Set(history.map(r => r.id))]
    this.setData({ translations: items, history, completedIds })
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.translations.find(t => t.id === id) || null
    const questionHistory = this.data.history.filter(r => r.id === id)
    this.setData({
      mode: 'detail',
      currentItem: item,
      userAnswer: '',
      result: null,
      questionHistory,
    })
  },

  backToList() {
    this.setData({
      mode: 'list',
      currentItem: null,
      result: null,
      questionHistory: [],
    })
  },

  onInput(e: WechatMiniprogram.Input) {
    this.setData({ userAnswer: e.detail.value })
  },

  async submit() {
    const { userAnswer, currentItem, submitting } = this.data
    if (submitting) return
    if (!userAnswer.trim() || !currentItem) {
      wx.showToast({ title: '请输入翻译', icon: 'none' })
      return
    }

    this.setData({ submitting: true })

    const answer = userAnswer.trim()
    let score = 0
    let suggestions = ''
    let reference = currentItem.reference
    let dimensions: IDimensions | undefined

    try {
      const ai = await correctTranslation(currentItem.chinese, answer)
      score = ai.score
      suggestions = ai.suggestions
      if (ai.reference) reference = ai.reference
      dimensions = ai.dimensions
    } catch {
      score = this.calcScore(answer, reference)
      suggestions = score >= 90
        ? '翻译很准确，继续保持！'
        : score >= 70
          ? `翻译基本正确。建议参考：${reference}`
          : `需要改进。参考译文：${reference}`
    }

    const record: ITranslationRecord = {
      id: currentItem.id,
      userAnswer: answer,
      score,
      dimensions,
      suggestions,
      reference,
      date: new Date().toISOString().slice(0, 10),
    }

    const app = getApp<IAppOption>()
    const records = [...(app.globalData.studyData.translationRecords || []), record]
    app.globalData.studyData.translationRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn()

    const allIds = [...new Set(records.map(r => r.id))]
    const questionHistory = records.filter(r => r.id === currentItem.id)

    this.setData({
      result: {
        score,
        dimensions,
        suggestions,
        reference,
        show: true,
      },
      submitting: false,
      history: records,
      completedIds: allIds,
      questionHistory,
    })
  },

  retry() {
    this.setData({
      userAnswer: '',
      result: null,
    })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  calcScore(answer: string, ref: string): number {
    const norm = (s: string) =>
      s.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').split(/\s+/).filter(Boolean)
    const aWords = norm(answer)
    const rWords = norm(ref)
    if (rWords.length === 0) return 0

    const rSet = new Set(rWords)
    const aSet = new Set(aWords)

    let unigramHits = 0
    for (const w of aWords) {
      if (rSet.has(w)) unigramHits++
    }
    const unigramScore = unigramHits / Math.max(rWords.length, aWords.length)

    const toBigrams = (words: string[]) => {
      const s = new Set<string>()
      for (let i = 0; i < words.length - 1; i++) {
        s.add(`${words[i]} ${words[i + 1]}`)
      }
      return s
    }
    const aBigrams = toBigrams(aWords)
    const rBigrams = toBigrams(rWords)
    let bigramHits = 0
    for (const b of aBigrams) {
      if (rBigrams.has(b)) bigramHits++
    }
    const bigramScore = rBigrams.size > 0
      ? bigramHits / Math.max(rBigrams.size, aBigrams.size)
      : 0

    return Math.round((unigramScore * 0.6 + bigramScore * 0.4) * 100)
  },
})
