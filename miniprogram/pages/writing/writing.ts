import { teachSentence, correctWriting, checkHealth } from '../../utils/api'
import { doCheckIn } from '../../utils/checkin'
import patternsData from '../../data/sentence_patterns'
import writingsData from '../../data/writings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IPattern {
  id: number; pattern: string; example: string; trans: string; chinese: string
}

interface IWriting {
  id: number; title: string; prompt: string; reference: string; keywords: string[]; patterns: number[]
}

interface ITopic {
  label: string; text: string; chinese: string; vocab: string[]; patterns: number[]
}

interface TransCard {
  index: number; chinese: string; vocab: string[]; patterns: string[]; english: string; done: boolean; linkerIdx: number
}

interface PolishStat {
  words: number; sentences: number; patterns: number; score: number
}

interface PolishItem {
  ok: boolean; text: string
}

/* 中文关键词 → 英文词汇映射 */
const CN_VOCAB_MAP: Record<string, string[]> = {
  '环保': ['environmental protection', 'sustainable development', 'green'],
  '环境': ['environment', 'ecosystem', 'natural habitat'],
  '污染': ['pollution', 'contamination', 'emissions'],
  '生态': ['ecology', 'ecosystem', 'biodiversity'],
  '教育': ['education', 'educational system'],
  '学习': ['learning', 'study', 'acquire knowledge'],
  '知识': ['knowledge', 'information', 'expertise'],
  '学校': ['school', 'campus', 'academic institution'],
  '政府': ['government', 'authorities', 'administration'],
  '管理': ['management', 'regulation', 'governance'],
  '措施': ['measure', 'step', 'action'],
  '政策': ['policy', 'strategy', 'approach'],
  '健康': ['health', 'well-being', 'fitness'],
  '锻炼': ['exercise', 'workout', 'physical activity'],
  '运动': ['sports', 'exercise', 'physical fitness'],
  '身体': ['body', 'physical health', 'wellness'],
  '科技': ['technology', 'science and technology'],
  '创新': ['innovation', 'creativity', 'novelty'],
  '网络': ['internet', 'online', 'digital'],
  '社交': ['social media', 'social networking', 'interaction'],
  '社会': ['society', 'community', 'social issues'],
  '压力': ['pressure', 'stress', 'strain'],
  '生活': ['life', 'lifestyle', 'daily life'],
  '工作': ['work', 'career', 'job', 'employment'],
  '大学': ['college', 'university', 'higher education'],
  '学生': ['student', 'undergraduate', 'learner'],
  '校园': ['campus', 'college life'],
  '时间': ['time', 'schedule', 'time management'],
  '重要': ['important', 'crucial', 'vital', 'significant'],
  '帮助': ['help', 'assist', 'benefit', 'support'],
  '发展': ['development', 'growth', 'progress', 'advancement'],
  '改变': ['change', 'transform', 'alter', 'shift'],
  '问题': ['problem', 'issue', 'challenge', 'concern'],
  '机会': ['opportunity', 'chance', 'prospect'],
  '提高': ['improve', 'enhance', 'boost', 'strengthen'],
  '增加': ['increase', 'grow', 'rise', 'expand'],
  '减少': ['reduce', 'decrease', 'cut down', 'lessen'],
  '养成': ['develop', 'cultivate', 'form', 'establish'],
  '平衡': ['balance', 'equilibrium', 'moderation'],
}

/* 中文句式 → 推荐句型 ID 映射 */
const CN_PATTERN_MAP: Record<string, number[]> = {
  '认为': [5, 15],
  '觉得': [5, 15],
  '观点': [5, 15],
  '毫无疑问': [1],
  '不可否认': [9],
  '众所周知': [4],
  '建议': [12, 13],
  '应该': [7, 12],
  '需要': [7, 12],
  '必须': [7],
  '因为': [11],
  '所以': [11],
  '原因': [11],
  '导致': [11],
  '越': [3],
  '更': [3, 6],
  '只有': [8],
  '绝不能': [14],
  '总之': [7, 8],
  '首先': [1, 4],
  '第一': [1, 4],
}

function matchVocab(cnPoint: string): { vocab: string[]; patternIds: number[] } {
  const vSet: Set<string> = new Set()
  const pSet: Set<number> = new Set()
  for (const [kw, words] of Object.entries(CN_VOCAB_MAP)) {
    if (cnPoint.indexOf(kw) > -1) for (const w of words) vSet.add(w)
  }
  for (const [indicator, ids] of Object.entries(CN_PATTERN_MAP)) {
    if (cnPoint.indexOf(indicator) > -1) for (const id of ids) pSet.add(id)
  }
  return { vocab: [...vSet].slice(0, 6), patternIds: [...pSet] }
}

const PARAGRAPH_TOPICS: ITopic[] = [
  { label: '🌿 环保', text: 'Environmental protection is everyone\'s responsibility.', chinese: '环境保护是每个人的责任。', vocab: ['environmental protection', 'sustainable', 'pollution', 'ecosystem', 'regulation'], patterns: [1, 2, 7] },
  { label: '💻 科技', text: 'The rapid development of technology has brought great changes to our daily life.', chinese: '科技的快速发展给我们的日常生活带来了巨大变化。', vocab: ['technology', 'innovation', 'digital', 'artificial intelligence', 'impact'], patterns: [4, 9, 14] },
  { label: '📚 教育', text: 'Education plays a vital role in shaping a person\'s future.', chinese: '教育在塑造一个人的未来中起着至关重要的作用。', vocab: ['education', 'knowledge', 'skill', 'learning', 'opportunity'], patterns: [1, 6, 12] },
  { label: '💪 健康', text: 'Health is the foundation of a happy and successful life.', chinese: '健康是幸福成功生活的基础。', vocab: ['health', 'wellness', 'exercise', 'mental health', 'lifestyle'], patterns: [2, 6, 10] },
  { label: '🤝 社会', text: 'In modern society, people are facing increasing pressure from work and life.', chinese: '在现代社会，人们面临着来自工作和生活的日益增长的压力。', vocab: ['society', 'pressure', 'balance', 'community', 'responsibility'], patterns: [5, 11, 15] },
  { label: '🏫 校园', text: 'College life is a wonderful journey full of challenges and opportunities.', chinese: '大学生活是一段充满挑战和机遇的精彩旅程。', vocab: ['campus', 'college', 'extracurricular', 'internship', 'challenge'], patterns: [2, 5, 9] },
]

const PATTERN_CATEGORIES: Record<number, string> = {
  1: '开头', 2: '开头', 3: '递进', 4: '开头', 5: '观点',
  6: '开头', 7: '结尾', 8: '结尾', 9: '开头', 10: '强调',
  11: '因果', 12: '建议', 13: '建议', 14: '强调', 15: '观点',
}

const CATEGORIES = ['全部', '开头', '递进', '转折', '举例', '观点', '强调', '因果', '建议', '结尾']
const CATEGORY_EMOJIS: Record<string, string> = {
  '全部': '🔍', '开头': '🔥', '递进': '⚡', '转折': '🔄',
  '举例': '📊', '观点': '💭', '强调': '❗', '因果': '🔗', '建议': '💡', '结尾': '🏁',
}

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

function parseReference(ref: string): { label: string; text: string; note: string }[] {
  const paras = ref.split('\n').filter(Boolean)
  const patterns = ['first(ly)?', 'second(ly)?', 'third(ly)?', 'to begin with', 'in addition',
    'furthermore', 'moreover', 'however', 'on the other hand', 'in conclusion', 'to sum up',
    'in my opinion', 'in my view', 'it is (widely|universally)', 'there is no doubt',
    'for (instance|example)', 'such as', 'therefore', 'thus', 'as a result']
  const labels = ['引入观点', '展开论证', '深入论述', '转折对比', '总结观点']
  return paras.map((p, i) => {
    let note = ''
    for (const pat of patterns) {
      const re = new RegExp(pat, 'i')
      if (re.test(p)) {
        const m = p.match(re)![0]
        note = `💡 使用了 "${m}"`
        break
      }
    }
    const li = p.length < 80 ? labels[0] : i === 0 ? labels[0] : i === paras.length - 1 ? labels[4] : labels[1]
    return { label: `第 ${i + 1} 段 · ${li}`, text: p.trim(), note }
  })
}

function scoreSentenceLocal(text: string, pattern: string): string {
  const wc = countWords(text)
  const parts: string[] = []
  parts.push(`句型：${pattern}`)
  parts.push(`你的句子：${text}`)
  parts.push('')
  if (wc < 3) parts.push('⚠️ 句子太短，建议至少 5 词')
  else if (wc > 40) parts.push('⚠️ 句子偏长，建议 15-25 词')
  else parts.push('✅ 长度适中')
  parts.push(/^[A-Z]/.test(text) ? '✅ 首字母大写' : '⚠️ 首字母应大写')
  parts.push(/[.!?]$/.test(text) ? '✅ 句末标点正确' : '⚠️ 缺少句末标点')
  const cleanPat = pattern.toLowerCase().replace(/\.\.\./g, '').replace(/[()]/g, '').trim()
  if (text.toLowerCase().includes(cleanPat)) parts.push('✅ 句型使用正确')
  else parts.push('💡 未检测到句型，试试：' + pattern)
  parts.push('')
  parts.push('💡 开启 AI 获得深度语法纠错')
  return parts.join('\n')
}

interface WritingScore {
  score: number; dimensions: { content: number; structure: number; language: number }; suggestions: string; reference: string
}

function scoreWritingLocal(text: string, reference: string): WritingScore {
  const wc = countWords(text), sc = text.split(/[.!?]+/).filter(Boolean).length
  const paras = text.split('\n').filter(Boolean).length
  let content = 60, structure = 60, language = 60
  const notes: string[] = []
  if (wc < 80) { notes.push('词数不足，建议 120-180 词'); content = 40; structure = 40 }
  else if (wc >= 120 && wc <= 180) { notes.push('✅ 词数符合四级要求'); content = 75; structure = 70 }
  else { notes.push(`作文 ${wc} 词，建议 120-180 词`); content = wc > 180 ? 65 : 55 }
  if (paras < 2) { notes.push('建议分 2-3 段'); structure = Math.min(structure, 45) }
  else if (paras >= 3) { notes.push(`✅ 分为 ${paras} 段`); structure = Math.min(structure + 15, 85) }
  else structure = Math.min(structure + 5, 75)
  if (sc < 5) { notes.push('句子偏少，建议 8-15 句'); content = Math.min(content, 50) }
  else if (sc >= 8) { notes.push(`✅ ${sc} 个句子`); content = Math.min(content + 10, 85) }
  const hasIntro = /first(ly)?|to begin with|it is (widely|universally)/i.test(text)
  const hasBody = /second(ly)?|furthermore|moreover|in addition|on the (one|other) hand/i.test(text)
  const hasConcl = /in conclusion|to sum up|in my opinion|in my view/i.test(text)
  if (hasIntro) structure = Math.min(structure + 8, 90)
  if (hasBody) structure = Math.min(structure + 8, 90)
  if (hasConcl) structure = Math.min(structure + 10, 90)
  if (hasIntro && hasBody && hasConcl) notes.push('✅ 总—分—总结构清晰')
  else notes.push('💡 建议总—分—总结构')
  const words = text.toLowerCase().split(/\s+/).filter(Boolean)
  const avgLen = words.length ? words.reduce((s, w) => s + w.length, 0) / words.length : 0
  if (avgLen >= 5) { language += 10; notes.push('✅ 词汇有难度') }
  else if (avgLen >= 4) { language += 5; notes.push('词汇难度适中') }
  else { language -= 5; notes.push('💡 建议多用高级词汇替换简单词') }
  const longSents = text.split(/[.!?]+/).filter(s => s.trim().split(/\s+/).length > 15).length
  if (longSents >= 2) { language += 8; notes.push('✅ 包含复合句，句式多样') }
  else if (longSents === 1) { language += 3 }
  else { language -= 5; notes.push('💡 尝试加入一些从句/复合句') }
  const capErr = text.split(/[.!?]+\s*/).filter(s => s.trim()).filter(s => !/^[A-Z]/.test(s.trim())).length
  if (capErr > 1) { language -= 8; notes.push(`⚠️ ${capErr} 句首未大写`) }
  language = Math.max(30, Math.min(95, language))
  const avgScore = Math.round((content + structure + language) / 3)
  return { score: avgScore, dimensions: { content, structure, language }, suggestions: notes.join('\n'), reference }
}

interface IWritingData {
  /* tabs */
  tab: number; tabs: string[]
  patterns: IPattern[]; writings: IWriting[]
  detailMode: boolean; darkMode: boolean

  /* Tab 0 */
  expandedPattern: number | null; selectedPattern: IPattern | null
  userSentence: string; sentenceWordCount: number
  toolkitVisible: boolean; toolkitCategory: string; toolkitSearch: string
  categoryOptions: string[]; categoryEmojis: Record<string, string>
  patternCategories: Record<number, string>
  patternVisible: boolean[]
  recentPatterns: number[]; recentPatternData: IPattern[]

  /* Tab 1 */
  guideStep: number
  paragraphTopics: ITopic[]; currentTopic: ITopic
  cnInput: string; cnPlaceholder: string; cnExampleLines: string[]
  transCards: TransCard[]
  assemblyInput: string; assemblyWordCount: number
  polishStats: PolishStat; polishItems: PolishItem[]

  /* Tab 2 */
  currentWriting: IWriting | null
  writingAnswer: string; writingWordCount: number
  writingKeywords: string[]; writingPatternTags: string[]
  examTypeLabels: string[]

  /* shared */
  showResult: boolean; result: string | null
  submitting: boolean; aiAvailable: boolean; aiEnabled: boolean  [key: string]: any

}

Page<IWritingData, Record<string, any>>({
  data: {
    tab: 0, tabs: ['句型急救包', '中英写作助手', '写作速查'],
    patterns: [], writings: [],
    detailMode: false, fs: getApp<IAppOption>().globalData.fontSizes && getApp<IAppOption>().globalData.fontSizes['writing'] || 16,
 fsOpen: false,
 darkMode: false,

    expandedPattern: null, selectedPattern: null,
    userSentence: '', sentenceWordCount: 0,
    toolkitVisible: false, toolkitCategory: '全部', toolkitSearch: '',
    categoryOptions: CATEGORIES, categoryEmojis: CATEGORY_EMOJIS,
    patternCategories: PATTERN_CATEGORIES,
    patternVisible: [], recentPatterns: [], recentPatternData: [],

    guideStep: 1,
    paragraphTopics: PARAGRAPH_TOPICS, currentTopic: PARAGRAPH_TOPICS[0],
    cnInput: '',
    cnPlaceholder: '例：环保对每个人都很重要（每行一个要点）',
    cnExampleLines: ['环保对每个人都很重要', '政府应该加强管理', '我们可以从小事做起'],
    transCards: [],
    assemblyInput: '', assemblyWordCount: 0,
    polishStats: { words: 0, sentences: 0, patterns: 0, score: 0 },
    polishItems: [],

    currentWriting: null,
    writingAnswer: '', writingWordCount: 0,
    writingKeywords: [], writingPatternTags: [],
    examTypeLabels: [],

    showResult: false, result: null,
    submitting: false, aiAvailable: false,
    aiEnabled: wx.getStorageSync('writingAiEnabled') !== false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    const recent: number[] = wx.getStorageSync('writingRecentPatterns') || []
    const pats = patternsData as IPattern[]
    const writes = writingsData as IWriting[]
    const patternVisible = pats.map(() => true)
    const examTypeLabels = writes.map(w => w.prompt.indexOf('真题') > -1 ? '真题' : '模拟')
    this.setData({
      patterns: pats, writings: writes, patternVisible, examTypeLabels,
      darkMode: app.globalData.darkMode,
      recentPatterns: recent,
    })
    this.syncRecentPatterns()
    checkHealth().then(r => { if (r.apiKey) this.setData({ aiAvailable: true }) }).catch(() => {})
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getApp<IAppOption>().globalData.darkMode })
  },

  computePatternVisible(category: string, search: string) {
    const q = search.toLowerCase().trim()
    return (this.data.patterns as IPattern[]).map(p => {
      if (category !== '全部' && (this.data.patternCategories[p.id] || '通用') !== category) return false
      if (q && p.pattern.toLowerCase().indexOf(q) === -1 && p.chinese.indexOf(q) === -1) return false
      return true
    })
  },

  syncRecentPatterns() {
    const data: IPattern[] = []
    for (const id of this.data.recentPatterns) {
      const p = this.data.patterns.find(pt => pt.id === id)
      if (p) data.push(p)
    }
    this.setData({ recentPatternData: data })
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, detailMode: false, showResult: false, result: null })
  },

  /* ══ Tab 0: 句型急救包 ══ */
  togglePattern(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    this.setData({ expandedPattern: this.data.expandedPattern === id ? null : id })
  },
  insertPattern(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const pat = this.data.patterns.find(p => p.id === id)
    if (!pat) return
    const recent = this.data.recentPatterns.filter(r => r !== id)
    recent.unshift(id)
    if (recent.length > 5) recent.pop()
    this.setData({
      selectedPattern: pat,
      recentPatterns: recent,
      toolkitVisible: false,
    })
    this.syncRecentPatterns()
    wx.setStorageSync('writingRecentPatterns', recent)
    wx.showToast({ title: '已选用 ' + pat.pattern, icon: 'none' })
  },
  onSentenceInput(e: WechatMiniprogram.Input) {
    if (this._composing) return
    const val = e.detail.value
    this.setData({ userSentence: val, sentenceWordCount: val.trim() ? countWords(val) : 0 })
  },
  setToolkitCategory(e: WechatMiniprogram.TouchEvent) {
    const toolkitCategory = e.currentTarget.dataset.cat as string
    const patternVisible = this.computePatternVisible(toolkitCategory, this.data.toolkitSearch)
    this.setData({ toolkitCategory, patternVisible })
  },
  onToolkitSearch(e: WechatMiniprogram.Input) {
    const toolkitSearch = e.detail.value
    const patternVisible = this.computePatternVisible(this.data.toolkitCategory, toolkitSearch)
    this.setData({ toolkitSearch, patternVisible })
  },
  async submitSentence() {
    const text = this.data.userSentence.trim()
    const pattern = this.data.selectedPattern
    if (!text) { wx.showToast({ title: '请输入句子', icon: 'none' }); return }
    if (!pattern) { wx.showToast({ title: '请先选一个句型', icon: 'none' }); return }
    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })
    let result = scoreSentenceLocal(text, pattern.pattern)
    result += `\n\n📝 参考例句：\n${pattern.example}\n${pattern.trans}`
    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const res = await Promise.race([
          teachSentence(pattern.pattern, text),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])
        result = `【使用句型】${pattern.pattern}\n【你的句子】${text}\n\n${res.explanation}`
      } catch { /* keep local */ }
    }
    this.setData({ showResult: true, result, userSentence: '', sentenceWordCount: 0 })
    wx.hideLoading(); this.setData({ submitting: false })
  },

  /* ══ Tab 1: 中英写作助手 ══ */
  selectTopic(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({ currentTopic: this.data.paragraphTopics[index] })
  },
  setGuideStep(e: WechatMiniprogram.TouchEvent) {
    this.setData({ guideStep: e.currentTarget.dataset.step as number })
  },

  _composing: false,
  onCompStart() { this._composing = true },
  onCompEnd() { this._composing = false },
  onCnCompEnd(e: WechatMiniprogram.Input) {
    this._composing = false; this.setData({ cnInput: e.detail.value })
  },
  onCnInput(e: WechatMiniprogram.Input) {
    if (!this._composing) this.setData({ cnInput: e.detail.value })
  },
  goToStep2() {
    const text = this.data.cnInput.trim()
    if (!text) { wx.showToast({ title: '请先写中文要点', icon: 'none' }); return }
    const points = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
    if (points.length < 2) { wx.showToast({ title: '至少写 2 个要点', icon: 'none' }); return }
    const patterns = this.data.patterns
    const cards: TransCard[] = points.map((cn, i) => {
      const matched = matchVocab(cn)
      let vocab = matched.vocab
      if (vocab.length === 0) vocab = this.data.currentTopic.vocab.slice(0, 6)
      let patternStrs: string[] = []
      for (const id of matched.patternIds) {
        const p = patterns.find(pt => pt.id === id)
        if (p) patternStrs.push(p.pattern)
      }
      if (patternStrs.length === 0) {
        for (const id of this.data.currentTopic.patterns) {
          const p = patterns.find(pt => pt.id === id)
          if (p) patternStrs.push(p.pattern)
        }
      }
      return { index: i, chinese: cn, vocab, patterns: patternStrs, english: '', done: false, linkerIdx: i < 4 ? i : 3 }
    })
    this.setData({ transCards: cards, guideStep: 2 })
  },
  onTransEnInput(e: WechatMiniprogram.Input) {
    if (this._composing) return
    const index = e.currentTarget.dataset.index as number
    const val = e.detail.value
    const cards = [...this.data.transCards]
    cards[index] = { ...cards[index], english: val, done: val.trim().length > 0 }
    this.setData({ transCards: cards })
  },
  LINKERS: ['Firstly, ', 'Moreover, ', 'Furthermore, ', 'In addition, ', 'Additionally, ', 'Besides, ', 'However, ', 'Therefore, ', 'In conclusion, '],

  buildAssembledText(): string {
    const cards = this.data.transCards.filter(c => c.done && c.english.trim())
    if (!cards.length) return ''
    let text = ''
    for (let i = 0; i < cards.length; i++) {
      if (i > 0) text += ' '
      text += (this.LINKERS[cards[i].linkerIdx] || 'Moreover, ') + cards[i].english.trim()
    }
    return text
  },
  rebuildPreview() {
    const text = this.buildAssembledText()
    this.setData({ assemblyInput: text, assemblyWordCount: text ? countWords(text) : 0 })
  },

  goToStep3() {
    const filled = this.data.transCards.filter(c => c.done).length
    if (filled < 2) { wx.showToast({ title: '至少翻译 2 个要点', icon: 'none' }); return }
    this.rebuildPreview()
    this.setData({ guideStep: 3 })
  },
  onCardEnInput(e: WechatMiniprogram.Input) {
    if (this._composing) return
    const index = e.currentTarget.dataset.index as number
    const val = e.detail.value
    const cards = [...this.data.transCards]
    cards[index] = { ...cards[index], english: val, done: val.trim().length > 0 }
    this.setData({ transCards: cards })
    this.rebuildPreview()
  },
  setCardLinker(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    const li = e.currentTarget.dataset.linker as number
    const cards = [...this.data.transCards]
    cards[index] = { ...cards[index], linkerIdx: li }
    this.setData({ transCards: cards })
    this.rebuildPreview()
  },
  moveCard(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    const dir = e.currentTarget.dataset.dir as number
    const to = index + dir
    if (to < 0 || to >= this.data.transCards.length) return
    const cards = [...this.data.transCards]
    const tmp = cards[to]; cards[to] = cards[index]; cards[index] = tmp
    cards.forEach((c, i) => c.index = i)
    this.setData({ transCards: cards })
    this.rebuildPreview()
  },
  removeCard(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    const cards = this.data.transCards.filter((_, i) => i !== index)
    if (cards.length < 2) { wx.showToast({ title: '至少保留 2 个要点', icon: 'none' }); return }
    cards.forEach((c, i) => c.index = i)
    this.setData({ transCards: cards })
    this.rebuildPreview()
  },
  addCard() {
    const cards = [...this.data.transCards]
    cards.push({ index: cards.length, chinese: '', vocab: [], patterns: [], english: '', done: false, linkerIdx: Math.min(cards.length, 8) })
    this.setData({ transCards: cards })
    this.rebuildPreview()
  },
  goToStep4() {
    const text = this.data.assemblyInput.trim()
    if (!text) { wx.showToast({ title: '请先组装段落', icon: 'none' }); return }
    const wc = countWords(text)
    const sentences = text.split(/[.!?]+\s*/).filter(Boolean).length
    let patternCount = 0
    for (const p of this.data.patterns) {
      const clean = p.pattern.toLowerCase().replace(/\.\.\./g, '').replace(/[()]/g, '').trim()
      if (clean && text.toLowerCase().includes(clean)) patternCount++
    }
    let score = 60
    if (wc >= 80 && wc <= 180) score += 15; else if (wc < 40) score -= 20
    if (sentences >= 5) score += 10
    if (patternCount >= 2) score += 10
    score = Math.max(20, Math.min(100, score))

    const items: PolishItem[] = []
    if (wc < 80) items.push({ ok: false, text: `词数偏少（${wc} 词），建议 120-180 词` })
    else if (wc > 200) items.push({ ok: false, text: `词数偏多（${wc} 词），建议精简` })
    else items.push({ ok: true, text: `词数合适（${wc} 词）` })
    if (sentences < 5) items.push({ ok: false, text: `句子偏少（${sentences} 句），建议 5-10 句` })
    else items.push({ ok: true, text: `句子数量合适（${sentences} 句）` })
    if (patternCount === 0) items.push({ ok: false, text: '未检测到高级句型，试试句型急救包' })
    else items.push({ ok: true, text: `使用了 ${patternCount} 个高级句型` })
    if (!/first|to begin/i.test(text)) items.push({ ok: false, text: '可添加连接词开头：Firstly / To begin with' })
    if (!/in conclusion|to sum/i.test(text)) items.push({ ok: false, text: '可添加结尾词：In conclusion / To sum up' })

    this.setData({ guideStep: 4, polishStats: { words: wc, sentences, patterns: patternCount, score }, polishItems: items })
  },
  resetAll() {
    this.setData({
      cnInput: '', transCards: [], assemblyInput: '', assemblyWordCount: 0,
      polishStats: { words: 0, sentences: 0, patterns: 0, score: 0 },
      polishItems: [], guideStep: 1, showResult: false, result: null,
      currentTopic: this.data.paragraphTopics[0],
    })
  },

  /* ══ Tab 2: 写作速查 ══ */
  enterWriting(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.writings.find(w => w.id === id) || null
    if (!item) return
    const patternTags: string[] = []
    for (const pid of item.patterns) {
      const p = this.data.patterns.find(pt => pt.id === pid)
      if (p) patternTags.push(p.pattern)
    }
    this.setData({
      currentWriting: item, detailMode: true,
      writingAnswer: '', writingWordCount: 0, showResult: false, result: null,
      writingKeywords: item.keywords, writingPatternTags: patternTags,
    })
  },
  backToWritingList() {
    this.setData({ currentWriting: null, detailMode: false, writingAnswer: '', writingWordCount: 0, showResult: false, result: null })
  },
  onWritingInput(e: WechatMiniprogram.Input) {
    if (this._composing) return
    const val = e.detail.value
    this.setData({ writingAnswer: val, writingWordCount: val.trim() ? countWords(val) : 0 })
  },
  async submitWriting() {
    const text = this.data.writingAnswer.trim()
    const prompt = this.data.currentWriting && this.data.currentWriting.prompt || ''
    const reference = this.data.currentWriting && this.data.currentWriting.reference || ''
    const keywords = this.data.writingKeywords || []
    if (!text) { wx.showToast({ title: '请输入作文', icon: 'none' }); return }
    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })
    let local = scoreWritingLocal(text, reference)
    let score = local.score, dimensions = local.dimensions, suggestions = local.suggestions, ref = reference
    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const ai = await Promise.race([
          correctWriting(prompt, text),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])
        if (ai.dimensions) dimensions = ai.dimensions
        if (ai.suggestions) suggestions = ai.suggestions
        if (ai.reference) ref = ai.reference
        if (ai.score) score = Math.round((score + ai.score) / 2)
      } catch { /* keep local */ }
    }
    const parsed = parseReference(ref)
    let resultText = `评分：${score}分\n\n内容：${dimensions.content}分\n结构：${dimensions.structure}分\n语言：${dimensions.language}分\n\n修改建议：\n${suggestions}\n`
    const usedKeywords: string[] = []
    for (const kw of keywords) {
      if (text.toLowerCase().includes(kw)) usedKeywords.push(kw)
    }
    if (usedKeywords.length > 0) resultText += `\n📌 关键词使用：✅ ${usedKeywords.join('、')}\n`
    else if (keywords.length > 0) resultText += `\n📌 关键词提示：${keywords.slice(0, 5).join('、')}\n`
    resultText += `\n📖 范文拆解\n${'-'.repeat(20)}\n`
    for (const sec of parsed) {
      resultText += `\n【${sec.label}】\n${sec.text}\n${sec.note}\n`
    }
    this.setData({ showResult: true, result: resultText })
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords
    records.push({ id: Date.now(), score, date: new Date().toISOString().slice(0, 10) })
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn('writing')
    wx.hideLoading(); this.setData({ submitting: false })
  },

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('writingAiEnabled', val)
  },

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    let v = Math.max(12, Math.min(26, this.data.fs + d))
    this.setData({ fs: v })
    const app = getApp<IAppOption>()
    if (!app.globalData.fontSizes) app.globalData.fontSizes = {}
    app.globalData.fontSizes['writing'] = v
    wx.setStorageSync('fontSizes', app.globalData.fontSizes)
  },
})
