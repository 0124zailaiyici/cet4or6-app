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

interface IExamQ {
  key: string
  source: string
  question: string
  options: string[]
  correct: string
  userAnswer: string
}

interface IExamData {
  phase: 'list' | 'exam' | 'result'
  examSets: IExamSet[]
  currentSet: IExamSet | null
  timer: number
  timerStr: string
  currentSection: number
  sectionNames: string[]
  readingQuestions: IExamQ[]
  listeningQuestions: IExamQ[]
  writingText: string
  translationText: string
  readingCorrect: number
  readingTotal: number
  listeningCorrect: number
  listeningTotal: number
  darkMode: boolean
}

interface IExamMethods {
  startExam(e: WechatMiniprogram.TouchEvent): void
  switchSection(e: WechatMiniprogram.TouchEvent): void
  selectReading(e: WechatMiniprogram.TouchEvent): void
  selectListening(e: WechatMiniprogram.TouchEvent): void
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
    readingQuestions: [],
    listeningQuestions: [],
    writingText: '',
    translationText: '',
    readingCorrect: 0,
    readingTotal: 0,
    listeningCorrect: 0,
    listeningTotal: 0,
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const sets: IExamSet[] = []
    const listeningIds = (listeningData as any[]).filter((l: any) => l.audioUrl).map((l: any) => l.id)
    const readingIds = (readingsData as any[]).map((r: any) => r.id)
    const writingIds = (writingsData as any[]).map((w: any) => w.id)
    const translationIds = (translationsData as any[]).map((t: any) => t.id)

    if (readingIds.length > 0) {
      sets.push({
        id: '2019061', label: '2019年6月 第1套',
        readingIds: readingIds.slice(0, 4),
        listeningId: listeningIds.length > 0 ? listeningIds[0] : null,
        writingId: writingIds.length > 0 ? writingIds[0] : null,
        translationId: translationIds.length > 0 ? translationIds[0] : null,
      })
    }
    if (readingIds.length > 4) {
      sets.push({
        id: '2019062', label: '2019年6月 第2套',
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
      content: '125 分钟倒计时，交卷后自动评分。写作和翻译需手动评分。',
      success: (res) => {
        if (!res.confirm) return

        // Load reading questions (Section C only, multiple choice)
        const rq: IExamQ[] = []
        for (const rid of set.readingIds) {
          const passage = (readingsData as any[]).find((r: any) => r.id === rid)
          if (!passage || !passage.questions || !passage.choices) continue
          const correct = passage.correctAnswers || {}
          if (passage.sectionType !== 'C') continue
          for (let qi = 0; qi < passage.questions.length; qi++) {
            rq.push({
              key: `${rid}-${qi}`,
              source: passage.title || '',
              question: passage.questions[qi] || '',
              options: (passage.choices[qi] || []).map((o: string) => o),
              correct: correct[String(qi)] || '',
              userAnswer: '',
            })
          }
        }

        // Load listening questions
        const lq: IExamQ[] = []
        if (set.listeningId) {
          const pass = (listeningData as any[]).find((l: any) => l.id === set.listeningId)
          if (pass && pass.sentences) {
            const correct = pass.correctAnswers || {}
            for (const s of pass.sentences) {
              const qm = s.text.match(/^Q(\d+)\./)
              if (!qm) continue
              const qn = qm[1]
              const opts = s.text.split(/(?=[A-D]\))/).filter((p: string) => /^[A-D]\)/.test(p)).map((o: string) => o.trim())
              if (opts.length >= 2) {
                lq.push({
                  key: `l-${set.listeningId}-${qn}`,
                  source: pass.title || '',
                  question: `Q${qn}`,
                  options: opts,
                  correct: correct[qn] || '',
                  userAnswer: '',
                })
              }
            }
          }
        }

        this.setData({
          phase: 'exam', currentSet: set, timer: 7500, currentSection: 0,
          writingText: '', translationText: '',
          readingQuestions: rq, listeningQuestions: lq,
          readingCorrect: 0, readingTotal: 0, listeningCorrect: 0, listeningTotal: 0,
        })
        this.startTimer()
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

  selectReading(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const rq = this.data.readingQuestions.map((q, i) => {
      if (i !== idx) return q
      const letter = 'ABCD'[Number(e.currentTarget.dataset.oi)]
      return { ...q, userAnswer: q.userAnswer === letter ? '' : letter }
    })
    this.setData({ readingQuestions: rq })
  },

  selectListening(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const lq = this.data.listeningQuestions.map((q, i) => {
      if (i !== idx) return q
      const letter = 'ABCD'[Number(e.currentTarget.dataset.oi)]
      return { ...q, userAnswer: q.userAnswer === letter ? '' : letter }
    })
    this.setData({ listeningQuestions: lq })
  },

  onWritingInput(e: WechatMiniprogram.Input) {
    this.setData({ writingText: e.detail.value })
  },

  onTranslationInput(e: WechatMiniprogram.Input) {
    this.setData({ translationText: e.detail.value })
  },

  submitExam() {
    if (timerInterval) clearInterval(timerInterval)

    // Score reading
    let rc = 0, rt = 0
    for (const q of this.data.readingQuestions) {
      if (q.correct && q.userAnswer) { if (q.userAnswer === q.correct) rc++; rt++ }
      else if (q.correct) { rt++ }
    }

    // Score listening
    let lc = 0, lt = 0
    for (const q of this.data.listeningQuestions) {
      if (q.correct && q.userAnswer) { if (q.userAnswer === q.correct) lc++; lt++ }
      else if (q.correct) { lt++ }
    }

    this.setData({
      phase: 'result', readingCorrect: rc, readingTotal: rt, listeningCorrect: lc, listeningTotal: lt,
    })
  },

  backToList() {
    this.setData({ phase: 'list', currentSet: null })
  },
})
