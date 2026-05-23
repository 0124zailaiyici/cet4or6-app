import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IReadingPassage {
  id: number
  sectionType: 'A' | 'B' | 'C'
  passage: string
  questions: string[]
  options: string[]
  choices: string[][]
  correctAnswers: Record<string, string>
}

interface IListeningPassage {
  id: number
  title: string
  audioUrl: string
  sentences: { text: string; start: number; end: number }[]
  correctAnswers: Record<string, string>
}

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

const EXAM_DURATION = 7500
const TWO_HOURS_FIVE = '125:00'
let timerInterval: any = null

Page<IExamData, IExamMethods>({
  data: {
    phase: 'list',
    examSets: [],
    currentSet: null,
    timerStr: TWO_HOURS_FIVE,
    remainingSec: EXAM_DURATION,
    readingDone: 0,
    readingTotal: 0,
    listeningDone: 0,
    listeningTotal: 0,
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const data = readingsData as IReadingPassage[]
    const sets: IExamSet[] = []
    const listeningIds = (listeningData as IListeningPassage[]).filter(l => l.audioUrl).map(l => l.id)
    const readingIds = data.map(r => r.id)
    if (readingIds.length > 0) sets.push({ id: '2019061', label: '2019年6月 第1套', readingIds: readingIds.slice(0, 4), listeningId: listeningIds[0] || null })
    if (readingIds.length > 4) sets.push({ id: '2019062', label: '2019年6月 第2套', readingIds: readingIds.slice(4, 8), listeningId: listeningIds[1] || null })
    this.setData({ examSets: sets })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode() })
    if (this.data.phase === 'exam') {
      this.recalcProgress()
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
        const app = getApp<IAppOption>()
        app.globalData.examDeadline = Date.now() + EXAM_DURATION * 1000
        app.globalData.examSet = setId
        this.setData({ phase: 'exam', currentSet: set, remainingSec: EXAM_DURATION, timerStr: TWO_HOURS_FIVE })
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

    let rd = 0, rt = 0
    const rData = readingsData as IReadingPassage[]
    for (const rid of this.data.currentSet.readingIds) {
      const passage = rData.find(r => r.id === rid)
      if (!passage) continue
      const ans = ra[rid]

      if (passage.sectionType === 'A') {
        const total = Object.keys(passage.correctAnswers).length
        rd += ans ? Object.keys(ans.blankAnswers).length : 0
        rt += total
      } else if (passage.sectionType === 'B') {
        const total = passage.questions.length
        rd += ans ? Object.keys(ans.matchAnswers || {}).length : 0
        rt += total
      } else if (passage.sectionType === 'C') {
        const total = passage.questions.length
        rd += ans ? Object.keys(ans.cAnswers || {}).length : 0
        rt += total
      }
    }

    let ld = 0, lt = 0
    if (this.data.currentSet.listeningId) {
      const lid = this.data.currentSet.listeningId
      const passage = (listeningData as IListeningPassage[]).find(l => l.id === lid)
      const lans = la[lid]
      if (passage?.correctAnswers) {
        const keys = Object.keys(passage.correctAnswers)
        lt = keys.length
        if (lans) {
          for (const k of keys) {
            if (lans[Number(k)] !== undefined) ld++
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
    getApp<IAppOption>().globalData.examDeadline = 0
    this.setData({ phase: 'list', currentSet: null })
  },
})

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
