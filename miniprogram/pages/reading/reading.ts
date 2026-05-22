import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IReadingItem {
  id: number
  title: string
  sectionType: string
  passage: string
  questions: string[]
  options: string[]
  choices: string[][]
}

interface IReadingData {
  readings: IReadingItem[]
  current: IReadingItem | null
  currentQ: number
  passagePage: number
  passagePages: string[]
  blankedPages: string[]
  formattedPages: string[]
  darkMode: boolean
  choiceLabels: string[]
  optionLetters: string[]
  touchStartX: number
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
  prevQ(): void
  nextQ(): void
  prevPassage(): void
  nextPassage(): void
  splitPassage(text: string): string[]
  formatPara(text: string): string
  escapeHtml(s: string): string
  highlightBlanks(text: string): string
  onTouchStart(e: WechatMiniprogram.TouchEvent): void
  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent): void
}

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    currentQ: 0,
    passagePage: 0,
    passagePages: [],
    blankedPages: [],
    formattedPages: [],
    darkMode: false,
    choiceLabels: ['A)', 'B)', 'C)', 'D)'],
    optionLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'],
    touchStartX: 0,
  },

  onLoad() {
    this.setData({ readings: readingsData as IReadingItem[] })
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
  },

  select(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.readings.find(r => r.id === id)
    if (item) {
      const pages = this.splitPassage(item.passage)
      const formatted = pages.map(p => this.formatPara(p))
      const blanked = item.sectionType === 'A' ? formatted.map(p => this.highlightBlanks(p)) : []
      this.setData({ current: item, currentQ: 0, passagePage: 0, passagePages: pages, blankedPages: blanked, formattedPages: formatted })
    }
  },

  back() {
    this.setData({ current: null, currentQ: 0, passagePage: 0, passagePages: [] })
  },

  splitPassage(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()

    // 按段落切分：先分裂句子，再将句子分组为段落
    const sentences = clean.split(/[.?!]\s*/).filter(s => s.trim().length > 5)
    const paras: string[] = []
    let currentPara = ''
    let sentenceCount = 0
    const startWords = ['however', 'but', 'while', 'in', 'the', 'although', 'according', 'as', 'despite', 'during', 'for', 'if', 'when', 'because', 'since', 'after', 'before', 'until', 'this', 'these', 'that', 'those', 'one', 'two', 'some', 'many', 'most', 'all', 'each', 'every', 'both', 'no', 'there', 'what', 'which', 'who', 'how', 'why', 'where']

    for (const sent of sentences) {
      const firstWord = sent.trim().toLowerCase().split(/\s+/)[0] || ''
      const isNewPara = sentenceCount > 0 && (startWords.includes(firstWord) || /^["""""'']/.test(sent.trim()))

      if (isNewPara || sentenceCount >= 3) {
        if (currentPara) {
          paras.push(currentPara.trim() + '.')
          currentPara = ''
          sentenceCount = 0
        }
      }
      currentPara += (currentPara ? '. ' : '') + sent.trim()
      sentenceCount++
    }
    if (currentPara) paras.push(currentPara.trim() + '.')

    // 按页分割（每页2-3个段落）
    const pages: string[] = []
    for (let i = 0; i < paras.length; i += 2) {
      pages.push(paras.slice(i, i + 2).join('\n\n'))
    }
    return pages.length > 0 ? pages : [text]
  },

  prevQ() {
    if (this.data.currentQ > 0) {
      this.setData({ currentQ: this.data.currentQ - 1 })
    }
  },

  nextQ() {
    const total = this.data.current?.questions?.length || 0
    if (this.data.currentQ < total - 1) {
      this.setData({ currentQ: this.data.currentQ + 1 })
    }
  },

  prevPassage() {
    if (this.data.passagePage > 0) {
      this.setData({ passagePage: this.data.passagePage - 1 })
    }
  },

  nextPassage() {
    if (this.data.passagePage < this.data.passagePages.length - 1) {
      this.setData({ passagePage: this.data.passagePage + 1 })
    }
  },

  formatPara(text: string): string {
    const paras = text.split('\n\n').filter(s => s.trim())
    return paras.map(p => `<p style="margin:0 0 0.6em 0;line-height:1.9">${this.escapeHtml(p.trim())}</p>`).join('')
  },

  escapeHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  },

  highlightBlanks(text: string): string {
    return text.replace(/\b(\d{2})\b/g, '<span style="color:#ff6b8a;font-weight:700;border-bottom:2px solid #ff6b8a">$1</span>')
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({ touchStartX: e.touches[0].clientX })
  },

  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx > 50) this.prevPassage()
    else if (dx < -50) this.nextPassage()
  },

  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx > 50) this.prevQ()
    else if (dx < -50) this.nextQ()
  },
})
