import readingsData from '../../../data/readings'
import { applyTheme, getDarkMode } from '../../../utils/theme'

Page({
  data: {
    passages: [] as any[],
    fs: getApp<IAppOption>().globalData.fontSize || 16,

    fsOpen: false,

    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ fs: getApp<IAppOption>().globalData.fontSize || 16,
 fsOpen: false,
 darkMode: getDarkMode() })
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

  toggleFs() {
    this.setData({ fsOpen: !this.data.fsOpen })
  },
  changeFs(e: WechatMiniprogram.TouchEvent) {
    const d = parseInt(e.currentTarget.dataset.d as string) || 0
    let v = Math.max(12, Math.min(26, this.data.fs + d))
    this.setData({ fs: v })
    const app = getApp<IAppOption>()
    app.globalData.fontSize = v
    wx.setStorageSync('fontSize', v)
  },
})
