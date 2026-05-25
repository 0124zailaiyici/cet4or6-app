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
const TOPICS: Record<string, string> = {
  '中国是一个历史悠久、文化丰富的国家。': '文化', '越来越多的人意识到环境保护的重要性。': '环保',
  '春节是中国最重要的传统节日，家人会聚在一起吃年夜饭。': '文化', '随着互联网的发展，移动支付在中国变得越来越普遍。': '科技',
  '据报道，今年参加高考的学生人数创下了历史新高。': '教育', '太极拳是一种传统的中国武术，深受老年人的喜爱。': '文化',
  '这座博物馆收藏了大量珍贵的文物，吸引了来自世界各地的游客。': '文化', '手机已经成为我们日常生活中不可或缺的一部分。': '科技',
  '为了保持健康，我们应该多吃水果和蔬菜，少吃垃圾食品。': '健康', '共享单车为人们提供了一种便捷、环保的出行方式。': '环保',
}

function getLevel(chinese: string): number {
  const len = chinese.length
  if (len <= 10) return 1
  if (len <= 30) return 2
  if (len <= 80) return 3
  return 4
}

function getEmoji(chinese: string): string { return EMOJIS[chinese] || '📝' }
function getTopic(chinese: string): string { return TOPICS[chinese] || '其他' }

function getTag(item: { source: string; chinese: string }): { type: string; label: string } {
  if (item.chinese.length > 80) return { type: 'para', label: '段落' }
  if (item.source.includes('真题')) return { type: 'exam', label: '真题' }
  return { type: 'sim', label: '模拟' }
}

function genSuggestions(s: ScorerResult): string {
  if (s.total >= 90) return '太棒啦，翻译很准确，继续保持～ 🌟'
  if (s.total >= 80) return '不错哦，整体很好，试试用更丰富的表达吧 ✨'
  const parts: string[] = []
  if (s.dimensions.vocabulary < 60) parts.push('关键词有遗漏，注意覆盖核心词汇')
  if (s.dimensions.grammar < 60) parts.push('句式可以调整一下')
  if (s.dimensions.semantics < 60) parts.push('意思表达不够准确')
  if (s.dimensions.expression < 60) parts.push('表达可以更地道')
  if (parts.length === 0) return '基本正确，再打磨一下就完美啦 💪'
  return parts.join('；')
}

/* 逐词对照 */
function wordCompare(user: string, ref: string): { word: string; ok: boolean }[] {
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').split(/\s+/).filter(Boolean)
  const u = norm(user)
  const r = norm(ref)
  const rSet = new Set(r)
  return u.map(w => ({ word: w, ok: rSet.has(w) }))
}

interface ITranslation { id: number; chinese: string; reference: string; source: string; keywords?: string[]; acceptableAnswers?: string[] }
interface IDimensions { vocabulary: number; grammar: number; semantics: number; expression: number }
interface ITranslationRecord { id: number; userAnswer: string; score: number; dimensions: IDimensions; suggestions?: string; reference: string; date: string }

Page({
  data: {
    page: 'dashboard', step: 'list', translations: [], currentItem: null as ITranslation | null,
    userAnswer: '', result: null as { score: number; dimensions: IDimensions; suggestions: string; reference: string; show: boolean } | null,
    history: [] as ITranslationRecord[], questionHistory: [] as ITranslationRecord[], completedIds: [] as number[],
    submitting: false, aiAvailable: false, aiEnabled: wx.getStorageSync('translationAiEnabled') !== false,
    darkMode: false, wordCount: 0, pct: 0, ringDeg: 0,
    levels: [] as { total: number; done: number; pct: number }[],
    hMax: 0, hMin: 0, hTrend: 'up', favIds: (wx.getStorageSync('translationFavIds') || []) as number[],
    words: [] as { word: string; ok: boolean }[],
    todayItem: null as any,
    weakPoints: [] as { key: string; label: string; avg: number; count: number }[],
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode }); this.loadData()
    checkHealth().then(r => { if (r.apiKey) this.setData({ aiAvailable: true }) }).catch(() => {})
  },

  onShow() {
    applyTheme(getDarkMode()); const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode }); this.loadData()
  },

  loadData() {
    const app = getApp<IAppOption>()
    const items = (translationsData as ITranslation[]).filter(t => t && t.chinese)
    const history = (app.globalData.studyData.translationRecords || []) as ITranslationRecord[]
    const currentIds = new Set(items.map(t => t.id))
    const completedIds = [...new Set(history.map(r => r.id))].filter(id => currentIds.has(id))
    const pct = completedIds.length > 0 ? Math.round(completedIds.length / items.length * 100) : 0
    const doneSet = new Set(completedIds); const favSet = new Set(this.data.favIds)
    const HINTS = ['先找主语谓语，再添加修饰', '注意"的"字结构处理', '注意逻辑关系词的位置', '先拆成短句再组合']
    const listItems = items.map(t => {
      const lv = getLevel(t.chinese)
      return {
        ...t, _display: t.chinese.length > 40 ? t.chinese.slice(0, 40) + '…' : t.chinese,
        _emoji: getEmoji(t.chinese), _tag: getTag(t), _level: lv, _topic: getTopic(t.chinese),
        _done: doneSet.has(t.id), _fav: favSet.has(t.id), _hint: HINTS[lv - 1] || HINTS[0],
      }
    })
    const levels = [1, 2, 3, 4].map(lv => {
      const total = items.filter(t => getLevel(t.chinese) === lv).length
      const done = completedIds.filter(id => { const t = items.find(t => t.id === id); return t && getLevel(t.chinese) === lv }).length
      return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 }
    })
    /* 今日推荐：找第一个未完成的 L1 或 L2 题 */
    const todo = listItems.filter(t => !t._done)
    const todayItem = todo.length > 0 ? (todo.find(t => t._level <= 2) || todo[0]) : null
    // 弱项分析
    const dimNames: Record<string, string> = { vocabulary: '词汇', grammar: '语法', semantics: '语义', expression: '表达' }
    const dimScores: Record<string, number[]> = {}
    for (const h of history) {
      if (!h.dimensions) continue
      for (const [k, v] of Object.entries(h.dimensions)) {
        if (!dimScores[k]) dimScores[k] = []; dimScores[k].push(v)
      }
    }
    const weakPoints: { key: string; label: string; avg: number; count: number }[] = Object.entries(dimScores).map(([k, vals]) => {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      return { key: k, label: dimNames[k] || k, avg, count: vals.length }
    }).sort((a, b) => a.avg - b.avg)
    this.setData({ translations: listItems, history, completedIds, pct, ringDeg: Math.round(pct / 100 * 360), levels, todayItem, weakPoints })
  },

  switchPage(e: any) {
    const p = typeof e === 'string' ? e : e.currentTarget.dataset.page
    if (p === 'practice' && !this.data.currentItem) { wx.showToast({ title: '请先从列表选一题', icon: 'none' }); return }
    this.setData({ page: p || 'dashboard', result: null, userAnswer: '', wordCount: 0 })
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.translations.find((t: any) => t.id === id) || null
    const questionHistory = this.data.history.filter(r => r.id === id)
    this.setData({ page: 'practice', step: 'prepare', currentItem: item, userAnswer: '', result: null, questionHistory, wordCount: 0, words: [] })
  },

  goStep(e: any) {
    const n = typeof e === 'number' ? e : parseInt(e.currentTarget.dataset.step)
    this.setData({ step: ['prepare', 'translate', 'compare'][n - 1] })
  },

  onInput(e: WechatMiniprogram.Input) { this.setData({ userAnswer: e.detail.value, wordCount: e.detail.value.length }) },

  async submit() {
    const { userAnswer, currentItem, submitting } = this.data
    if (submitting) return
    if (!userAnswer.trim() || !currentItem) { wx.showToast({ title: '写点内容再提交吧～', icon: 'none' }); return }
    this.setData({ submitting: true })
    const answer = userAnswer.trim()
    const local = scoreTranslation(answer, currentItem)
    let score = local.total, dimensions = local.dimensions, suggestions = genSuggestions(local), reference = currentItem.reference

    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const ai = await Promise.race([correctTranslation(currentItem.chinese, answer), new Promise<never>((_, r) => setTimeout(() => r(new Error('timeout')), 8000))])
        if (ai.dimensions) dimensions = ai.dimensions
        if (ai.suggestions) suggestions = ai.suggestions
        if (ai.reference) reference = ai.reference
        if (ai.score && Math.abs(ai.score - score) > 15) score = Math.round((score + ai.score) / 2)
      } catch {}
    }

    const words = wordCompare(answer, reference)
    const record: ITranslationRecord = { id: currentItem.id, userAnswer: answer, score, dimensions, suggestions, reference, date: new Date().toISOString().slice(0, 10) }
    const app = getApp<IAppOption>()
    const records = [...(app.globalData.studyData.translationRecords || []), record]
    app.globalData.studyData.translationRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn('translation')

    const validIds = new Set(this.data.translations.map((t: any) => t.id))
    const allIds = [...new Set(records.map(r => r.id))].filter(id => validIds.has(id))
    const doneSet = new Set(allIds)
    const questionHistory = records.filter(r => r.id === currentItem.id)
    const hScores = questionHistory.map(r => r.score)

    this.setData({
      result: { score, dimensions, suggestions, reference, show: true },
      submitting: false, step: 'compare', history: records, completedIds: allIds, questionHistory,
      hMax: Math.max(...hScores, score), hMin: Math.min(...hScores, score),
      hTrend: questionHistory.length >= 1 && score >= hScores[hScores.length - 1] ? 'up' : 'down',
      translations: this.data.translations.map((t: any) => ({ ...t, _done: doneSet.has(t.id) })),
      words,
    })
  },

  nextQ() {
    const { currentItem, translations } = this.data
    if (!currentItem) return
    const idx = translations.findIndex((t: any) => t.id === currentItem.id)
    const lv = (currentItem as any)._level || 1
    /* 找同等级下一题 */
    let next = translations.slice(idx + 1).find((t: any) => t._level === lv && !t._done)
    /* 没有未完成的同等级题，找下一等级 */
    if (!next) next = translations.slice(idx + 1).find((t: any) => !t._done)
    /* 兜底：从头找第一个未完成 */
    if (!next) next = translations.find((t: any) => !t._done)
    /* 全部完成 */
    if (!next) { wx.showToast({ title: '全部完成啦 🎉', icon: 'none' }); this.setData({ page: 'dashboard', currentItem: null, result: null }); return }
    this.setData({ currentItem: next, step: 'prepare', userAnswer: '', result: null, wordCount: 0, words: [] })
    wx.pageScrollTo({ scrollTop: 0 })
  },

  retry() { this.setData({ userAnswer: '', result: null, wordCount: 0, step: 'translate', words: [] }) },

  toggleFav(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    let favIds = [...this.data.favIds]; const idx = favIds.indexOf(id)
    if (idx >= 0) favIds.splice(idx, 1); else favIds.push(id)
    wx.setStorageSync('translationFavIds', favIds)
    const favSet = new Set(favIds)
    this.setData({ favIds, translations: this.data.translations.map((t: any) => ({ ...t, _fav: favSet.has(t.id) })) })
  },

  toggleAi() { const v = !this.data.aiEnabled; this.setData({ aiEnabled: v }); wx.setStorageSync('translationAiEnabled', v) },
})
