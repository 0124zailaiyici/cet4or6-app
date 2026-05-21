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
  darkMode: boolean
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
}

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    darkMode: false,
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
    if (item) this.setData({ current: item })
  },

  back() {
    this.setData({ current: null })
  },
})
