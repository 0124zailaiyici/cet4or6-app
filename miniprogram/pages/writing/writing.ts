import { teachSentence, correctWriting, correctParagraph } from '../../utils/api'
import { doCheckIn } from '../../utils/checkin'
import patternsData from '../../data/sentence_patterns'
import writingsData from '../../data/writings'

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

interface IWritingData {
  tab: number
  tabs: string[]
  patterns: IPattern[]
  writings: IWriting[]
  expandedPattern: number | null
  userSentence: string
  userParagraph: string
  currentWriting: IWriting | null
  writingAnswer: string
  result: string | null
  showResult: boolean
  darkMode: boolean
}

interface IWritingMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  togglePattern(e: WechatMiniprogram.TouchEvent): void
  onSentenceInput(e: WechatMiniprogram.Input): void
  onParagraphInput(e: WechatMiniprogram.Input): void
  onWritingInput(e: WechatMiniprogram.Input): void
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
    userSentence: '',
    userParagraph: '',
    currentWriting: null,
    writingAnswer: '',
    result: null,
    showResult: false,
    darkMode: false,
  },

  onLoad() {
    const app = getApp<IAppOption>()
    this.setData({ patterns: patternsData as IPattern[], writings: writingsData as IWriting[], darkMode: app.globalData.darkMode })
  },

  onShow() {
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = e.currentTarget.dataset.tab as number
    this.setData({ tab, showResult: false, result: null })
  },

  togglePattern(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    this.setData({
      expandedPattern: this.data.expandedPattern === id ? null : id,
    })
  },

  onSentenceInput(e: WechatMiniprogram.Input) {
    this.setData({ userSentence: e.detail.value })
  },

  onParagraphInput(e: WechatMiniprogram.Input) {
    this.setData({ userParagraph: e.detail.value })
  },

  onWritingInput(e: WechatMiniprogram.Input) {
    this.setData({ writingAnswer: e.detail.value })
  },

  async submitSentence() {
    const text = this.data.userSentence.trim()
    if (!text) {
      wx.showToast({ title: '请输入句子', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 评审中...' })

    try {
      const res = await teachSentence('', text)
      this.setData({
        showResult: true,
        result: res.explanation,
      })
    } catch {
      this.setData({
        showResult: true,
        result: `你的句子：\n${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

    wx.hideLoading()
  },

  async submitParagraph() {
    const text = this.data.userParagraph.trim()
    if (!text) {
      wx.showToast({ title: '请输入段落', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 评审中...' })

    try {
      const res = await correctParagraph(
        'Environmental protection is everyone\'s responsibility.',
        text,
      )
      this.setData({
        showResult: true,
        result: `评分：${res.score}分\n\n连贯性：${res.dimensions.coherence}分\n内容：${res.dimensions.content}分\n语言：${res.dimensions.language}分\n\n修改建议：\n${res.suggestions}`,
      })
    } catch {
      this.setData({
        showResult: true,
        result: `你的段落：\n${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

    wx.hideLoading()
  },

  enterWriting(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.writings.find(w => w.id === id) || null
    this.setData({
      currentWriting: item,
      writingAnswer: '',
      showResult: false,
      result: null,
    })
  },

  backToWritingList() {
    this.setData({ currentWriting: null, writingAnswer: '', showResult: false, result: null })
  },

  async submitWriting() {
    const text = this.data.writingAnswer.trim()
    const prompt = this.data.currentWriting?.prompt || ''
    if (!text) {
      wx.showToast({ title: '请输入作文', icon: 'none' })
      return
    }

    wx.showLoading({ title: 'AI 批改中...' })

    try {
      const res = await correctWriting(prompt, text)
      this.setData({
        showResult: true,
        result: `评分：${res.score}分\n\n内容：${res.dimensions.content}分\n结构：${res.dimensions.structure}分\n语言：${res.dimensions.language}分\n\n修改建议：\n${res.suggestions}\n\n参考范文：\n${res.reference}`,
      })
    } catch {
      this.setData({
        showResult: true,
        result: `你的作文：\n${text}\n\n（AI 服务器未连接，提交已保存）`,
      })
    }

    wx.hideLoading()

    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords
    records.push({ id: Date.now(), score: 0, date: new Date().toISOString().slice(0, 10) })
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn()
  },
})
