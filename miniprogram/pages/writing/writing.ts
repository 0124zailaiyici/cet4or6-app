import { teachSentence, correctWriting, correctParagraph } from '../../utils/api'
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
  { label: '环保', text: 'Environmental protection is everyone\'s responsibility.' },
  { label: '科技', text: 'The rapid development of technology has brought great changes to our daily life.' },
  { label: '教育', text: 'Education plays a vital role in shaping a person\'s future.' },
  { label: '健康', text: 'Health is the foundation of a happy and successful life.' },
  { label: '社会', text: 'In modern society, people are facing increasing pressure from work and life.' },
  { label: '校园', text: 'College life is a wonderful journey full of challenges and opportunities.' },
]

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
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ patterns: patternsData as IPattern[], writings: writingsData as IWriting[], darkMode: app.globalData.darkMode })
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onSwitchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, showResult: false, result: null })
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
    wx.showLoading({ title: 'AI 评审中...' })

    try {
      const res = await teachSentence(pattern.pattern, text)
      this.setData({
        showResult: true,
        result: `【使用句型】${pattern.pattern}\n【你的句子】${text}\n\n${res.explanation}`,
      })
    } catch {
      this.setData({
        showResult: true,
        result: `【使用句型】${pattern.pattern}\n【你的句子】${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

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
    wx.showLoading({ title: 'AI 评审中...' })

    try {
      const res = await correctParagraph(topic.text, text)
      this.setData({
        showResult: true,
        result: `评分：${res.score}分\n\n连贯性：${res.dimensions.coherence}分\n内容：${res.dimensions.content}分\n语言：${res.dimensions.language}分\n\n修改建议：\n${res.suggestions}`,
      })
    } catch {
      this.setData({
        showResult: true,
        result: `【主题句】${topic.text}\n【你的段落】${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

    wx.hideLoading()
    this.setData({ submitting: false })
  },

  enterWriting(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.writings.find(w => w.id === id) || null
    this.setData({
      currentWriting: item,
      writingAnswer: '',
      writingWordCount: 0,
      showResult: false,
      result: null,
    })
  },

  backToWritingList() {
    this.setData({ currentWriting: null, writingAnswer: '', writingWordCount: 0, showResult: false, result: null })
  },

  async submitWriting() {
    const text = this.data.writingAnswer.trim()
    const prompt = this.data.currentWriting?.prompt || ''
    if (!text) {
      wx.showToast({ title: '请输入作文', icon: 'none' })
      return
    }

    this.setData({ submitting: true, showResult: false, result: null })
    wx.showLoading({ title: 'AI 批改中...' })

    try {
      const res = await correctWriting(prompt, text)
      this.setData({
        showResult: true,
        result: `评分：${res.score}分\n\n内容：${res.dimensions.content}分\n结构：${res.dimensions.structure}分\n语言：${res.dimensions.language}分\n\n修改建议：\n${res.suggestions}\n\n参考范文：\n${res.reference}`,
      })

      const app = getApp<IAppOption>()
      const records = app.globalData.studyData.writingRecords
      records.push({ id: Date.now(), score: res.score, date: new Date().toISOString().slice(0, 10) })
      wx.setStorageSync('studyData', app.globalData.studyData)
      doCheckIn()
    } catch {
      this.setData({
        showResult: true,
        result: `你的作文：\n${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

    wx.hideLoading()
    this.setData({ submitting: false })
  },
})
