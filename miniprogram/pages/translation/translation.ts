import { correctTranslation, checkHealth } from '../../utils/api'
import translationsData from '../../data/translations'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { scoreTranslation, ScorerResult } from '../../utils/scorer'

interface ITranslation {
  id: number
  chinese: string
  reference: string
  source: string
  keywords?: string[]
  acceptableAnswers?: string[]
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
  dimensions: IDimensions
  suggestions?: string
  reference: string
  date: string
}

interface ITranslationData {
  mode: 'list' | 'detail'
  translations: ITranslation[]
  currentItem: ITranslation | null
  userAnswer: string
  result: {
    score: number
    dimensions: IDimensions
    suggestions: string
    reference: string
    show: boolean
  } | null
  history: ITranslationRecord[]
  questionHistory: ITranslationRecord[]
  completedIds: number[]
  submitting: boolean
  aiAvailable: boolean
  aiEnabled: boolean
  darkMode: boolean
}

function genSuggestions(s: ScorerResult): string {
  if (s.total >= 90) return '翻译很准确，继续保持！'
  if (s.total >= 80) return '翻译整体不错，可以尝试更丰富的表达方式！'
  const parts: string[] = []
  if (s.dimensions.vocabulary < 60) parts.push('关键词使用不足，注意覆盖题目核心词汇')
  if (s.dimensions.grammar < 60) parts.push('句子结构与参考译文差异较大，建议调整句式')
  if (s.dimensions.semantics < 60) parts.push('语义表达不够准确，注意传达原文意思')
  if (s.dimensions.expression < 60) parts.push('表达不够地道，建议参考英语习惯用法')
  if (parts.length === 0) return '翻译基本正确，在个别方面还可以提升'
  return parts.join('；')
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
    aiAvailable: false,
    aiEnabled: wx.getStorageSync('translationAiEnabled') !== false,
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    const items = translationsData as ITranslation[]
    const history = (app.globalData.studyData.translationRecords || []) as ITranslationRecord[]
    const completedIds = [...new Set(history.map(r => r.id))]
    this.setData({ translations: items, history, completedIds })

    checkHealth().then(r => {
      if (r.apiKey) this.setData({ aiAvailable: true })
    }).catch(() => {})
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
    const local = scoreTranslation(answer, currentItem)

    let score = local.total
    let dimensions = local.dimensions
    let suggestions = genSuggestions(local)
    let reference = currentItem.reference

    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const ai = await Promise.race([
          correctTranslation(currentItem.chinese, answer),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])
        if (ai.dimensions) dimensions = ai.dimensions
        if (ai.suggestions) suggestions = ai.suggestions
        if (ai.reference) reference = ai.reference
        if (ai.score && Math.abs(ai.score - score) > 15) {
          score = Math.round((score + ai.score) / 2)
        }
      } catch {
        /* local scoring is the fallback, keep current values */
      }
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

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('translationAiEnabled', val)
  },
})
