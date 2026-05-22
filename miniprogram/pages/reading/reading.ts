import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IReadingItem {
  id: number
  title: string
  sectionType: string
  passage: string
  questions: string[]
  options: string[]
  choices: string[][]
}

interface ISegment {
  type: 'text' | 'blank'
  text: string
  num?: string
}

interface IReadingData {
  readings: IReadingItem[]
  current: IReadingItem | null
  currentQ: number
  passagePage: number
  passagePages: string[]
  passageSeg: ISegment[][]
  formattedPages: string[]
  blankAnswers: Record<string, string>
  usedFlags: boolean[]
  activeBlank: string | null
  matchAnswers: Record<number, string>
  matchCount: number
  usedLetters: string[]
  availLetters: string[]
  activeStmt: number | null
  bStmtPage: number
  bStmtPages: string[][] // 5条一页
  darkMode: boolean
  optionLetters: string[]
  paraLetters: string[]
  touchStartX: number
}

interface IReadingMethods {
  select(e: WechatMiniprogram.TouchEvent): void
  back(): void
  prevQ(): void
  nextQ(): void
  prevPassage(): void
  nextPassage(): void
  prevStmts(): void
  nextStmts(): void
  splitPassage(text: string): string[]
  formatBPassage(text: string): string[]
  parseSegments(page: string): ISegment[]
  saveAnswers(): void
  onBlankTap(e: WechatMiniprogram.TouchEvent): void
  onOptionTap(e: WechatMiniprogram.TouchEvent): void
  selectStmt(e: WechatMiniprogram.TouchEvent): void
  removeMatch(e: WechatMiniprogram.TouchEvent): void
  assignLetter(e: WechatMiniprogram.TouchEvent): void
  saveMatchAnswers(): void
  updateUsedLetters(): void
  onTouchStart(e: WechatMiniprogram.TouchEvent): void
  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent): void
}

Page<IReadingData, IReadingMethods>({
  data: {
    readings: [],
    current: null,
    currentQ: 0,
    passagePage: 0,
    passagePages: [],
    passageSeg: [],
    formattedPages: [],
    blankAnswers: {},
    usedFlags: [],
    activeBlank: null,
    matchAnswers: {},
    matchCount: 0,
    usedLetters: [],
    availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
    activeStmt: null,
    bStmtPage: 0,
    bStmtPages: [],
    darkMode: false,
    optionLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'],
    paraLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
    touchStartX: 0,
  },

  onLoad() {
    this.setData({ readings: readingsData as IReadingItem[] })
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
  },

  formatBPassage(text: string): string[] {
    if (!text) return ['']
    // 按 A）B）C) 拆分，每个标签作为独立段落开头
    const parts = text.split(/(?=[A-Z][\)）])/g).filter(s => s.trim())
    // 每页3段，段间用双换行
    const pages: string[] = []
    for (let i = 0; i < parts.length; i += 3) {
      pages.push(parts.slice(i, i + 3).map(p => p.trim()).join('\n'))
    }
    return pages.length > 0 ? pages : [text]
  },

  select(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const item = this.data.readings.find(r => r.id === id)
    if (item) {
      const pages = item.sectionType === 'B'
        ? this.formatBPassage(item.passage)
        : this.splitPassage(item.passage)
      const segs = item.sectionType === 'A' ? pages.map(p => this.parseSegments(p)) : []
      const formatted = item.sectionType === 'B'
        ? pages.map(p => `<div style="line-height:1.9;margin:0 0 0.6em">${p.replace(/\n/g, '<br>')}</div>`)
        : pages.map(p => `<p style="margin:0 0 0.6em 0;line-height:1.9">${p}</p>`)
      // 从存储加载已有答案
      const app = getApp<IAppOption>()
      const saved = app.globalData.studyData.readingAnswers[item.id]
      const matchSaved = saved?.matchAnswers || {}
      const bPages: string[][] = []
      if (item.sectionType === 'B' && item.questions.length > 0) {
        for (let i = 0; i < item.questions.length; i += 5) {
          bPages.push(item.questions.slice(i, i + 5))
        }
      }
      this.setData({
        current: item, currentQ: 0, passagePage: 0, passagePages: pages,
        passageSeg: segs, formattedPages: formatted,
        blankAnswers: saved?.blankAnswers || {},
        usedFlags: saved?.usedFlags || [],
        matchAnswers: matchSaved,
        matchCount: Object.keys(matchSaved).length,
        usedLetters: [...new Set(Object.values(matchSaved))],
        availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].filter(l => !Object.values(matchSaved).includes(l)),
        bStmtPage: 0, bStmtPages: bPages,
        activeBlank: null, activeStmt: null,
      })
    }
  },

  back() {
    this.setData({ current: null, currentQ: 0, passagePage: 0, passagePages: [], passageSeg: [] })
  },

  splitPassage(text: string): string[] {
    if (!text) return ['']
    const clean = text.replace(/\s+/g, ' ').trim()
    const sentences = clean.split(/[.?!]\s*/).filter(s => s.trim().length > 5)
    const paras: string[] = []
    let currentPara = ''
    let count = 0
    const starters = ['however','but','while','in','the','although','according','as','despite','during','if','when','because','since','after','before','until','this','these','that','those','one','two','some','many','most','all','each','every','both','no','there','what','which','who','how','why','where']
    for (const s of sentences) {
      const first = s.trim().toLowerCase().split(/\s+/)[0] || ''
      const isNew = count > 0 && (starters.includes(first) || /^["""''']/.test(s.trim()))
      if (isNew || count >= 3) {
        if (currentPara) { paras.push(currentPara.trim() + '.'); currentPara = ''; count = 0 }
      }
      currentPara += (currentPara ? '. ' : '') + s.trim(); count++
    }
    if (currentPara) paras.push(currentPara.trim() + '.')
    const pages: string[] = []
    for (let i = 0; i < paras.length; i += 2) pages.push(paras.slice(i, i + 2).join('\n\n'))
    return pages.length > 0 ? pages : [text]
  },

  // 将文章拆分为文本段和空白段
  parseSegments(page: string): ISegment[] {
    const segs: ISegment[] = []
    const re = /\b(\d{2})\b/g
    let last = 0, m: RegExpExecArray | null
    while ((m = re.exec(page)) !== null) {
      if (m.index > last) segs.push({ type: 'text', text: page.slice(last, m.index) })
      segs.push({ type: 'blank', text: m[1], num: m[1] })
      last = re.lastIndex
    }
    if (last < page.length) segs.push({ type: 'text', text: page.slice(last) })
    return segs
  },

  // 点击空白：若有答案则清除，否则设为 active
  onBlankTap(e: WechatMiniprogram.TouchEvent) {
    const num = e.currentTarget.dataset.num as string
    const ba = { ...this.data.blankAnswers }
    if (ba[num]) {
      const word = ba[num]
      delete ba[num]
      const used = [...this.data.usedFlags]
      const idx = this.data.current!.options.indexOf(word)
      if (idx > -1) used[idx] = false
      this.setData({ blankAnswers: ba, usedFlags: used, activeBlank: null })
      this.saveAnswers()
    } else {
      this.setData({ activeBlank: this.data.activeBlank === num ? null : num })
    }
  },

  // 点击选项词：填入当前 active 的空白
  onOptionTap(e: WechatMiniprogram.TouchEvent) {
    const idx = e.currentTarget.dataset.idx as number
    const word = this.data.current!.options[idx]
    const active = this.data.activeBlank
    if (!active) {
      wx.showToast({ title: '请先点击文章中要填入的空白编号', icon: 'none' })
      return
    }
    const ba = { ...this.data.blankAnswers }
    const used = [...this.data.usedFlags]
    for (const k of Object.keys(ba)) {
      if (ba[k] === word) { delete ba[k]; break }
    }
    if (ba[active]) {
      const old = ba[active]
      const oi = this.data.current!.options.indexOf(old)
      if (oi > -1) used[oi] = false
    }
    ba[active] = word
    used[idx] = true
    this.setData({ blankAnswers: ba, usedFlags: used, activeBlank: null })
    this.saveAnswers()
    wx.showToast({ title: `已填入 ${word}`, icon: 'none' })
  },

  saveAnswers() {
    const id = this.data.current?.id
    if (!id) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.readingAnswers[id] || { matchAnswers: {} }
    app.globalData.studyData.readingAnswers[id] = {
      blankAnswers: { ...this.data.blankAnswers },
      usedFlags: [...this.data.usedFlags],
      matchAnswers: existing.matchAnswers || {},
    }
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  prevQ() {
    if (this.data.currentQ > 0) this.setData({ currentQ: this.data.currentQ - 1 })
  },
  nextQ() {
    const t = this.data.current?.questions?.length || 0
    if (this.data.currentQ < t - 1) this.setData({ currentQ: this.data.currentQ + 1 })
  },
  prevPassage() {
    if (this.data.passagePage > 0) this.setData({ passagePage: this.data.passagePage - 1 })
  },
  nextPassage() {
    if (this.data.passagePage < this.data.passagePages.length - 1) this.setData({ passagePage: this.data.passagePage + 1 })
  },
  prevStmts() {
    if (this.data.bStmtPage > 0) this.setData({ bStmtPage: this.data.bStmtPage - 1 })
  },
  nextStmts() {
    if (this.data.bStmtPage < this.data.bStmtPages.length - 1) this.setData({ bStmtPage: this.data.bStmtPage + 1 })
  },

  selectStmt(e: WechatMiniprogram.TouchEvent) {
    const sIdx = parseInt(e.currentTarget.dataset.idx as string)
    const newVal = this.data.activeStmt === sIdx ? null : sIdx
    this.setData({ activeStmt: newVal })
    if (newVal !== null) wx.showToast({ title: `已选第${newVal + 1}题，请选字母`, icon: 'none' })
  },

  updateUsedLetters() {
    const used = [...new Set(Object.values(this.data.matchAnswers))]
    this.setData({ usedLetters: used, matchCount: Object.keys(this.data.matchAnswers).length, availLetters: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'].filter(l => used.indexOf(l) === -1) })
  },

  removeMatch(e: WechatMiniprogram.TouchEvent) {
    const sIdx = parseInt(e.currentTarget.dataset.idx as string)
    const ma = { ...this.data.matchAnswers }
    delete ma[sIdx]
    this.setData({ matchAnswers: ma })
    this.updateUsedLetters()
    this.saveMatchAnswers()
  },

  assignLetter(e: WechatMiniprogram.TouchEvent) {
    const letter = e.currentTarget.dataset.letter as string
    const stmt = this.data.activeStmt
    if (stmt === null) return
    const ma = { ...this.data.matchAnswers }
    if (ma[stmt] === letter) {
      delete ma[stmt]
    } else {
      ma[stmt] = letter
    }
    this.setData({ matchAnswers: ma, activeStmt: null })
    this.updateUsedLetters()
    this.saveMatchAnswers()
    wx.showToast({ title: (ma[stmt] ? '已匹配 ' : '已取消 ') + letter, icon: 'none' })
  },

  saveMatchAnswers() {
    const id = this.data.current?.id
    if (!id) return
    const app = getApp<IAppOption>()
    const existing = app.globalData.studyData.readingAnswers[id] || { blankAnswers: {}, usedFlags: [] }
    existing.matchAnswers = { ...this.data.matchAnswers }
    app.globalData.studyData.readingAnswers[id] = existing
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  onTouchStart(e: WechatMiniprogram.TouchEvent) { this.setData({ touchStartX: e.touches[0].clientX }) },
  onPassageTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (dx > 50) this.prevPassage(); else if (dx < -50) this.nextPassage()
  },
  onQuestionTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.touchStartX
    if (this.data.current?.sectionType === 'B') {
      if (dx > 50) this.prevStmts()
      else if (dx < -50) this.nextStmts()
    } else {
      if (dx > 50) this.prevQ()
      else if (dx < -50) this.nextQ()
    }
  },
})
