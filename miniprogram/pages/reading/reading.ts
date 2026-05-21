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
  darkMode: boolean
  paraLetters: string[]
  choiceLabels: string[]
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
  prevQ(): void
  nextQ(): void
}

const paraLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const choiceLabels = ['A)', 'B)', 'C)', 'D)']

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    currentQ: 0,
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
    if (item) this.setData({ current: item, currentQ: 0 })
  },

  back() {
    this.setData({ current: null, currentQ: 0 })
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
})
