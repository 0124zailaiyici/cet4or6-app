import { teachSentence, correctWriting, correctParagraph, checkHealth } from '../../utils/api'
import { doCheckIn } from '../../utils/checkin'
import patternsData from '../../data/sentence_patterns'
import writingsData from '../../data/writings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IPattern {
  id: number; pattern: string; example: string; chinese: string
}

interface IWriting {
  id: number; title: string; prompt: string; reference: string
}

interface ITopic {
  label: string; text: string
}

const PARAGRAPH_TOPICS: ITopic[] = [
  { label: '🌿 环保', text: 'Environmental protection is everyone\'s responsibility.' },
  { label: '💻 科技', text: 'The rapid development of technology has brought great changes to our daily life.' },
  { label: '📚 教育', text: 'Education plays a vital role in shaping a person\'s future.' },
  { label: '💪 健康', text: 'Health is the foundation of a happy and successful life.' },
  { label: '🤝 社会', text: 'In modern society, people are facing increasing pressure from work and life.' },
  { label: '🏫 校园', text: 'College life is a wonderful journey full of challenges and opportunities.' },
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

interface ParagraphScore {
  score: number; dimensions: { coherence: number; content: number; language: number }; suggestions: string
}

function scoreParagraphLocal(text: string, topic: ITopic): ParagraphScore {
  const wc = countWords(text)
  const sc = text.split(/[.!?]+/).filter(Boolean).length
  let coherence = 60, content = 60, language = 60
  const notes: string[] = []
  if (wc < 30) { notes.push('段落太短，建议 60-120 词'); content = 40; coherence = 40 }
  else if (wc >= 60 && wc <= 120) { notes.push('✅ 词数符合范围'); content = 75; coherence = 70 }
  else { notes.push(`段落 ${wc} 词，建议 60-120 词`); content = wc > 120 ? 65 : 50 }
  if (sc < 3) { notes.push('段落至少 3 个句子'); coherence = Math.min(coherence, 45) }
  else if (sc >= 5) { notes.push(`✅ 包含 ${sc} 个句子`); coherence = Math.min(coherence + 10, 85) }
  const topicWords = topic.text.toLowerCase().split(/\s+/)
  const textWords = text.toLowerCase().split(/\s+/)
  const overlap = topicWords.filter(w => w.length > 3 && textWords.includes(w)).length
  if (overlap >= 2) { content = Math.min(content + 10, 85); notes.push('✅ 内容与主题相关') }
  else notes.push('💡 尝试使用更多主题关键词')
  const avgScore = Math.round((coherence + content + language) / 3)
  return { score: avgScore, dimensions: { coherence, content, language }, suggestions: notes.join('\n') }
}

interface WritingScore {
  score: number; dimensions: { content: number; structure: number; language: number }; suggestions: string; reference: string
}

function scoreWritingLocal(text: string, prompt: string, reference: string): WritingScore {
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
  const avgScore = Math.round((content + structure + language) / 3)
  return { score: avgScore, dimensions: { content, structure, language }, suggestions: notes.join('\n'), reference }
}

interface IWritingData {
  tab: number; tabs: string[]
  patterns: IPattern[]; writings: IWriting[]
  expandedPattern: number | null; selectedPattern: IPattern | null
  userSentence: string; userParagraph: string; writingAnswer: string
  currentWriting: IWriting | null
  result: string | null; showResult: boolean; darkMode: boolean
  paragraphTopics: ITopic[]; currentTopic: ITopic
  sentenceWordCount: number; paragraphWordCount: number; writingWordCount: number
  submitting: boolean; aiAvailable: boolean; aiEnabled: boolean; detailMode: boolean

  /* 句型急救包 */
  toolkitVisible: boolean; toolkitCategory: string; toolkitSearch: string
  categoryOptions: string[]; categoryEmojis: Record<string, string>
  recentPatterns: number[]

  /* 引导写作 - 提纲 */
  guideStep: number
  outlineOpinion: string; outlineReasons: string[]; outlineReasonInput: string
  outlineExamples: string[]; outlineExampleInput: string
  outlineGenerated: string

  /* 新手模式 */
  sentence1: string; sentence2: string; sentence3: string

  /* 计时 */
  timerRunning: boolean; timerRemaining: number; timerPhase: string
  timerPhaseLabel: string; timerPercent: number
}

Page<IWritingData>({
  data: {
    tab: 0, tabs: ['句型急救包', '引导写作', '考场模拟'],
    patterns: [], writings: [],
    expandedPattern: null, selectedPattern: null,
    userSentence: '', userParagraph: '', writingAnswer: '',
    currentWriting: null, result: null, showResult: false, darkMode: false,
    paragraphTopics: PARAGRAPH_TOPICS, currentTopic: PARAGRAPH_TOPICS[0],
    sentenceWordCount: 0, paragraphWordCount: 0, writingWordCount: 0,
    submitting: false, aiAvailable: false,
    aiEnabled: wx.getStorageSync('writingAiEnabled') !== false,
    detailMode: false,

    toolkitVisible: false, toolkitCategory: '全部', toolkitSearch: '',
    categoryOptions: CATEGORIES, categoryEmojis: CATEGORY_EMOJIS,
    patternCategories: PATTERN_CATEGORIES,
    recentPatterns: [],

    guideStep: 1,
    outlineOpinion: '', outlineReasons: [], outlineReasonInput: '',
    outlineExamples: [], outlineExampleInput: '',
    outlineGenerated: '',

    sentence1: '', sentence2: '', sentence3: '',

    timerRunning: false, timerRemaining: 1800, timerPhase: 'review',
    timerPhaseLabel: '📋 审题', timerPercent: 100,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    const recent: number[] = wx.getStorageSync('writingRecentPatterns') || []
    this.setData({
      patterns: patternsData as IPattern[],
      writings: writingsData as IWriting[],
      darkMode: app.globalData.darkMode,
      recentPatterns: recent,
    })
    checkHealth().then(r => { if (r.apiKey) this.setData({ aiAvailable: true }) }).catch(() => {})
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getApp<IAppOption>().globalData.darkMode })
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, detailMode: false, showResult: false, result: null, timerRunning: false })
    if (this._timer) { clearInterval(this._timer); this._timer = null }
  },
  _timer: number | null = null,

  /* ══ 句型急救包 ══ */
  togglePattern(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const pattern = this.data.patterns.find(p => p.id === id) || null
    this.setData({
      expandedPattern: this.data.expandedPattern === id ? null : id,
      selectedPattern: pattern,
    })
  },
  onSentenceInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value
    this.setData({ userSentence: val, sentenceWordCount: val.trim() ? countWords(val) : 0 })
  },
  setToolkitCategory(e: WechatMiniprogram.TouchEvent) {
    this.setData({ toolkitCategory: e.currentTarget.dataset.cat as string })
  },
  onToolkitSearch(e: WechatMiniprogram.Input) {
    this.setData({ toolkitSearch: e.detail.value })
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
    wx.setStorageSync('writingRecentPatterns', recent)
    wx.showToast({ title: '已选用 ' + pat.pattern, icon: 'none' })
  },
  toggleToolkit() {
    this.setData({ toolkitVisible: !this.data.toolkitVisible })
  },
  async submitSentence() {
    const text = this.data.userSentence.trim()
    const pattern = this.data.selectedPattern
    if (!text) { wx.showToast({ title: '请输入句子', icon: 'none' }); return }
    if (!pattern) { wx.showToast({ title: '请先点开一个句型', icon: 'none' }); return }
    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })
    let result = scoreSentenceLocal(text, pattern.pattern)
    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const res = await Promise.race([
          teachSentence(pattern.pattern, text),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])
        result = `【使用句型】${pattern.pattern}\n【你的句子】${text}\n\n${res.explanation}`
      } catch { /* keep local */ }
    }
    this.setData({ showResult: true, result })
    wx.hideLoading(); this.setData({ submitting: false })
  },

  /* ══ 引导写作 ══ */
  selectTopic(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({
      currentTopic: this.data.paragraphTopics[index],
      showResult: false, result: null,
    })
  },
  onParagraphInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value
    this.setData({
      userParagraph: val,
      paragraphWordCount: val.trim() ? countWords(val) : 0,
    })
  },
  setGuideStep(e: WechatMiniprogram.TouchEvent) {
    this.setData({ guideStep: e.currentTarget.dataset.step as number })
  },

  /* 提纲 */
  setOutlineOpinion(e: WechatMiniprogram.TouchEvent) {
    this.setData({ outlineOpinion: e.currentTarget.dataset.val as string })
  },
  onReasonInput(e: WechatMiniprogram.Input) {
    this.setData({ outlineReasonInput: e.detail.value })
  },
  addReason() {
    const v = this.data.outlineReasonInput.trim()
    if (!v) return
    this.setData({
      outlineReasons: [...this.data.outlineReasons, v],
      outlineReasonInput: '',
    })
  },
  removeReason(e: WechatMiniprogram.TouchEvent) {
    const i = e.currentTarget.dataset.index as number
    const arr = [...this.data.outlineReasons]; arr.splice(i, 1)
    this.setData({ outlineReasons: arr })
  },
  onExampleInput(e: WechatMiniprogram.Input) {
    this.setData({ outlineExampleInput: e.detail.value })
  },
  addExample() {
    const v = this.data.outlineExampleInput.trim()
    if (!v) return
    this.setData({
      outlineExamples: [...this.data.outlineExamples, v],
      outlineExampleInput: '',
    })
  },
  removeExample(e: WechatMiniprogram.TouchEvent) {
    const i = e.currentTarget.dataset.index as number
    const arr = [...this.data.outlineExamples]; arr.splice(i, 1)
    this.setData({ outlineExamples: arr })
  },
  generateOutline() {
    const opinion = this.data.outlineOpinion || '中立'
    const reasons = this.data.outlineReasons
    const examples = this.data.outlineExamples
    let outline = ''
    outline += `第 1 段 · 引入观点\n我认为这个问题 ${opinion}。\n\n`
    reasons.forEach((r, i) => {
      outline += `第 ${i + 2} 段 · 理由 ${i + 1}\n首先${i > 0 ? '其次' : ''}，${r}。`
      if (examples[i]) outline += ` 例如，${examples[i]}。`
      outline += '\n\n'
    })
    outline += `第 ${reasons.length + 2} 段 · 总结\n总之，${reasons.length > 0 ? '基于以上理由，我认为' + opinion + '。在' + (reasons.join('、')) + '等方面都需要权衡。' : '需要综合考虑各方面因素。'}`
    this.setData({ outlineGenerated: outline, guideStep: 3 })
  },

  /* 新手模式 */
  onSentence1Input(e: WechatMiniprogram.Input) { this.setData({ sentence1: e.detail.value }) },
  onSentence2Input(e: WechatMiniprogram.Input) { this.setData({ sentence2: e.detail.value }) },
  onSentence3Input(e: WechatMiniprogram.Input) { this.setData({ sentence3: e.detail.value }) },

  async submitParagraph() {
    const text = this.data.userParagraph.trim()
    const topic = this.data.currentTopic
    if (!text) { wx.showToast({ title: '请先写点内容', icon: 'none' }); return }
    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })
    let local = scoreParagraphLocal(text, topic)
    let score = local.score, dimensions = local.dimensions, suggestions = local.suggestions
    if (this.data.aiAvailable && this.data.aiEnabled) {
      try {
        const ai = await Promise.race([
          correctParagraph(topic.text, text),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
        ])
        if (ai.dimensions) dimensions = ai.dimensions
        if (ai.suggestions) suggestions = ai.suggestions
        if (ai.score) score = Math.round((score + ai.score) / 2)
      } catch { /* keep local */ }
    }
    this.setData({
      showResult: true,
      result: `评分：${score}分\n\n连贯性：${dimensions.coherence}分\n内容：${dimensions.content}分\n语言：${dimensions.language}分\n\n修改建议：\n${suggestions}`,
    })
    wx.hideLoading(); this.setData({ submitting: false })
  },

  /* ══ 考场模拟 ══ */
  enterWriting(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.writings.find(w => w.id === id) || null
    this.setData({
      currentWriting: item, detailMode: true,
      writingAnswer: '', writingWordCount: 0, showResult: false, result: null,
      timerRunning: false,
    })
    if (this._timer) { clearInterval(this._timer); this._timer = null }
  },
  backToWritingList() {
    this.setData({ currentWriting: null, detailMode: false, writingAnswer: '', writingWordCount: 0, showResult: false, result: null })
    if (this._timer) { clearInterval(this._timer); this._timer = null }
    this.setData({ timerRunning: false })
  },
  onWritingInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value
    this.setData({ writingAnswer: val, writingWordCount: val.trim() ? countWords(val) : 0 })
  },

  /* 计时 */
  startTimer() {
    if (this.data.timerRunning) return
    this.setData({ timerRunning: true, timerRemaining: 1800, timerPhase: 'review', timerPhaseLabel: '📋 审题阶段', timerPercent: 100 })
    if (this._timer) clearInterval(this._timer)
    this._timer = setInterval(() => {
      const rem = this.data.timerRemaining - 1
      const pct = Math.round(rem / 1800 * 100)
      let phase = this.data.timerPhase, label = this.data.timerPhaseLabel
      const elapsed = 1800 - rem
      if (elapsed <= 120) { phase = 'review'; label = '📋 审题 · 还剩 2:00' }
      else if (elapsed <= 300) { phase = 'outline'; label = '📝 列提纲 · 还剩 ' + formatTime(300 - (elapsed - 120)) }
      else if (elapsed <= 1680) { phase = 'writing'; label = '✍️ 写作 · 还剩 ' + formatTime(1680 - (elapsed - 300)) }
      else { phase = 'check'; label = '🔍 检查 · 还剩 ' + formatTime(1800 - elapsed) }

      if (rem <= 0) {
        if (this._timer) { clearInterval(this._timer); this._timer = null }
        this.setData({ timerRunning: false, timerRemaining: 0, timerPhase: 'done', timerPhaseLabel: '⏰ 时间到！', timerPercent: 0 })
        wx.showToast({ title: '时间到！', icon: 'none' })
        return
      }
      this.setData({ timerRemaining: rem, timerPercent: pct, timerPhase: phase, timerPhaseLabel: label })
    }, 1000)
  },
  stopTimer() {
    if (this._timer) { clearInterval(this._timer); this._timer = null }
    this.setData({ timerRunning: false })
  },

  async submitWriting() {
    const text = this.data.writingAnswer.trim()
    const prompt = this.data.currentWriting?.prompt || ''
    const reference = this.data.currentWriting?.reference || ''
    if (!text) { wx.showToast({ title: '请输入作文', icon: 'none' }); return }
    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })
    let local = scoreWritingLocal(text, prompt, reference)
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
    let resultText = `评分：${score}分\n\n内容：${dimensions.content}分\n结构：${dimensions.structure}分\n语言：${dimensions.language}分\n\n修改建议：\n${suggestions}\n\n`
    resultText += `📖 范文拆解\n${'-'.repeat(20)}\n`
    for (const sec of parsed) {
      resultText += `\n【${sec.label}】\n${sec.text}\n${sec.note}\n`
    }
    this.setData({ showResult: true, result: resultText })
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords
    records.push({ id: Date.now(), score, date: new Date().toISOString().slice(0, 10) })
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn()
    wx.hideLoading(); this.setData({ submitting: false })
    if (this._timer) { clearInterval(this._timer); this._timer = null }
    this.setData({ timerRunning: false })
  },

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('writingAiEnabled', val)
  },
})

function formatTime(s: number): string {
  const m = Math.floor(s / 60), sec = s % 60
  return `${m}:${sec < 10 ? '0' : ''}${sec}`
}
