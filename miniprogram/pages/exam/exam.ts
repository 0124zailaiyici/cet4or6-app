import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IExamSet {
  id: string
  label: string
  readingIds: number[]
  listeningId: number | null
}

interface IExamData {
  phase: 'list' | 'exam'
  examSets: IExamSet[]
  currentSet: IExamSet | null
  timerStr: string
  remainingSec: number
  readingDone: number
  readingTotal: number
  listeningDone: number
  listeningTotal: number
  darkMode: boolean
}

interface IExamMethods {
  startExam(e: WechatMiniprogram.TouchEvent): void
  goReading(): void
  goListening(): void
  goWriting(): void
  goTranslation(): void
  submitExam(): void
  goBack(): void
  recalcProgress(): void
  startTimer(): void
}

let timerInterval: any = null

Page<IExamData, IExamMethods>({
  data: {
    phase: 'list',
    examSets: [],
    currentSet: null,
    timerStr: '125:00',
    remainingSec: 7500,
    readingDone: 0,
    readingTotal: 0,
    listeningDone: 0,
    listeningTotal: 0,
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const sets: IExamSet[] = []
    const listeningIds = (listeningData as any[]).filter((l: any) => l.audioUrl).map((l: any) => l.id)
    const readingIds = (readingsData as any[]).map((r: any) => r.id)
    if (readingIds.length > 0) sets.push({ id: '2019061', label: '2019年6月 第1套', readingIds: readingIds.slice(0, 4), listeningId: listeningIds[0] || null })
    if (readingIds.length > 4) sets.push({ id: '2019062', label: '2019年6月 第2套', readingIds: readingIds.slice(4, 8), listeningId: listeningIds[1] || null })
    this.setData({ examSets: sets })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode() })
    // Recalculate progress from storage
    if (this.data.phase === 'exam') {
      this.recalcProgress()
      // Restore timer from globalData
      const app = getApp<IAppOption>()
      const deadline = app.globalData.examDeadline
      if (deadline) {
        const sec = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
        this.setData({ remainingSec: sec, timerStr: fmtTime(sec) })
        if (sec <= 0) { this.submitExam(); return }
        this.startTimer()
      }
    }
  },

  onUnload() {
    if (timerInterval) clearInterval(timerInterval)
  },

  startExam(e: WechatMiniprogram.TouchEvent) {
    const setId = e.currentTarget.dataset.setId as string
    const set = this.data.examSets.find(s => s.id === setId)
    if (!set) return
    wx.showModal({
      title: '开始考试',
      content: '125 分钟倒计时，跳转到各题型页作答。交卷后自动评分。',
      success: (res) => {
        if (!res.confirm) return
        const seconds = 7500 // 125 min
        const app = getApp<IAppOption>()
        app.globalData.examDeadline = Date.now() + seconds * 1000
        app.globalData.examSet = setId
        this.setData({ phase: 'exam', currentSet: set, remainingSec: seconds, timerStr: '125:00' })
        this.recalcProgress()
        this.startTimer()
      },
    })
  },

  startTimer() {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      const app = getApp<IAppOption>()
      const sec = Math.max(0, Math.floor((app.globalData.examDeadline - Date.now()) / 1000))
      this.setData({ remainingSec: sec, timerStr: fmtTime(sec) })
      if (sec <= 0) { clearInterval(timerInterval); this.submitExam() }
    }, 1000)
  },

  recalcProgress() {
    if (!this.data.currentSet) return
    const sd = getApp<IAppOption>().globalData.studyData
    const ra = sd.readingAnswers || {}
    const la = sd.listeningAnswers || {}

    // Reading progress: count questions answered
    let rd = 0, rt = 0
    for (const rid of this.data.currentSet.readingIds) {
      const passage = (readingsData as any[]).find((r: any) => r.id === rid)
      if (!passage) continue
      const ans = ra[rid]
      if (passage.sectionType === 'C' && passage.questions) {
        for (let qi = 0; qi < passage.questions.length; qi++) {
          if (ans?.cAnswers?.[qi]) rd++
          rt++
        }
      }
    }

    // Listening progress
    let ld = 0, lt = 0
    if (this.data.currentSet.listeningId) {
      const lid = this.data.currentSet.listeningId
      const lans = la[lid]
      const passage = (listeningData as any[]).find((l: any) => l.id === lid)
      if (passage?.correctAnswers) {
        lt = Object.keys(passage.correctAnswers).length
        if (lans) {
          for (const qi of Object.keys(passage.correctAnswers)) {
            for (const piStr of Object.keys(lans)) {
              const pi = Number(piStr)
              const sentText = passage.sentences[pi]?.text || ''
              const qm = sentText.match(/^Q(\d+)\./)
              if (qm && qm[1] === qi) { ld++; break }
            }
          }
        }
      }
    }

    this.setData({ readingDone: rd, readingTotal: rt, listeningDone: ld, listeningTotal: lt })
  },

  goReading() {
    wx.navigateTo({ url: '/pages/reading/reading?examMode=1' })
  },
  goListening() {
    wx.navigateTo({ url: '/pages/listening/listening?examMode=1' })
  },
  goWriting() {
    wx.navigateTo({ url: '/pages/writing/writing?examMode=1' })
  },
  goTranslation() {
    wx.navigateTo({ url: '/pages/translation/translation?examMode=1' })
  },

  submitExam() {
    if (timerInterval) clearInterval(timerInterval)
    const app = getApp<IAppOption>()
    app.globalData.examDeadline = 0
    app.globalData.examSet = ''
    this.recalcProgress()
    wx.showToast({ title: '已交卷', icon: 'success' })
  },

  goBack() {
    if (timerInterval) clearInterval(timerInterval)
    const app = getApp<IAppOption>()
    app.globalData.examDeadline = 0
    this.setData({ phase: 'list', currentSet: null })
  },
})

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
