import listeningData from '../../../data/listening'
import { applyTheme, getDarkMode } from '../../../utils/theme'

const API_BASE = 'http://localhost:3001'

interface IListeningQ {
  qi: number
  options: string[]
}

let audioCtx: WechatMiniprogram.InnerAudioContext | null = null

Page({
  data: {
    passage: null as any,
    questions: [] as IListeningQ[],
    sel: {} as Record<number, number>,
    isPlaying: false,
    _submitted: false,
    showResult: false,
    _correctCount: 0,
    _totalCount: 0,
    _results: {} as Record<number, boolean>,
    _correctIdxs: {} as Record<number, number>,
    _letters: ['A','B','C','D'],
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const app = getApp<IAppOption>()
    const setId = app.globalData.examSet
    const passages = (listeningData as any[]).filter((l: any) => l.audioUrl)
    const passage = (setId === '2019062' ? passages[1] : passages[0]) || null
    if (!passage) { wx.showToast({ title: '暂无听力题', icon: 'none' }); return }

    const questions: IListeningQ[] = []
    for (const s of passage.sentences || []) {
      const qm = s.text && s.text.match(/^Q(\d+)\.\s*/)
      if (!qm) continue
      const qi = parseInt(qm[1])
      const parts = s.text.split(/[A-D]\)\s*/).filter(Boolean)
      const options = parts.slice(1).map((p: string) => p.replace(/\s+$/, ''))
      if (options.length === 4) questions.push({ qi, options })
    }

    const saved = app.globalData.studyData.listeningAnswers && app.globalData.studyData.listeningAnswers[passage.id] || {}
    const submitted = !!(saved as any).submitted
    let correctCount = 0, results: Record<number, boolean> = {}, correctIdxs: Record<number, number> = {}
    const ca = passage.correctAnswers || {}
    Object.keys(ca).forEach((k: string) => {
      const qi = Number(k)
      const _m = { A: 0, B: 1, C: 2, D: 3 }[ca[k] as string]; const correctIdx = _m != null ? _m : -1
      correctIdxs[qi] = correctIdx
      if (submitted) {
        const userIdx = saved[qi]
        const isCorrect = userIdx === correctIdx
        results[qi] = isCorrect
        if (isCorrect) correctCount++
      }
    })
    this.setData({ passage, questions, sel: saved, _submitted: submitted, showResult: false, _correctCount: correctCount, _totalCount: Object.keys(ca).length, _results: results, _correctIdxs: correctIdxs })
  },

  onUnload() {
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
  },

  toggleAudio() {
    if (!this.data.passage && this.data.passage.audioUrl) { wx.showToast({ title: '暂无音频', icon: 'none' }); return }
    if (audioCtx && this.data.isPlaying) {
      audioCtx.pause()
      this.setData({ isPlaying: false })
      return
    }
    if (audioCtx) {
      audioCtx.play()
      this.setData({ isPlaying: true })
      return
    }
    const src = this.data.passage.audioUrl.startsWith('http') ? this.data.passage.audioUrl : API_BASE + encodeURI(this.data.passage.audioUrl)
    audioCtx = wx.createInnerAudioContext()
    audioCtx.src = src
    audioCtx.onPlay(() => this.setData({ isPlaying: true }))
    audioCtx.onEnded(() => { this.setData({ isPlaying: false }) })
    audioCtx.onError(() => {
      wx.showToast({ title: '音频加载失败', icon: 'none' })
      this.setData({ isPlaying: false })
    })
    audioCtx.play()
  },

  select(e: any) {
    const qi = Number(e.currentTarget.dataset.qi)
    const oi = Number(e.currentTarget.dataset.oi)
    const sel = { ...this.data.sel }
    if (sel[qi] === oi) delete sel[qi]
    else sel[qi] = oi
    this.setData({ sel })
    if (this.data.passage && this.data.passage.id) {
      const app = getApp<IAppOption>()
      if (!app.globalData.studyData.listeningAnswers) app.globalData.studyData.listeningAnswers = {}
      app.globalData.studyData.listeningAnswers[this.data.passage.id] = sel
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
  },

  showResultAgain() { this.setData({ showResult: true }) },
  hideResult() { this.setData({ showResult: false }) },

  goBack() {
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
    wx.navigateBack()
  },
})
