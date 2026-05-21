import readingsData from '../../data/readings'

interface IReading {
  id: number
  title: string
  passage: string
  questions: string[]
}

interface IReadingData {
  readings: IReading[]
  current: IReading | null
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
}

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
  },

  onLoad() {
    this.setData({ readings: readingsData as IReading[] })
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
