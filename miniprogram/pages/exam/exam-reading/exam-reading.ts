import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passages: [] as any[],
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const app = getApp<IAppOption>()
    const rData = readingsData as any[]
    const ids = (app.globalData.examSet === '2019062') ? rData.slice(4, 8).map((r: any) => r.id) : rData.slice(0, 4).map((r: any) => r.id)
    const passages = ids.map((id: number) => rData.find((r: any) => r.id === id)).filter(Boolean)
    this.setData({ passages })
  },

  select(e: any) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    const map: any = { A: 'exam-reading-a', B: 'exam-reading-b', C: 'exam-reading-c' }
    const page = map[type]
    if (page) wx.navigateTo({ url: `/pages/exam/${page}/${page}?id=${id}` })
  },

  goBack() { wx.navigateBack() },
})
