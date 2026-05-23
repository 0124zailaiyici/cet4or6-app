import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import writingsData from '../../data/writings'
import translationsData from '../../data/translations'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IExamSet {
  id: string
  label: string
  readingIds: number[]
  listeningId: number | null
  writingId: number | null
  translationId: number | null
}

interface IExamData {
  phase: 'list' | 'exam' | 'result'
  examSets: IExamSet[]
  currentSet: IExamSet | null
  timer: number
  timerStr: string
  currentSection: number
  sectionNames: string[]
  answers: Record<string, string>[]
  score: number
  totalScore: number
  sectionScores: { label: string; correct: number; total: number }[]
  writingText: string
  translationText: string
  darkMode: boolean
}

interface IExamMethods {
  startExam(e: WechatMiniprogram.TouchEvent): void
  switchSection(e: WechatMiniprogram.TouchEvent): void
  onAnswer(e: WechatMiniprogram.TouchEvent): void
  onWritingInput(e: WechatMiniprogram.Input): void
  onTranslationInput(e: WechatMiniprogram.Input): void
  submitExam(): void
  backToList(): void
  startTimer(): void
}

let timerInterval: any = null

Page<IExamData, IExamMethods>({
  data: {
    phase: 'list',
    examSets: [],
    currentSet: null,
    timer: 7500,
    timerStr: '125:00',
    currentSection: 0,
    sectionNames: ['写作', '听力', '阅读', '翻译'],
    answers: [],
    score: 0,
    totalScore: 0,
    sectionScores: [],
    writingText: '',
    translationText: '',
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    // Build exam sets from available data
    const sets: IExamSet[] = []
    const listeningIds = (listeningData as any[]).filter(l => l.audioUrl).map(l => l.id)
    const readingIds = (readingsData as any[]).map(r => r.id)
    const writingIds = (writingsData as any[]).map(w => w.id)
    const translationIds = (translationsData as any[]).map(t => t.id)

    if (readingIds.length > 0) {
      sets.push({
        id: '2019061',
        label: '2019年6月 第1套',
        readingIds: readingIds.slice(0, 4),
        listeningId: listeningIds.length > 0 ? listeningIds[0] : null,
        writingId: writingIds.length > 0 ? writingIds[0] : null,
        translationId: translationIds.length > 0 ? translationIds[0] : null,
      })
    }
    if (readingIds.length > 4) {
      sets.push({
        id: '2019062',
        label: '2019年6月 第2套',
        readingIds: readingIds.slice(4, 8),
        listeningId: listeningIds.length > 1 ? listeningIds[1] : null,
        writingId: writingIds.length > 1 ? writingIds[1] : null,
        translationId: translationIds.length > 1 ? translationIds[1] : null,
      })
    }

    this.setData({ examSets: sets })
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
      content: '125 分钟倒计时，交卷后自动评分。确定开始？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ phase: 'exam', currentSet: set, timer: 7500, currentSection: 0, answers: [{}, {}, {}, {}] })
          this.startTimer()
        }
      },
    })
  },

  startTimer() {
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      if (this.data.timer <= 0) { clearInterval(timerInterval); this.submitExam(); return }
      const t = this.data.timer - 1
      const m = Math.floor(t / 60)
      const s = t % 60
      this.setData({ timer: t, timerStr: `${m}:${s < 10 ? '0' : ''}${s}` })
    }, 1000)
  },

  switchSection(e: WechatMiniprogram.TouchEvent) {
    this.setData({ currentSection: Number(e.currentTarget.dataset.section) })
  },

  onAnswer(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string
    const val = e.currentTarget.dataset.val as string
    const section = this.data.currentSection
    const answers = [...this.data.answers]
    answers[section] = answers[section] || {}
    if (answers[section][key] === val) delete answers[section][key]
    else answers[section][key] = val
    this.setData({ answers })
  },

  onWritingInput(e: WechatMiniprogram.Input) {
    this.setData({ writingText: e.detail.value })
  },

  onTranslationInput(e: WechatMiniprogram.Input) {
    this.setData({ translationText: e.detail.value })
  },

  submitExam() {
    if (timerInterval) clearInterval(timerInterval)
    const sd = getApp<IAppOption>().globalData.studyData
    const readingAnswers = sd.readingAnswers || {}
    const listeningAnswers = sd.listeningAnswers || {}

    // Score reading (Section C only)
    let readingCorrect = 0, readingTotal = 0
    if (this.data.currentSet) {
      for (const rid of this.data.currentSet.readingIds) {
        const ans = readingAnswers[rid]
        const passage = (readingsData as any[]).find(r => r.id === rid)
        if (!passage || !passage.correctAnswers || !ans?.cAnswers) continue
        for (const qi of Object.keys(passage.correctAnswers)) {
          if (passage.correctAnswers[qi] === ans.cAnswers[Number(qi)]) readingCorrect++
          readingTotal++
        }
      }
    }

    // Score listening
    let listenCorrect = 0, listenTotal = 0
    if (this.data.currentSet?.listeningId) {
      const lid = this.data.currentSet.listeningId
      const la = listeningAnswers[lid]
      const passage = (listeningData as any[]).find(l => l.id === lid)
      if (passage?.correctAnswers && la) {
        for (const qi of Object.keys(passage.correctAnswers)) {
          const correct = passage.correctAnswers[qi]
          for (const piStr of Object.keys(la)) {
            const pi = Number(piStr)
            const sentText = passage.sentences[pi]?.text || ''
            const qm = sentText.match(/^Q(\d+)\./)
            if (qm && qm[1] === qi) {
              if (optionLetter(la[pi]) === correct) listenCorrect++
              break
            }
          }
          listenTotal++
        }
      }
    }

    const score = readingCorrect * 10 + listenCorrect * 7
    this.setData({
      phase: 'result', score, totalScore: readingTotal * 10 + listenTotal * 7,
      sectionScores: [
        { label: '写作', correct: 0, total: 106 },
        { label: '听力', correct: listenCorrect, total: listenTotal },
        { label: '阅读', correct: readingCorrect, total: readingTotal },
        { label: '翻译', correct: 0, total: 106 },
      ],
    })
  },

  backToList() {
    this.setData({ phase: 'list', currentSet: null, score: 0, sectionScores: [] })
  },
})

function optionLetter(i: number): string {
  return ['A', 'B', 'C', 'D'][i] || '?'
}
