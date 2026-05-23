import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import writingsData from '../../data/writings'
import translationsData from '../../data/translations'
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

interface IWritingItem {
  id: number
  title: string
  prompt: string
  reference: string
}

interface ITranslationItem {
  id: number
  chinese: string
  reference: string
  source: string
  keywords?: string[]
  acceptableAnswers?: string[]
}

interface IListeningQ {
  qi: number
  options: string[]
}

interface IExamSet {
  id: string
  label: string
  readingIds: number[]
  listeningId: number | null
  writingId?: number
  translationId?: number
}

interface IExamData {
  phase: 'list' | 'exam'
  examSets: IExamSet[]
  currentSet: IExamSet | null
  currentSection: 'dashboard' | 'writing' | 'listening' | 'reading' | 'translation'
  timerStr: string
  remainingSec: number
  readingDone: number
  readingTotal: number
  listeningDone: number
  listeningTotal: number
  darkMode: boolean
  writingPrompt: IWritingItem | null
  writingAnswer: string
  listeningPassage: IListeningPassage | null
  listeningQuestions: IListeningQ[]
  listeningSel: Record<number, number>
  isAudioPlaying: boolean
  readingPassages: any[]
  readingIdx: number
  activeBlank: string
  translationItem: ITranslationItem | null
  translationAnswer: string
}

interface IExamMethods {
  startExam(e: WechatMiniprogram.TouchEvent): void
  goBack(): void
  goDashboard(): void
  goWriting(): void
  goListening(): void
  goReading(): void
  goTranslation(): void
  submitExam(): void
  recalcProgress(): void
  startTimer(): void
  onWritingInput(e: WechatMiniprogram.Input): void
  saveWriting(): void
  onListeningSelect(e: WechatMiniprogram.TouchEvent): void
  toggleAudio(): void
  onReadingSelect(e: WechatMiniprogram.TouchEvent): void
  onReadingBlank(e: WechatMiniprogram.TouchEvent): void
  readingNext(): void
  readingPrev(): void
  onTranslationInput(e: WechatMiniprogram.Input): void
  saveTranslation(): void
}

const EXAM_DURATION = 7500
const TWO_HOURS_FIVE = '125:00'
const OPTS = ['A', 'B', 'C', 'D']
let timerInterval: any = null
let audioCtx: WechatMiniprogram.InnerAudioContext | null = null

Page<IExamData, IExamMethods>({
  data: {
    phase: 'list',
    examSets: [],
    currentSet: null,
    currentSection: 'dashboard',
    timerStr: TWO_HOURS_FIVE,
    remainingSec: EXAM_DURATION,
    readingDone: 0,
    readingTotal: 0,
    listeningDone: 0,
    listeningTotal: 0,
    darkMode: false,
    writingPrompt: null,
    writingAnswer: '',
    listeningPassage: null,
    listeningQuestions: [],
    listeningSel: {},
    isAudioPlaying: false,
    readingPassages: [],
    readingIdx: 0,
    activeBlank: '',
    translationItem: null,
    translationAnswer: '',
  },

  onLoad() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    const data = readingsData as IReadingPassage[]
    const sets: IExamSet[] = []
    const listeningIds = (listeningData as IListeningPassage[]).filter(l => l.audioUrl).map(l => l.id)
    const readingIds = data.map(r => r.id)
    const writings = writingsData as IWritingItem[]
    const translations = (translationsData as ITranslationItem[]).filter(t => t && t.chinese)
    if (readingIds.length > 0) sets.push({ id: '2019061', label: '2019年6月 第1套', readingIds: readingIds.slice(0, 4), listeningId: listeningIds[0] || null, writingId: writings[0]?.id, translationId: translations.find(t => t.source?.includes('真题'))?.id || translations[0]?.id })
    if (readingIds.length > 4) sets.push({ id: '2019062', label: '2019年6月 第2套', readingIds: readingIds.slice(4, 8), listeningId: listeningIds[1] || null, writingId: writings[1]?.id || writings[0]?.id, translationId: translations.filter(t => t.source?.includes('真题'))[1]?.id || translations[0]?.id })
    this.setData({ examSets: sets })
  },

  onShow() {
    this.setData({ darkMode: getDarkMode() })
    if (this.data.phase === 'exam' && this.data.currentSection === 'dashboard') {
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
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
  },

  startExam(e: WechatMiniprogram.TouchEvent) {
    const setId = e.currentTarget.dataset.setId as string
    const set = this.data.examSets.find(s => s.id === setId)
    if (!set) return
    wx.showModal({
      title: '开始考试',
      content: '125 分钟倒计时，各题型内直接作答。交卷后退出。',
      success: (res) => {
        if (!res.confirm) return
        const app = getApp<IAppOption>()
        app.globalData.examDeadline = Date.now() + EXAM_DURATION * 1000
        app.globalData.examSet = setId
        this.setData({ phase: 'exam', currentSet: set, currentSection: 'dashboard', remainingSec: EXAM_DURATION, timerStr: TWO_HOURS_FIVE })
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
        rt += Object.keys(passage.correctAnswers).length
        rd += ans ? Object.keys(ans.blankAnswers).length : 0
      } else if (passage.sectionType === 'B') {
        rt += passage.questions.length
        rd += ans ? Object.keys(ans.matchAnswers || {}).length : 0
      } else if (passage.sectionType === 'C') {
        rt += passage.questions.length
        rd += ans ? Object.keys(ans.cAnswers || {}).length : 0
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

  // ========== Navigation ==========

  goDashboard() {
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
    this.setData({ currentSection: 'dashboard', isAudioPlaying: false, activeBlank: '' })
    this.recalcProgress()
    if (timerInterval) clearInterval(timerInterval)
    this.startTimer()
  },

  goBack() {
    if (timerInterval) clearInterval(timerInterval)
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
    getApp<IAppOption>().globalData.examDeadline = 0
    this.setData({ phase: 'list', currentSet: null, currentSection: 'dashboard', isAudioPlaying: false })
  },

  goWriting() {
    const writings = writingsData as IWritingItem[]
    const prompt = this.data.currentSet?.writingId
      ? writings.find(w => w.id === this.data.currentSet!.writingId) || writings[0]
      : writings[0]
    this.setData({ currentSection: 'writing', writingPrompt: prompt, writingAnswer: '' })
  },

  goListening() {
    const lid = this.data.currentSet?.listeningId
    if (!lid) { wx.showToast({ title: '暂无听力题', icon: 'none' }); return }
    const passage = (listeningData as IListeningPassage[]).find(l => l.id === lid)
    if (!passage) return

    const questions: IListeningQ[] = []
    for (const s of passage.sentences) {
      const qm = s.text.match(/^Q(\d+)\.\s*/)
      if (!qm) continue
      const qi = parseInt(qm[1])
      const parts = s.text.split(/[A-D]\)\s*/).filter(Boolean)
      const options = parts.slice(1).map(p => p.replace(/\s+$/, ''))
      if (options.length === 4) questions.push({ qi, options })
    }

    const app = getApp<IAppOption>()
    const saved = app.globalData.studyData.listeningAnswers?.[lid] || {}
    this.setData({ currentSection: 'listening', listeningPassage: passage, listeningQuestions: questions, listeningSel: saved })
  },

  goReading() {
    const rData = readingsData as IReadingPassage[]
    const ids = this.data.currentSet?.readingIds || []
    const app = getApp<IAppOption>()
    const allLetters = 'ABCDEFGHIJKLMN'.split('')
    const passages = ids.map(id => {
      const p = rData.find(r => r.id === id)
      if (!p) return null
      const ans = app.globalData.studyData.readingAnswers[id] || {}
      if (p.sectionType === 'A') {
        const blankKeys = Object.keys(p.correctAnswers)
        const blankList = blankKeys.map(k => ({ key: k, selected: (ans.blankAnswers || {})[k] || '' }))
        const usedFlags = p.options.map((_, i) => !!((ans.blankAnswers || {})[blankKeys.find(k => (ans.blankAnswers || {})[k] === p.options[i]) || '']))
        return { ...p, _ans: ans, _blankList: blankList, _blankKeys: blankKeys, _usedFlags: usedFlags }
      }
      if (p.sectionType === 'B') {
        const matchList = p.questions.map((q, qi) => ({ stem: q, qi, letters: allLetters, selected: (ans.matchAnswers || {})[qi] || '' }))
        return { ...p, _ans: ans, _matchList: matchList }
      }
      if (p.sectionType === 'C') {
        const cqList = p.questions.map((q, qi) => ({
          stem: q, qi,
          choices: (p.choices && p.choices[qi]) ? [...p.choices[qi]] : ['A', 'B', 'C', 'D'],
          selected: (ans.cAnswers || {})[qi] || ''
        }))
        return { ...p, _ans: ans, _cqList: cqList }
      }
      return { ...p, _ans: ans }
    }).filter(Boolean) as any[]
    this.setData({ currentSection: 'reading', readingPassages: passages, readingIdx: 0, activeBlank: '' })
  },

  goTranslation() {
    const translations = translationsData as ITranslationItem[]
    const item = this.data.currentSet?.translationId
      ? translations.find(t => t.id === this.data.currentSet!.translationId) || translations[0]
      : translations[0]
    this.setData({ currentSection: 'translation', translationItem: item, translationAnswer: '' })
  },

  // ========== Writing ==========

  onWritingInput(e: WechatMiniprogram.Input) {
    this.setData({ writingAnswer: e.detail.value })
  },

  saveWriting() {
    if (!this.data.writingPrompt || !this.data.writingAnswer.trim()) {
      wx.showToast({ title: '请先写内容', icon: 'none' }); return
    }
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.writingRecords || []
    records.push({ id: this.data.writingPrompt.id, score: 0, date: new Date().toISOString() })
    app.globalData.studyData.writingRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    wx.showToast({ title: '已保存', icon: 'success' })
    this.goDashboard()
  },

  // ========== Listening ==========

  onListeningSelect(e: WechatMiniprogram.TouchEvent) {
    const qi = Number(e.currentTarget.dataset.qi)
    const oi = Number(e.currentTarget.dataset.oi)
    const sel = { ...this.data.listeningSel }
    if (sel[qi] === oi) delete sel[qi]
    else sel[qi] = oi
    this.setData({ listeningSel: sel })
    const pid = this.data.listeningPassage?.id
    if (pid) {
      const app = getApp<IAppOption>()
      if (!app.globalData.studyData.listeningAnswers) app.globalData.studyData.listeningAnswers = {}
      app.globalData.studyData.listeningAnswers[pid] = sel
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
  },

  toggleAudio() {
    const passage = this.data.listeningPassage
    if (!passage?.audioUrl) return
    if (audioCtx && this.data.isAudioPlaying) {
      audioCtx.pause()
      this.setData({ isAudioPlaying: false })
    } else if (audioCtx) {
      audioCtx.play()
      this.setData({ isAudioPlaying: true })
    } else {
      audioCtx = wx.createInnerAudioContext()
      audioCtx.src = passage.audioUrl
      audioCtx.onEnded(() => { this.setData({ isAudioPlaying: false }) })
      audioCtx.onError(() => { wx.showToast({ title: '音频加载失败', icon: 'none' }) })
      audioCtx.play()
      this.setData({ isAudioPlaying: true })
    }
  },

  // ========== Reading ==========

  onReadingSelect(e: WechatMiniprogram.TouchEvent) {
    const qi = Number(e.currentTarget.dataset.qi)
    const val = e.currentTarget.dataset.val as string
    const passages = [...this.data.readingPassages]
    const p = passages[this.data.readingIdx]
    if (!p) return
    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    if (p.sectionType === 'C') {
      const ca = { ...(ans.cAnswers || {}) }
      if (ca[qi] === val) delete ca[qi]
      else ca[qi] = val
      ans = { ...ans, cAnswers: ca }
      const cqList = p._cqList.map((cq: any) => ({ ...cq, selected: (ca || {})[cq.qi] || '' }))
      passages[this.data.readingIdx] = { ...p, _ans: ans, _cqList: cqList }
    } else if (p.sectionType === 'B') {
      const ma = { ...(ans.matchAnswers || {}) }
      if (ma[qi] === val) delete ma[qi]
      else ma[qi] = val
      ans = { ...ans, matchAnswers: ma }
      const matchList = p._matchList.map((m: any) => ({ ...m, selected: (ma || {})[m.qi] || '' }))
      passages[this.data.readingIdx] = { ...p, _ans: ans, _matchList: matchList }
    }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)
    this.setData({ readingPassages: passages })
  },

  onReadingBlank(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string
    const word = e.currentTarget.dataset.word as string
    const passages = [...this.data.readingPassages]
    const p = passages[this.data.readingIdx]
    if (!p || !key) return

    const app = getApp<IAppOption>()
    let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] }
    const ba = { ...ans.blankAnswers }
    const used = [...(ans.usedFlags || [])]
    const options = p.options || []

    if (ba[key] === word) {
      delete ba[key]
      const oi = options.indexOf(word)
      if (oi >= 0) used[oi] = false
    } else {
      const blankKeys = Object.keys(p.correctAnswers)
      if (ba[key]) {
        const prevOi = options.indexOf(ba[key])
        if (prevOi >= 0) used[prevOi] = false
      }
      ba[key] = word
      const oi = options.indexOf(word)
      if (oi >= 0) used[oi] = true
    }
    ans = { ...ans, blankAnswers: ba, usedFlags: used }
    app.globalData.studyData.readingAnswers[p.id] = ans
    wx.setStorageSync('studyData', app.globalData.studyData)

    const blankList = Object.keys(p.correctAnswers).map(k => ({ key: k, selected: ba[k] || '' }))
    passages[this.data.readingIdx] = { ...p, _ans: ans, _blankList: blankList, _usedFlags: used }

    this.setData({ readingPassages: passages, activeBlank: '' })
  },

  readingNext() {
    if (this.data.readingIdx < this.data.readingPassages.length - 1) {
      this.setData({ readingIdx: this.data.readingIdx + 1 })
    }
  },

  readingPrev() {
    if (this.data.readingIdx > 0) {
      this.setData({ readingIdx: this.data.readingIdx - 1 })
    }
  },

  // ========== Translation ==========

  onTranslationInput(e: WechatMiniprogram.Input) {
    this.setData({ translationAnswer: e.detail.value })
  },

  saveTranslation() {
    if (!this.data.translationItem || !this.data.translationAnswer.trim()) {
      wx.showToast({ title: '请先翻译', icon: 'none' }); return
    }
    const app = getApp<IAppOption>()
    const records = app.globalData.studyData.translationRecords || []
    records.push({ id: this.data.translationItem.id, userAnswer: this.data.translationAnswer, score: 0, date: new Date().toISOString() })
    app.globalData.studyData.translationRecords = records
    wx.setStorageSync('studyData', app.globalData.studyData)
    wx.showToast({ title: '已保存', icon: 'success' })
    this.goDashboard()
  },

  // ========== Submit ==========

  submitExam() {
    if (timerInterval) clearInterval(timerInterval)
    if (audioCtx) { audioCtx.stop(); audioCtx.destroy(); audioCtx = null }
    const app = getApp<IAppOption>()
    app.globalData.examDeadline = 0
    app.globalData.examSet = ''
    this.recalcProgress()
    wx.showToast({ title: '已交卷', icon: 'success' })
  },
})

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s < 10 ? '0' : ''}${s}`
}
