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
  darkMode: boolean
  choiceLabels: string[]
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
    darkMode: false,
    choiceLabels: ['A)', 'B)', 'C)', 'D)'],
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
      this.setData({ current: item, currentQ: 0, passagePage: 0, passagePages: pages })
    }
  },

  back() {
    this.setData({ current: null, currentQ: 0, passagePage: 0, passagePages: [] })
  },

  splitPassage(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()
    const parts = clean.split(/[.?!]\s*/).filter(s => s.trim().length > 5)
    const pages: string[] = []
    if (parts.length >= 2) {
      for (let i = 0; i < parts.length; i += 6) {
        pages.push(parts.slice(i, i + 6).join('. ') + '.')
      }
    } else {
      for (let i = 0; i < clean.length; i += 300) {
        pages.push(clean.slice(i, i + 300))
      }
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
