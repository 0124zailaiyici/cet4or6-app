import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IReadingItem {
  id: number
  title: string
  sectionType: string
  passage: string
  questions: string[]
  options: string[]
}

interface IReadingData {
  readings: IReadingItem[]
  current: IReadingItem | null
  currentQ: number
  passagePage: number
  passagePages: string[]
  currentChoices: string[]
  darkMode: boolean
  paraLetters: string[]
  choiceLabels: string[]
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
  prevQ(): void
  nextQ(): void
  prevPassage(): void
  nextPassage(): void
  splitPassage(text: string): string[]
  getChoicesForQuestion(item: IReadingItem, qIdx: number): string[]
}

const paraLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const choiceLabels = ['A)', 'B)', 'C)', 'D)']

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    currentQ: 0,
    passagePage: 0,
    passagePages: [],
    currentChoices: [],
    darkMode: false,
    paraLetters,
    choiceLabels,
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
      this.setData({
        current: item,
        currentQ: 0,
        passagePage: 0,
        passagePages: pages,
        currentChoices: this.getChoicesForQuestion(item, 0),
      })
    }
  },

  back() {
    this.setData({ current: null, currentQ: 0, passagePage: 0, passagePages: [], currentChoices: [] })
  },

  // 把文章按句子拆分，每页最多 6 句
  splitPassage(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()
    // 按句子切分，兼容无标点的情况
    let sents = clean.split(/(?<=[.?!])\s+/).filter((s: string) => s.trim().length > 5)
    if (sents.length < 2) {
      // 没有完整句子，按 200 字一页分
      sents = []
      for (let i = 0; i < clean.length; i += 200) {
        sents.push(clean.slice(i, i + 200))
      }
    }
    const pages: string[] = []
    for (let i = 0; i < sents.length; i += 6) {
      pages.push(sents.slice(i, i + 6).join(' '))
    }
    return pages.length > 0 ? pages : [text]
  },

  getChoicesForQuestion(item: IReadingItem, _qIdx: number): string[] {
    if (item.sectionType === 'A') return item.options || []
    if (item.sectionType === 'C') return choiceLabels
    return []
  },

  prevQ() {
    if (this.data.currentQ > 0) {
      const q = this.data.currentQ - 1
      this.setData({
        currentQ: q,
        currentChoices: this.getChoicesForQuestion(this.data.current!, q),
      })
    }
  },

  nextQ() {
    const total = this.data.current?.questions?.length || 0
    if (this.data.currentQ < total - 1) {
      const q = this.data.currentQ + 1
      this.setData({
        currentQ: q,
        currentChoices: this.getChoicesForQuestion(this.data.current!, q),
      })
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
})
