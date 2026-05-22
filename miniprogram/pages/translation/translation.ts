import { correctTranslation, checkHealth } from '../../utils/api'
import translationsData from '../../data/translations'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { scoreTranslation, ScorerResult } from '../../utils/scorer'

const EMOJIS: Record<string, string> = {
  '中国是一个历史悠久、文化丰富的国家。': '🇨🇳',
  '越来越多的人意识到环境保护的重要性。': '🌿',
  '春节是中国最重要的传统节日，家人会聚在一起吃年夜饭。': '🧧',
  '随着互联网的发展，移动支付在中国变得越来越普遍。': '📱',
  '据报道，今年参加高考的学生人数创下了历史新高。': '🎓',
  '太极拳是一种传统的中国武术，深受老年人的喜爱。': '🧘',
  '这座博物馆收藏了大量珍贵的文物，吸引了来自世界各地的游客。': '🏛️',
  '手机已经成为我们日常生活中不可或缺的一部分。': '📱',
  '为了保持健康，我们应该多吃水果和蔬菜，少吃垃圾食品。': '🥗',
  '共享单车为人们提供了一种便捷、环保的出行方式。': '🚲',
  '舞狮作为中国传统民间表演已有2000多年历史。在狮子舞中，两位表演者同披一件狮子服，一个舞动头部，另一个舞动身体和尾巴。他们熟练配合，模仿狮子的各种动作。狮子是兽中之王，象征幸福和好运，所以人们通常在春节和其他节日期间表演狮子舞。狮子舞也可能出现在其他重要场合，如商店开业和结婚典礼，往往吸引许多人观赏。': '🦁',
}

function getEmoji(chinese: string): string {
  return EMOJIS[chinese] || '📝'
}

function getTag(item: { source: string; chinese: string }): { type: string; label: string } {
  if (item.chinese.length > 80) return { type: 'para', label: '段落' }
  if (item.source.includes('真题')) return { type: 'exam', label: '真题' }
  return { type: 'sim', label: '模拟' }
}

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
  wordCount: number
  hMax: number
  hMin: number
  hTrend: string
  pct: number
  ringDeg: number
}

function genSuggestions(s: ScorerResult): string {
  if (s.total >= 90) return '太棒啦，翻译很准确，继续保持～ 🌟'
  if (s.total >= 80) return '不错哦，整体很好，试试用更丰富的表达吧 ✨'
  const parts: string[] = []
  if (s.dimensions.vocabulary < 60) parts.push('关键词有遗漏，注意覆盖核心词汇')
  if (s.dimensions.grammar < 60) parts.push('句式可以调整一下，让结构更自然')
  if (s.dimensions.semantics < 60) parts.push('意思表达不够准确，再对照下原文')
  if (s.dimensions.expression < 60) parts.push('表达可以更地道，参考英语习惯用法')
  if (parts.length === 0) return '基本正确，再打磨一下就完美啦 💪'
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
    wordCount: 0,
    pct: 0,
    ringDeg: 0,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
    const items = (translationsData as ITranslation[]).filter(t => t && t.chinese)
    const history = (app.globalData.studyData.translationRecords || []) as ITranslationRecord[]
    const currentIds = new Set(items.map(t => t.id))
    const completedIds = [...new Set(history.map(r => r.id))].filter(id => currentIds.has(id))

    const pct = completedIds.length > 0 ? Math.round(completedIds.length / items.length * 100) : 0
    const ringDeg = Math.round(pct / 100 * 360)
    const listItems = items.map(t => ({
      ...t,
      _display: t.chinese.length > 40 ? t.chinese.slice(0, 40) + '…' : t.chinese,
      _emoji: getEmoji(t.chinese),
      _tag: getTag(t),
    }))
    this.setData({ translations: listItems, history, completedIds, pct, ringDeg })

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
    wordCount: 0,
    hMax: 0,
    hMin: 0,
    hTrend: 'up',
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
    this.setData({ userAnswer: e.detail.value, wordCount: e.detail.value.length })
  },

  async submit() {
    const { userAnswer, currentItem, submitting } = this.data
    if (submitting) return
    if (!userAnswer.trim() || !currentItem) {
      wx.showToast({ title: '写点内容再提交吧～', icon: 'none' })
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
      } catch { /* keep local */ }
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

    const validIds = new Set(this.data.translations.map(t => t.id))
    const allIds = [...new Set(records.map(r => r.id))].filter(id => validIds.has(id))
    const questionHistory = records.filter(r => r.id === currentItem.id)
    const hScores = questionHistory.map(r => r.score)
    const hMax = hScores.length > 0 ? Math.max(...hScores) : score
    const hMin = hScores.length > 0 ? Math.min(...hScores) : score
    const hTrend = questionHistory.length >= 1 && score >= hScores[hScores.length - 1] ? 'up' : 'down'

    this.setData({
      result: { score, dimensions, suggestions, reference, show: true },
      submitting: false,
      history: records,
      completedIds: allIds,
      questionHistory,
      hMax,
      hMin,
      hTrend,
    })
  },

  retry() {
    this.setData({ userAnswer: '', result: null, wordCount: 0 })
    wx.pageScrollTo({ scrollTop: 0, duration: 200 })
  },

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('translationAiEnabled', val)
  },
})
