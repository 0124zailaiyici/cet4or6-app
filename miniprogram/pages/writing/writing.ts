import { teachSentence, correctWriting, correctParagraph, checkHealth } from '../../utils/api'
import { doCheckIn } from '../../utils/checkin'
import patternsData from '../../data/sentence_patterns'
import writingsData from '../../data/writings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IPattern {
  id: number
  pattern: string
  example: string
  chinese: string
}

interface IWriting {
  id: number
  title: string
  prompt: string
  reference: string
}

interface ITopic {
  label: string
  text: string
}

const PARAGRAPH_TOPICS: ITopic[] = [
  { label: '🌿 环保', text: 'Environmental protection is everyone\'s responsibility.' },
  { label: '💻 科技', text: 'The rapid development of technology has brought great changes to our daily life.' },
  { label: '📚 教育', text: 'Education plays a vital role in shaping a person\'s future.' },
  { label: '💪 健康', text: 'Health is the foundation of a happy and successful life.' },
  { label: '🤝 社会', text: 'In modern society, people are facing increasing pressure from work and life.' },
  { label: '🏫 校园', text: 'College life is a wonderful journey full of challenges and opportunities.' },
]

function countWords(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0
}

function countSentences(s: string): number {
  return s.split(/[.!?]+/).filter(Boolean).length
}

function scoreSentenceLocal(text: string, pattern: IPattern): string {
  const wc = countWords(text)
  const parts: string[] = []
  parts.push(`【使用句型】${pattern.pattern}`)
  parts.push(`【你的句子】${text}`)
  parts.push('')

  if (wc < 3) {
    parts.push('⚠️ 句子太短，建议至少包含 5 个单词。')
  } else if (wc > 40) {
    parts.push('⚠️ 句子偏长，建议控制在 15-25 词。')
  } else {
    parts.push('✅ 句子长度适中。')
  }

  if (/^[A-Z]/.test(text)) {
    parts.push('✅ 首字母大写正确。')
  } else {
    parts.push('⚠️ 首字母应大写。')
  }

  if (/[.!?]$/.test(text)) {
    parts.push('✅ 句末标点正确。')
  } else {
    parts.push('⚠️ 句末缺少标点（. ! ?）。')
  }

  if (text.toLowerCase().includes(pattern.pattern.toLowerCase().replace(/\.\.\./g, '').replace(/[()]/g, '').trim())) {
    parts.push('✅ 句型使用正确。')
  } else {
    parts.push('💡 提示：句子中未检测到选中句型，试着用上 ' + pattern.pattern + '。')
  }

  parts.push('')
  parts.push('💡 建议：多尝试不同句型，让表达更丰富。使用 AI 评分可获得更详细的语法和词汇分析。')
  return parts.join('\n')
}

interface ParagraphScore {
  score: number
  dimensions: { coherence: number; content: number; language: number }
  suggestions: string
}

function scoreParagraphLocal(text: string, topic: ITopic): ParagraphScore {
  const wc = countWords(text)
  const sc = countSentences(text)
  const lines = text.split('\n').filter(Boolean).length

  let coherence = 60
  let content = 60
  let language = 60
  const notes: string[] = []

  if (wc < 30) {
    notes.push('段落太短，建议 60-120 词。')
    content = 40
    coherence = 40
  } else if (wc >= 60 && wc <= 120) {
    notes.push('✅ 词数符合建议范围（60-120 词）。')
    content = 75
    coherence = 70
  } else {
    notes.push(`段落 ${wc} 词，建议控制在 60-120 词。`)
    if (wc > 120) { content = 65 } else { content = 50 }
  }

  if (sc < 3) {
    notes.push('段落应包含至少 3 个句子，尝试扩展内容。')
    coherence = Math.min(coherence, 45)
  } else if (sc >= 5) {
    notes.push(`✅ 包含 ${sc} 个句子，内容较充实。`)
    coherence = Math.min(coherence + 10, 85)
  }

  if (lines <= 1) {
    notes.push('段落结构较单一，可考虑分段增强层次。')
    language = Math.min(language, 55)
  } else {
    language = Math.min(language + 10, 80)
    notes.push('✅ 有段落划分，结构清晰。')
  }

  if (text.toLowerCase().includes('i') || text.toLowerCase().includes('we')) {
    coherence = Math.min(coherence + 5, 85)
  }

  const topicWords = topic.text.toLowerCase().split(/\s+/)
  const textWords = text.toLowerCase().split(/\s+/)
  const overlap = topicWords.filter(w => w.length > 3 && textWords.includes(w)).length
  if (overlap >= 2) {
    content = Math.min(content + 10, 85)
    notes.push('✅ 内容与主题相关度高。')
  } else {
    notes.push('💡 尝试用更多与主题相关的关键词。')
  }

  const avgScore = Math.round((coherence + content + language) / 3)
  const suggestions = notes.join('\n')

  return { score: avgScore, dimensions: { coherence, content, language }, suggestions }
}

interface WritingScore {
  score: number
  dimensions: { content: number; structure: number; language: number }
  suggestions: string
  reference: string
}

function scoreWritingLocal(text: string, prompt: string, reference: string): WritingScore {
  const wc = countWords(text)
  const sc = countSentences(text)
  const paras = text.split('\n').filter(Boolean).length

  let content = 60
  let structure = 60
  let language = 60
  const notes: string[] = []

  if (wc < 80) {
    notes.push('作文词数不足，建议 120-180 词。')
    content = 40
    structure = 40
  } else if (wc >= 120 && wc <= 180) {
    notes.push('✅ 词数符合四级要求（120-180 词）。')
    content = 75
    structure = 70
  } else {
    notes.push(`作文 ${wc} 词，四级要求 120-180 词。`)
    content = wc > 180 ? 65 : 55
  }

  if (paras < 2) {
    notes.push('建议分 2-3 段，让结构更清晰。')
    structure = Math.min(structure, 45)
  } else if (paras >= 3) {
    notes.push(`✅ 分为 ${paras} 段，结构完整。`)
    structure = Math.min(structure + 15, 85)
  } else {
    structure = Math.min(structure + 5, 75)
  }

  if (sc < 5) {
    notes.push('句子数量偏少，建议 8-15 个句子。')
    content = Math.min(content, 50)
  } else if (sc >= 8) {
    notes.push(`✅ 包含 ${sc} 个句子，内容丰富。`)
    content = Math.min(content + 10, 85)
  }

  const hasIntro = /first(ly)?|to begin with|in the first place|it is (widely|universally)/i.test(text)
  const hasBody = /second(ly)?|furthermore|moreover|in addition|besides|on the (one|other) hand/i.test(text)
  const hasConcl = /in conclusion|to sum up|in a word|in short|therefore|thus|in my opinion|in my view/i.test(text)
  if (hasIntro) structure = Math.min(structure + 8, 90)
  if (hasBody) structure = Math.min(structure + 8, 90)
  if (hasConcl) structure = Math.min(structure + 10, 90)
  if (hasIntro && hasBody && hasConcl) {
    notes.push('✅ 总—分—总结构清晰，包含引入、展开、总结。')
  } else {
    notes.push('💡 建议采用总—分—总结构：开头引入观点，中间展开论述，结尾总结。')
  }

  language = Math.min(Math.round(wc / sc) > 12 ? 70 : 60, 80)
  if (/[A-Z]/.test(text[0]) && /[.!?]$/.test(text.trim())) {
    language = Math.min(language + 5, 80)
  }

  const avgScore = Math.round((content + structure + language) / 3)
  const suggestions = notes.join('\n')

  return { score: avgScore, dimensions: { content, structure, language }, suggestions, reference }
}

interface IWritingData {
  tab: number
  tabs: string[]
  patterns: IPattern[]
  writings: IWriting[]
  expandedPattern: number | null
  selectedPattern: IPattern | null
  userSentence: string
  userParagraph: string
  currentWriting: IWriting | null
  writingAnswer: string
  result: string | null
  showResult: boolean
  darkMode: boolean
  paragraphTopics: ITopic[]
  currentTopic: ITopic
  sentenceWordCount: number
  paragraphWordCount: number
  writingWordCount: number
  submitting: boolean
  aiAvailable: boolean
  aiEnabled: boolean
  detailMode: boolean
}

interface IWritingMethods {
  onSwitchTab(e: WechatMiniprogram.TouchEvent): void
  togglePattern(e: WechatMiniprogram.TouchEvent): void
  onSentenceInput(e: WechatMiniprogram.Input): void
  onParagraphInput(e: WechatMiniprogram.Input): void
  onWritingInput(e: WechatMiniprogram.Input): void
  selectTopic(e: WechatMiniprogram.TouchEvent): void
  submitSentence(): void
  submitParagraph(): void
  enterWriting(e: WechatMiniprogram.TouchEvent): void
  backToWritingList(): void
  submitWriting(): void
  toggleAi(): void
}

Page<IWritingData, IWritingMethods>({
  data: {
    tab: 0,
    tabs: ['句型库', '段落写作', '全文模拟'],
    patterns: [],
    writings: [],
    expandedPattern: null,
    selectedPattern: null,
    userSentence: '',
    userParagraph: '',
    currentWriting: null,
    writingAnswer: '',
    result: null,
    showResult: false,
    darkMode: false,
    paragraphTopics: PARAGRAPH_TOPICS,
    currentTopic: PARAGRAPH_TOPICS[0],
    sentenceWordCount: 0,
    paragraphWordCount: 0,
    writingWordCount: 0,
    submitting: false,
    aiAvailable: false,
    aiEnabled: wx.getStorageSync('writingAiEnabled') !== false,
    detailMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ patterns: patternsData as IPattern[], writings: writingsData as IWriting[], darkMode: app.globalData.darkMode })

    checkHealth().then(r => {
      if (r.apiKey) this.setData({ aiAvailable: true })
    }).catch(() => {})
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, detailMode: false, showResult: false, result: null })
  },

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
    this.setData({
      userSentence: val,
      sentenceWordCount: val.trim() ? val.trim().split(/\s+/).length : 0,
    })
  },

  onParagraphInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value
    this.setData({
      userParagraph: val,
      paragraphWordCount: val.trim() ? val.trim().split(/\s+/).length : 0,
    })
  },

  onWritingInput(e: WechatMiniprogram.Input) {
    const val = e.detail.value
    this.setData({
      writingAnswer: val,
      writingWordCount: val.trim() ? val.trim().split(/\s+/).length : 0,
    })
  },

  selectTopic(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({
      currentTopic: this.data.paragraphTopics[index],
      showResult: false,
      result: null,
    })
  },

  toggleAi() {
    const val = !this.data.aiEnabled
    this.setData({ aiEnabled: val })
    wx.setStorageSync('writingAiEnabled', val)
  },

  async submitSentence() {
    const text = this.data.userSentence.trim()
    const pattern = this.data.selectedPattern
    if (!text) {
      wx.showToast({ title: '请输入句子', icon: 'none' })
      return
    }
    if (!pattern) {
      wx.showToast({ title: '请先点开一个句型', icon: 'none' })
      return
    }

    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })

    let result = scoreSentenceLocal(text, pattern)

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
    wx.hideLoading()
    this.setData({ submitting: false })
  },

  async submitParagraph() {
    const text = this.data.userParagraph.trim()
    const topic = this.data.currentTopic
    if (!text) {
      wx.showToast({ title: '请输入段落', icon: 'none' })
      return
    }

    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })

    let local = scoreParagraphLocal(text, topic)
    let score = local.score
    let dimensions = local.dimensions
    let suggestions = local.suggestions

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
    wx.hideLoading()
    this.setData({ submitting: false })
  },

  enterWriting(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.writings.find(w => w.id === id) || null
    this.setData({
      currentWriting: item,
      detailMode: true,
      writingAnswer: '',
      writingWordCount: 0,
      showResult: false,
      result: null,
    })
  },

  backToWritingList() {
    this.setData({ currentWriting: null, detailMode: false, writingAnswer: '', writingWordCount: 0, showResult: false, result: null })
  },

  async submitWriting() {
    const text = this.data.writingAnswer.trim()
    const prompt = this.data.currentWriting?.prompt || ''
    const reference = this.data.currentWriting?.reference || ''
    if (!text) {
      wx.showToast({ title: '请输入作文', icon: 'none' })
      return
    }

    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: '评审中...' })

    let local = scoreWritingLocal(text, prompt, reference)
    let score = local.score
    let dimensions = local.dimensions
    let suggestions = local.suggestions
    let ref = reference

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

    this.setData({
      showResult: true,
      result: `评分：${score}分\n\n内容：${dimensions.content}分\n结构：${dimensions.structure}分\n语言：${dimensions.language}分\n\n修改建议：\n${suggestions}\n\n参考范文：\n${ref}`,
    })

    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords
    records.push({ id: Date.now(), score, date: new Date().toISOString().slice(0, 10) })
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn()

    wx.hideLoading()
    this.setData({ submitting: false })
  },
})
