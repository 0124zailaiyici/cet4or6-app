import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import writingsData from '../../data/writings'
import translationsData from '../../data/translations'
import { scoreWriting, scoreTranslation } from '../../utils/scorer'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IExamSet {
  id: string
  label: string
  readingIds: number[]
  listeningId: number | null
}

interface IExamData {
  phase: 'list' | 'exam' | 'result'
  examSets: IExamSet[]
  currentSet: IExamSet | null
  _takenSets: Record<string, boolean>
  timerStr: string
  remainingSec: number
  readingDone: number
  readingTotal: number
  listeningDone: number
  listeningTotal: number
  readingScore: number
  readingTotalScore: number
  listeningScore: number
  listeningTotalScore: number
  readingResults: { title: string; score: number; total: number }[]
  listeningResults: { title: string; score: number; total: number }[]
  writingResults: { title: string; score: number; total: number }[]
  translationResults: { title: string; score: number; total: number }[]
  darkMode: boolean
}

interface IExamMethods {
  startExam(e: WechatMiniprogram.TouchEvent): void
  goReading(): void
  goListening(): void
  goWriting(): void
  goTranslation(): void
  submitExam(): void
  reviewExam(e: WechatMiniprogram.TouchEvent): void
  clearExam(e: WechatMiniprogram.TouchEvent): void
  goBack(): void
  recalcProgress(): void
  startTimer(): void
  computeTakenSets(sets: IExamSet[]): Record<string, boolean>
}

let timerInterval: any = null

Page<IExamData, IExamMethods>({
  data: {
    phase: 'list',
    examSets: [],
    currentSet: null,
    timerStr: '125:00',
    remainingSec: 7500,
    _takenSets: {},
    readingDone: 0,
    readingTotal: 0,
    listeningDone: 0,
    listeningTotal: 0,
    readingScore: 0,
    readingTotalScore: 0,
    listeningScore: 0,
    listeningTotalScore: 0,
    readingResults: [],
    listeningResults: [],
    writingResults: [],
    translationResults: [],
    darkMode: false,
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const sets: IExamSet[] = []
    const lData = listeningData as any[]
    const rData = readingsData as any[]
    // Build exam sets from available listening data
    for (const l of lData) {
      if (!l.audioUrl || !l.correctAnswers) continue
      // Extract year-month-set from title
      const m = l.title.match(/(\d{4})(\d{2})(\d)/)
      if (!m) continue
      const y = m[1], mo = m[2], s = m[3]
      const prefix = `${y}${mo}${s}`
      const label = `${y}年${mo}月 第${s}套`
      // Find matching reading entries by title
      const rIds = rData.filter((r: any) => r.title && r.title.includes(prefix)).map((r: any) => r.id)
      // If no reading match found, still try to include the set (with empty reading)
      const setId = prefix
      if (!sets.find((x: IExamSet) => x.id === setId)) {
        sets.push({ id: setId, label, readingIds: rIds, listeningId: l.id })
      }
    }
    // Sort by year descending (newest first)
    sets.sort((a: IExamSet, b: IExamSet) => b.id.localeCompare(a.id))
    this.setData({ examSets: sets, _takenSets: this.computeTakenSets(sets) })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode(), _takenSets: this.computeTakenSets(this.data.examSets) })
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

  computeTakenSets(sets: IExamSet[]): Record<string, boolean> {
    const ra = getApp<IAppOption>().globalData.studyData.readingAnswers || {}
    const result: Record<string, boolean> = {}
    for (const set of sets) {
      result[set.id] = set.readingIds.some((rid: number) => (ra[rid] as any || {}).submitted)
    }
    return result
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
        const seconds = 7500
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

    let rd = 0, rt = 0
    for (const rid of this.data.currentSet.readingIds) {
      const passage = (readingsData as any[]).find((r: any) => r.id === rid)
      if (!passage) continue
      const ans = ra[rid]
      if (passage.sectionType === 'A') {
        rt += Object.keys(passage.correctAnswers || {}).length
        rd += ans ? Object.keys(ans.blankAnswers || {}).length : 0
      } else if (passage.sectionType === 'B') {
        rt += (passage.questions || []).length
        rd += ans ? Object.keys(ans.matchAnswers || {}).length : 0
      } else if (passage.sectionType === 'C' && passage.questions) {
        for (let qi = 0; qi < passage.questions.length; qi++) {
          if (ans && ans.cAnswers && ans.cAnswers[qi]) rd++
          rt++
        }
      }
    }

    let ld = 0, lt = 0
    if (this.data.currentSet.listeningId) {
      const lid = this.data.currentSet.listeningId
      const lans = la[lid]
      const passage = (listeningData as any[]).find((l: any) => l.id === lid)
      if (passage && passage.correctAnswers) {
        lt = Object.keys(passage.correctAnswers).length
        if (lans) {
          for (const k of Object.keys(passage.correctAnswers)) {
            if (lans[Number(k)] !== undefined) ld++
          }
        }
      }
    }

    this.setData({ readingDone: rd, readingTotal: rt, listeningDone: ld, listeningTotal: lt })
  },

  goReading() {
    wx.navigateTo({ url: '/pages/exam/exam-reading/exam-reading' })
  },
  goListening() {
    wx.navigateTo({ url: '/pages/exam/exam-listening/exam-listening' })
  },
  goWriting() {
    wx.navigateTo({ url: '/pages/exam/exam-writing/exam-writing' })
  },
  goTranslation() {
    wx.navigateTo({ url: '/pages/exam/exam-translation/exam-translation' })
  },

  submitExam() {
    if (timerInterval) clearInterval(timerInterval)
    const app = getApp<IAppOption>()
    app.globalData.examDeadline = 0
    app.globalData.examSet = ''
    const set = this.data.currentSet
    if (!set) return
    const sd = app.globalData.studyData
    const ra = sd.readingAnswers || {}
    const la = sd.listeningAnswers || {}

    const rData = readingsData as any[]
    const lData = listeningData as any[]

    let readingScore = 0, readingTotal = 0
    const readingResults: { title: string; score: number; total: number }[] = []

    for (const rid of set.readingIds) {
      const passage = rData.find((r: any) => r.id === rid)
      if (!passage) continue
      const ans = ra[rid] || {}
      const ca = passage.correctAnswers || {}
      let correct = 0, total = Object.keys(ca).length
      if (passage.sectionType === 'A') {
        const ba = ans.blankAnswers || {}
        Object.keys(ca).forEach(k => { if (ba[k] === ca[k]) correct++ })
      } else if (passage.sectionType === 'B') {
        const ma = ans.matchAnswers || {}
        Object.keys(ca).forEach(k => { if (ma[Number(k)] === ca[k]) correct++ })
      } else if (passage.sectionType === 'C') {
        const ca2 = ans.cAnswers || {}
        const choices = passage.choices || []
        Object.keys(ca).forEach(k => {
          const qi = Number(k)
          const correctLetter = ca[k]
          const ansChoice = (choices[qi] || []).find((ch: string) => ch.startsWith(correctLetter)) || ''
          if (ca2[qi] === ansChoice) correct++
        })
      }
      readingScore += correct
      readingTotal += total
      readingResults.push({ title: passage.title, score: correct, total })
      ;(ans as any).submitted = true
      ;(ans as any).score = correct
      ;(ans as any).totalScore = total
    }

    let listeningScore = 0, listeningTotal = 0
    const listeningResults: { title: string; score: number; total: number }[] = []

    if (set.listeningId) {
      const passage = lData.find((l: any) => l.id === set.listeningId)
      if (passage && passage.correctAnswers) {
        const ca = passage.correctAnswers || {}
        const lans = la[set.listeningId] || {}
        listeningTotal = Object.keys(ca).length
        Object.keys(ca).forEach(k => {
          const idx = Number(k)
          const letterIdx = { A: 0, B: 1, C: 2, D: 3 }[ca[k] as string]
          if (lans[idx] === letterIdx) listeningScore++
        })
        listeningResults.push({ title: '听力理解', score: listeningScore, total: listeningTotal })
        ;(lans as any).submitted = true
        ;(lans as any).score = listeningScore
        ;(lans as any).totalScore = listeningTotal
      }
    }

    let writingScore = 0, writingTotal = 100
    const writingResults: { title: string; score: number; total: number }[] = []
    const wa = (sd as any).writingAnswers || {}
    const wKey = Object.keys(wa)[0]
    if (wKey) {
      const ws = scoreWriting(wa[wKey])
      writingScore = ws.score
      const wData = (writingsData as any[]).find((w: any) => w.id === Number(wKey))
      writingResults.push({ title: wData && wData.title || '写作', score: writingScore, total: writingTotal })
    }

    let translationScore = 0, translationTotal = 100
    const translationResults: { title: string; score: number; total: number }[] = []
    const ta = (sd as any).translationAnswers || {}
    const tKey = Object.keys(ta)[0]
    if (tKey) {
      const tItem = (translationsData as any[]).find((t: any) => t.id === Number(tKey))
      if (tItem) {
        const ts = scoreTranslation(ta[tKey], { reference: tItem.reference, keywords: tItem.keywords, acceptableAnswers: tItem.acceptableAnswers })
        translationScore = ts.total
        translationResults.push({ title: tItem.title || '翻译', score: translationScore, total: translationTotal })
      }
    }

    wx.setStorageSync('studyData', sd)
    const taken = { ...this.data._takenSets, [set.id]: true }

    this.setData({
      _takenSets: taken,
      phase: 'result',
      readingScore, readingTotalScore: readingTotal,
      listeningScore, listeningTotalScore: listeningTotal,
      readingResults, listeningResults,
      writingResults,
      writingScore, writingTotalScore: writingTotal,
      translationResults,
      translationScore, translationTotalScore: translationTotal,
    })
  },

  reviewExam(e: WechatMiniprogram.TouchEvent) {
    const setId = e.currentTarget.dataset.setId as string
    const set = this.data.examSets.find(s => s.id === setId)
    if (!set) return
    const sd = getApp<IAppOption>().globalData.studyData
    const ra = sd.readingAnswers || {}
    const la = sd.listeningAnswers || {}
    const rData = readingsData as any[], lData = listeningData as any[]

    let rs = 0, rt = 0
    const rRes: { title: string; score: number; total: number }[] = []
    for (const rid of set.readingIds) {
      const p = rData.find((r: any) => r.id === rid)
      if (!p) continue
      const ans = ra[rid] || {}
      const ca = p.correctAnswers || {}
      let c = 0, t = Object.keys(ca).length
      if (p.sectionType === 'A') {
        const ba = ans.blankAnswers || {}
        Object.keys(ca).forEach(k => { if (ba[k] === ca[k]) c++ })
      } else if (p.sectionType === 'B') {
        const ma = ans.matchAnswers || {}
        Object.keys(ca).forEach(k => { if (ma[Number(k)] === ca[k]) c++ })
      } else if (p.sectionType === 'C') {
        const ca2 = ans.cAnswers || {}
        const choices = p.choices || []
        Object.keys(ca).forEach(k => {
          const qi = Number(k), cl = ca[k]
          if (ca2[qi] === ((choices[qi] || []).find((ch: string) => ch.startsWith(cl)) || '')) c++
        })
      }
      rs += c; rt += t; rRes.push({ title: p.title, score: c, total: t })
    }

    let ls = 0, lt = 0
    const lRes: { title: string; score: number; total: number }[] = []
    if (set.listeningId) {
      const p = lData.find((l: any) => l.id === set.listeningId)
      if (p && p.correctAnswers) {
        const ca = p.correctAnswers
        lt = Object.keys(ca).length
        const lans = la[set.listeningId] || {}
        Object.keys(ca).forEach(k => { const li = { A: 0, B: 1, C: 2, D: 3 }[ca[k] as string]; if (lans[Number(k)] === li) ls++ })
        lRes.push({ title: '听力理解', score: ls, total: lt })
      }
    }

    let ws = 0, wt = 100
    const wRes: { title: string; score: number; total: number }[] = []
    const wa = (sd as any).writingAnswers || {}
    const wK = Object.keys(wa)[0]
    if (wK) { ws = scoreWriting(wa[wK]).score; wRes.push({ title: '写作', score: ws, total: wt }) }

    let ts2 = 0, tt = 100
    const tRes: { title: string; score: number; total: number }[] = []
    const ta = (sd as any).translationAnswers || {}
    const tK = Object.keys(ta)[0]
    if (tK) {
      const ti = (translationsData as any[]).find((t: any) => t.id === Number(tK))
      if (ti) { ts2 = scoreTranslation(ta[tK], { reference: ti.reference, keywords: ti.keywords, acceptableAnswers: ti.acceptableAnswers }).total; tRes.push({ title: ti.title || '翻译', score: ts2, total: tt }) }
    }

    this.setData({
      phase: 'result', currentSet: set,
      readingScore: rs, readingTotalScore: rt, readingResults: rRes,
      listeningScore: ls, listeningTotalScore: lt, listeningResults: lRes,
      writingScore: ws, writingTotalScore: wt, writingResults: wRes,
      translationScore: ts2, translationTotalScore: tt, translationResults: tRes,
    })
  },

  clearExam(e: WechatMiniprogram.TouchEvent) {
    const setId = e.currentTarget.dataset.setId as string
    const set = this.data.examSets.find(s => s.id === setId)
    if (!set) return
    wx.showModal({
      title: '清除记录',
      content: `清空「${set.label}」的所有作答记录，确定吗？`,
      success: (res) => {
        if (!res.confirm) return
        const sd = getApp<IAppOption>().globalData.studyData
        const ra = sd.readingAnswers || {}
        const la = sd.listeningAnswers || {}
        for (const rid of set.readingIds) delete ra[rid]
        if (set.listeningId) delete la[set.listeningId]
        const sdAny = sd as any
        if (sdAny.writingAnswers) sdAny.writingAnswers = {}
        if (sdAny.translationAnswers) sdAny.translationAnswers = {}
        wx.setStorageSync('studyData', sd)
        this.setData({ _takenSets: { ...this.data._takenSets, [setId]: false }, phase: 'list' })
      },
    })
  },

  goBack() {
    if (timerInterval) clearInterval(timerInterval)
    const app = getApp<IAppOption>()
    app.globalData.examDeadline = 0
    this.setData({ phase: 'list', currentSet: null, _takenSets: this.computeTakenSets(this.data.examSets) })
  },
})

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}