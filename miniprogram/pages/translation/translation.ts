import { correctTranslation, checkHealth } from '../../utils/api'
import translationsData from '../../data/translations'
import { doCheckIn, getTodayActivity } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { scoreTranslation, ScorerResult } from '../../utils/scorer'

const EMOJIS: Record<string, string> = {
  '中国是一个历史悠久、文化丰富的国家。': '🇨🇳', '越来越多的人意识到环境保护的重要性。': '🌿',
  '春节是中国最重要的传统节日，家人会聚在一起吃年夜饭。': '🧧', '随着互联网的发展，移动支付在中国变得越来越普遍。': '📱',
  '据报道，今年参加高考的学生人数创下了历史新高。': '🎓', '太极拳是一种传统的中国武术，深受老年人的喜爱。': '🧘',
  '这座博物馆收藏了大量珍贵的文物，吸引了来自世界各地的游客。': '🏛️', '手机已经成为我们日常生活中不可或缺的一部分。': '📱',
  '为了保持健康，我们应该多吃水果和蔬菜，少吃垃圾食品。': '🥗', '共享单车为人们提供了一种便捷、环保的出行方式。': '🚲',
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
  if (len <= 10) return 1; if (len <= 30) return 2; if (len <= 80) return 3; return 4
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

function wordCompare(user: string, ref: string): { word: string; ok: boolean }[] {
  const norm = (s: string) => s.toLowerCase().replace(/[.,!?;:'"()\-]/g, '').split(/\s+/).filter(Boolean)
  const u = norm(user); const r = norm(ref); const rSet = new Set(r)
  return u.map(w => ({ word: w, ok: rSet.has(w) }))
}

/* 增强翻译提示 */
const HINTS_MAP: Record<string, { struct: string; words: string[]; tense: string; mistakes: string[]; advanced: string }> = {
  '中国是一个历史悠久、文化丰富的国家。': {
    struct: '「是…的」结构 → China is a country with / that boasts …',
    words: ['历史悠久 → with a long history', '文化丰富 → rich culture / a splendid culture', '国家 → country / nation'],
    tense: '描述客观事实，用一般现在时 is',
    mistakes: ['"China has a long history and rich culture" 更简洁但少了"国家"的对应'],
    advanced: 'China is a nation boasting a time-honored history and a magnificent culture.',
  },
  '越来越多的人意识到环境保护的重要性。': {
    struct: '「越来越多的人」+「意识到」+「…的重要性」',
    words: ['越来越多 → more and more / a growing number of / increasingly', '意识到 → realize / become aware of / come to recognize', '重要性 → importance / significance'],
    tense: '描述的是一种已发生的趋势，建议用现在完成时 have realized',
    mistakes: ['"environmental protect" ✗ → protection（protect 是动词）', '"more and more people realize" → 用 have realized 更准确'],
    advanced: 'A growing number of individuals have become increasingly aware of the significance of environmental protection.',
  },
  '春节是中国最重要的传统节日，家人会聚在一起吃年夜饭。': {
    struct: '前半句「是」结构，后半句「会」表习惯性动作',
    words: ['最重要的 → the most important / the most significant', '传统节日 → traditional festival / traditional holiday', '聚在一起 → get together / gather', '年夜饭 → the New Year Eve dinner / the reunion dinner'],
    tense: '前半句一般现在时 is，后半句用 when 从句引导 + 一般现在时 gather',
    mistakes: ['"family" 单数表整体 → families 或 family members', '"eat dinner" 太直白 → have the dinner 更地道'],
    advanced: 'The Spring Festival, the most significant traditional holiday in China, is when families reunite for the New Year Eve feast.',
  },
  '随着互联网的发展，移动支付在中国变得越来越普遍。': {
    struct: '「随着」+ 主题 + 「越来越…」',
    words: ['随着 → With the development of / As … develops', '移动支付 → mobile payment / mobile payment services', '越来越普遍 → increasingly popular / more and more common / widespread'],
    tense: '描述已发生的趋势，主句用现在完成时 have become',
    mistakes: ['"With the Internet development" → With the development of the Internet', '"more and more popular" → increasingly popular 更简洁'],
    advanced: 'With the rapid advancement of the Internet, mobile payment has gained increasing popularity across China.',
  },
  '据报道，今年参加高考的学生人数创下了历史新高。': {
    struct: '「据报道」开头 + 主语 + 谓语 + 宾语（创下纪录）',
    words: ['据报道 → It is reported that / According to reports', '参加高考 → taking the college entrance examination / sitting for the CET', '创下新高 → reached a record high / hit an all-time high'],
    tense: '报道已发生的事实，用现在完成时 has reached',
    mistakes: ['"the number of students" 作主语 → 谓语用单数 has', '"college entrance exam" 是大专院校入学考试，高考特指 Gaokao 也可接受'],
    advanced: 'It has been reported that the number of students sitting for the national college entrance exam this year has hit an unprecedented record.',
  },
  '太极拳是一种传统的中国武术，深受老年人的喜爱。': {
    struct: '「是」结构 + 补充说明「深受…喜爱」',
    words: ['太极拳 → Tai Chi / Tai Chi Chuan', '传统的中国武术 → a traditional Chinese martial art', '深受…喜爱 → is very popular among / is deeply loved by / is adored by', '老年人 → the elderly / senior citizens / older adults'],
    tense: '一般现在时，描述客观事实',
    mistakes: ['"Tai Chi" 固定搭配，不是 "Tai Ji"', '"old people" 不够礼貌 → the elderly / senior citizens'],
    advanced: 'Tai Chi, a quintessential Chinese martial art, enjoys immense popularity among senior citizens.',
  },
  '这座博物馆收藏了大量珍贵的文物，吸引了来自世界各地的游客。': {
    struct: '主语（博物馆）+ 谓语1（收藏）+ 谓语2（吸引）',
    words: ['博物馆 → museum', '收藏 → houses / contains / boasts a collection of', '珍贵的文物 → precious cultural relics / invaluable artifacts', '吸引 → attracting / drawing / appealing to'],
    tense: '一般现在时，逗号后现在分词 attracting 表伴随结果',
    mistakes: ['"a large collection of precious cultural" → cultural 后加 relics', '"attract visitors from all over the world" → from all corners of the world 更生动'],
    advanced: 'Housing a vast array of invaluable cultural relics, this museum draws visitors from every corner of the globe.',
  },
  '手机已经成为我们日常生活中不可或缺的一部分。': {
    struct: '主语（手机）+ 谓语（已经成为）+ 宾语（…的一部分）',
    words: ['手机 → mobile phones / smartphones / cellphones', '已经成为 → have become / have evolved into', '不可或缺的 → indispensable / essential / integral', '日常生活 → daily life / everyday life'],
    tense: '现在完成时 have become，表示从过去延续至今的状态',
    mistakes: ['"mobile phone" 单数泛指要用 Mobile phones（复数）', '"an indispensable part" → an indispensable part of 固定搭配'],
    advanced: 'Smartphones have evolved into an integral part of our everyday existence.',
  },
  '为了保持健康，我们应该多吃水果和蔬菜，少吃垃圾食品。': {
    struct: '"为了" 表目的 + 建议（应该做…）',
    words: ['为了 → To / In order to / For the sake of', '保持健康 → stay healthy / keep fit / maintain good health', '多吃… → eat more … / increase the intake of …', '垃圾食品 → junk food / processed food'],
    tense: '用情态动词 should 表示建议，也可用 we ought to',
    mistakes: ['"eat more vegetables and fruits" → 英语习惯先 fruit 后 vegetable', '"less junk food" → cut down on / reduce junk food 更地道'],
    advanced: 'To maintain optimal health, we ought to increase our intake of fruits and vegetables while cutting back on processed foods.',
  },
  '共享单车为人们提供了一种便捷、环保的出行方式。': {
    struct: '主语 + 为某人 + 提供 + 某物',
    words: ['共享单车 → shared bikes / shared bicycles / bike-sharing services', '提供 → provide / offer / furnish', '便捷的 → convenient / hassle-free', '环保的 → environmentally friendly / eco-friendly / green'],
    tense: '一般现在时，描述普遍事实',
    mistakes: ['"provide people a way" → provide + 人 + with + 物 或 provide + 物 + to/for + 人', '"travel way" → way to travel / mode of transportation'],
    advanced: 'Bike-sharing services offer citizens an eco-friendly and hassle-free mode of urban transportation.',
  },
}
/* 长段落统一用默认提示 */
function getHints(chinese: string): { struct: string; words: string[]; tense: string; mistakes: string[]; advanced: string } {
  return HINTS_MAP[chinese] || {
    struct: '长段落先拆成若干短句，逐句翻译后再连接。注意保持中文的逻辑顺序。',
    words: ['先找出每句的主语', '判断时态（一般/完成/进行）', '注意"的"字结构处理', '长定语用从句后置'],
    tense: '叙述性段落用一般现在时；神话/历史类用一般过去时',
    mistakes: ['长句不要直译，拆成 2~3 个短句更自然', '注意中英文标点差异（逗号/句号位置）'],
    advanced: '逐句翻译后，用连接词 (however / moreover / therefore) 增强逻辑连贯性。',
  }
}

interface ITranslation { id: number; chinese: string; reference: string; source: string; keywords?: string[]; acceptableAnswers?: string[] }
interface IDimensions { vocabulary: number; grammar: number; semantics: number; expression: number }
interface ITranslationRecord { id: number; userAnswer: string; score: number; dimensions: IDimensions; suggestions?: string; reference: string; date: string }
interface ITranslationItem extends ITranslation {
  _display: string; _emoji: string; _tag: { type: string; label: string }
  _level: number; _topic: string; _done: boolean; _fav: boolean; _hint: ReturnType<typeof getHints>
}

Page({
  data: {
    page: 'dashboard', step: 'list', translations: [] as ITranslationItem[], currentItem: null as ITranslation | null,
    userAnswer: '', result: null as { score: number; dimensions: IDimensions; suggestions: string; reference: string; show: boolean } | null,
    history: [] as ITranslationRecord[], questionHistory: [] as ITranslationRecord[], completedIds: [] as number[],
    submitting: false, aiAvailable: false, aiEnabled: wx.getStorageSync('translationAiEnabled') !== false,
    darkMode: false, wordCount: 0, pct: 0, ringDeg: 0, todayCount: 0, streakDays: 0,
    levels: [] as { total: number; done: number; pct: number }[],
    hMax: 0, hMin: 0, hTrend: 'up', favIds: (wx.getStorageSync('translationFavIds') || []) as number[],
    words: [] as { word: string; ok: boolean }[],
    showHints: false,
    todayItem: null as any, todayItems: [] as any[], todayReason: '',
    weakPoints: [] as { key: string; label: string; avg: number; count: number; _icon: string }[],
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
    const listItems = items.map(t => {
      const lv = getLevel(t.chinese)
      return { ...t, _display: t.chinese.length > 40 ? t.chinese.slice(0, 40) + '…' : t.chinese,
        _emoji: getEmoji(t.chinese), _tag: getTag(t), _level: lv, _topic: getTopic(t.chinese),
        _done: doneSet.has(t.id), _fav: favSet.has(t.id), _hint: getHints(t.chinese),
      }
    }) as ITranslationItem[]
    const levels = [1, 2, 3, 4].map(lv => {
      const total = items.filter(t => getLevel(t.chinese) === lv).length
      const done = completedIds.filter(id => { const t = items.find(t => t.id === id); return t && getLevel(t.chinese) === lv }).length
      return { total, done, pct: total > 0 ? Math.round(done / total * 100) : 0 }
    })

    /* 今日任务 */
    const todo = listItems.filter(t => !t._done)
    const todayItem = todo.length > 0 ? (todo.find(t => t._level <= 2) || todo[0]) : null
    const todayItems = todo.slice(0, 3)

    /* 今日真实数据 */
    const act = getTodayActivity()
    const streakDays = (app.globalData.studyData.checkInDates || []).length

    /* 推荐理由 */
    let todayReason = ''
    if (todayItem) {
      const found = listItems.find(t => t._topic && !doneSet.has(t.id))
      const weakTopic = found ? found._topic : undefined
      todayReason = weakTopic
        ? `你的「${weakTopic}」主题还没练习过，今天就从这里开始吧！先用关键词搭框架，再组织成完整句子。`
        : `今天推荐这题是因为你之前做过类似的，巩固一下会记得更牢～`
    }

    /* 弱项分析 */
    const dimNames: Record<string, string> = { vocabulary: '词汇', grammar: '语法', semantics: '语义', expression: '表达' }
    const dimScores: Record<string, number[]> = {}
    for (const h of history) {
      if (!h.dimensions) continue
      for (const [k, v] of Object.entries(h.dimensions)) {
        if (!dimScores[k]) dimScores[k] = []; dimScores[k].push(v)
      }
    }
    const iconMap: Record<string, string> = { vocabulary: '📖', grammar: '🔗', semantics: '🎯', expression: '✍️' }
    const weakPoints = Object.entries(dimScores).map(([k, vals]) => {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      return { key: k, label: dimNames[k] || k, avg, count: vals.length, _icon: iconMap[k] || '📝' }
    }).sort((a, b) => a.avg - b.avg)

    this.setData({
      translations: listItems, history, completedIds, pct, ringDeg: Math.round(pct / 100 * 360),
      levels, todayItem, todayItems, todayReason, weakPoints,
      todayCount: act.translation || 0, streakDays,
    })
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
    this.setData({ page: 'practice', step: 'prepare', currentItem: item, userAnswer: '', result: null, questionHistory, wordCount: 0, words: [], showHints: false })
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
    const records = [...(app.globalData.studyData.translationRecords || []), record] as ITranslationRecord[]
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
      submitting: false, step: 'compare', history: records as ITranslationRecord[], completedIds: allIds, questionHistory,
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
    let next = translations.slice(idx + 1).find((t: any) => t._level === lv && !t._done)
    if (!next) next = translations.slice(idx + 1).find((t: any) => !t._done)
    if (!next) next = translations.find((t: any) => !t._done)
    if (!next) { wx.showToast({ title: '全部完成啦 🎉', icon: 'none' }); this.setData({ page: 'dashboard', currentItem: null, result: null }); return }
    this.setData({ currentItem: next, step: 'prepare', userAnswer: '', result: null, wordCount: 0, words: [], showHints: false })
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
  toggleHints() { this.setData({ showHints: !this.data.showHints }) },
})
