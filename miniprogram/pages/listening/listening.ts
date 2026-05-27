import listeningData from '../../data/listening_generated'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

const API_BASE = (() => { try { return wx.getStorageSync('api_base') || 'http://localhost:3001' } catch(_) { return 'http://localhost:3001' } })()

interface ISentence {
  text: string
  start: number
  end: number
}

interface IListeningItem {
  id: number
  title: string
  audioUrl: string
  sentences: ISentence[]
  fullText: string
  correctAnswers?: Record<string, string>
}

interface IListeningPage {
  type: 'dir' | 'q'
  section: string
  stem?: string
  opts?: string[]
}

interface IQuestionResult {
  pi: number
  qNum: number
  stem: string
  userLetter: string
  userText: string
  correctLetter: string
  correctText: string
  isCorrect: boolean
  isAnswered: boolean
  hasAnswerKey: boolean
}

interface IListeningData {
  mode: 'list' | 'detail' | 'summary'
  passages: IListeningItem[]
  currentPassage: IListeningItem | null
  currentIndex: number
  isPlaying: boolean
  speed: number
  speedOptions: number[]
  showTranscript: boolean

  loopSentence: boolean
  hardSentences: number[]
  sentenceHardStatus: boolean[]
  completedPassages: number[]
  loading: boolean
  darkMode: boolean
  audioMode: boolean
  audioTime: number
  audioDuration: number
  audioTimeStr: string
  audioDurationStr: string
  pages: IListeningPage[]
  currentPage: number
  selectedAnswers: Record<number, number>
  pageTouchX: number
  optionLetters: string[]
  dataWarning: string
  focusMode: boolean
  examMode: boolean
  currentSectionLabel: string
  markedPages: number[]
  markedFlags: boolean[]
  isCurrentMarked: boolean
  summaryTotal: number
  summaryAnswered: number
  summaryMarked: number
  summaryResults: IQuestionResult[]
  summaryCorrectCount: number
  focusSentences: string[]
  focusSentenceMap: number[]
  focusPageIndices: number[]
  _retryCount?: number
}

interface IListeningMethods {
  enterDetail(e: WechatMiniprogram.TouchEvent): void
  backToList(): void
  playPause(): void
  playCurrent(): void
  playText(text: string, useAudioUrl?: string): void
  playSentence(e: WechatMiniprogram.TouchEvent): void
  prevSentence(): void
  nextSentence(): void
  setSpeed(e: WechatMiniprogram.TouchEvent): void
  toggleTranscript(): void

  toggleLoop(): void
  toggleHard(e: WechatMiniprogram.TouchEvent): void
  markCompleted(): void

  seekAudio(e: WechatMiniprogram.TouchEvent): void
  onPageTouchStart(e: WechatMiniprogram.TouchEvent): void
  onPageTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onOptionTap(e: WechatMiniprogram.TouchEvent): void
  prevPage(): void
  nextPage(): void
  rewindAudio(): void
  forwardAudio(): void
  markForReview(): void
  viewSummary(): void
  retryPages(): void
  toggleFocus(): void
  seekFocusCurrent(): void
}

const LABELS: Record<string, string> = {
  sectionA: 'Section A  News Reports',
  sectionB: 'Section B  Conversations',
  sectionC: 'Section C  Passages',
}

function sectionLabel(q: number): string {
  if (q >= 1 && q <= 7) return LABELS.sectionA
  if (q >= 8 && q <= 15) return LABELS.sectionB
  if (q >= 16 && q <= 25) return LABELS.sectionC
  return ''
}

function buildPages(passage: IListeningItem): IListeningPage[] {
  const pages: IListeningPage[] = []
  const lines = passage.sentences.map(s => s.text.trim()).filter(Boolean)

  const dirs: string[] = []
  let currentQ: { section: string; stem: string; opts: Array<{ l: string; t: string }> } | null = null
  let hasContent = false
  let skipTillQ1 = false

  function pushDir() {
    if (dirs.length > 0) {
      const txt = dirs.join(' ').replace(/\s+/g, ' ').trim()
      if (txt.length > 5) pages.push({ type: 'dir', section: 'Directions', stem: txt })
      dirs.length = 0
    }
  }

  function finalizeQ() {
    if (!currentQ) return
    pushDir()
    currentQ.opts.sort((a, b) => a.l.localeCompare(b.l))
    pages.push({
      type: 'q',
      section: currentQ.section,
      stem: currentQ.stem,
      opts: currentQ.opts.map(o => o.t),
    })
    currentQ = null
  }

  function addOpts(text: string) {
    if (!currentQ) return
    const parts = text.split(/(?=[A-D]\))/).filter(Boolean)
    for (const p of parts) {
      const m = p.match(/^([A-D])\)\s*(.*)/)
      if (m) {
        const existing = currentQ.opts.find(o => o.l === m![1])
        if (!existing) currentQ.opts.push({ l: m![1], t: m![2].trim() })
      }
    }
  }

  for (const line of lines) {
    if (/^\d{4}年\d+月/.test(line.trim()) && /第\d+页/.test(line)) continue

    if (/Part\s+(?:III|Three)\b/i.test(line) || /Reading\s+Comprehension\b/i.test(line)) {
      skipTillQ1 = true
      continue
    }

    const qMatch = line.match(/^(?:Q)?(\d+)\.\s*(.*)/)
    if (qMatch) {
      const qNum = parseInt(qMatch[1])
      if (skipTillQ1) {
        if (qNum === 1) skipTillQ1 = false
        else continue
      }
      finalizeQ()
      const rest = qMatch[2].trim()
      currentQ = { section: sectionLabel(qNum), stem: `Q${qNum}.`, opts: [] }
      hasContent = true
      addOpts(rest)
      continue
    }

    if (skipTillQ1) continue

    if (/^[A-D]\)/.test(line) && currentQ) {
      addOpts(line)
      continue
    }

    if (!hasContent) dirs.push(line)
    else if (line.length > 5) dirs.push(line)
  }

  finalizeQ()

  for (const p of pages) {
    if (p.type !== 'q' || !p.opts) continue
    p.opts = p.opts.filter(o => o.length > 0)
  }

  if (pages.every(p => p.type === 'dir')) return []
  return pages
}

// ===== AudioManager =====
class AudioManager {
  private ctx: WechatMiniprogram.InnerAudioContext | null
  private pageRef: any
  private customOnEnded: (() => void) | null

  constructor() {
    this.ctx = null
    this.pageRef = null
    this.customOnEnded = null
  }

  attach(page: any) {
    this.pageRef = page
  }

  detach() {
    this.pageRef = null
    this.customOnEnded = null
  }

  private getCtx(): WechatMiniprogram.InnerAudioContext {
    if (!this.ctx) {
      const ctx = wx.createInnerAudioContext()
      ctx.obeyMuteSwitch = false
      ctx.volume = 1
      ctx.autoplay = true

      ctx.onCanplay(() => {
        if (this.pageRef) {
          const d: any = { loading: false }
          if (ctx.duration > 0 && isFinite(ctx.duration)) {
            const m = Math.floor(ctx.duration / 60)
            const s = Math.floor(ctx.duration % 60)
            d.audioDuration = ctx.duration
            d.audioDurationStr = `${m}:${s < 10 ? '0' : ''}${s}`
          }
          this.pageRef.setData(d)
        }
      })

      ctx.onEnded(() => {
        if (this.customOnEnded) {
          this.customOnEnded()
        } else if (this.pageRef) {
          const d = this.pageRef.data
          if (!d.isPlaying) return
          if (d.audioMode) {
            if (d.loopSentence && this.ctx) {
              this.ctx.seek(0)
              this.ctx.play()
              this.pageRef.setData({ isPlaying: true })
            } else {
              this.pageRef.setData({ isPlaying: false })
            }
          } else if (d.loopSentence) {
            this.pageRef.playCurrent()
          } else if (d.currentIndex < d.currentPassage.sentences.length - 1) {
            this.pageRef.nextSentence()
          } else {
            this.pageRef.setData({ isPlaying: false })
          }
        }
      })

      ctx.onTimeUpdate(() => {
        if (this.pageRef && this.pageRef.data.audioMode && this.ctx) {
          const d = this.pageRef.data
          const t = ctx.currentTime
          const dur = ctx.duration
          if (!isFinite(t) || !isFinite(dur)) return
          const fmt = (v: number) => {
            const m = Math.floor(v / 60)
            const s = Math.floor(v % 60)
            return `${m}:${s < 10 ? '0' : ''}${s}`
          }
          this.pageRef.setData({
            audioTime: t,
            audioDuration: dur,
            audioTimeStr: fmt(t),
            audioDurationStr: fmt(dur),
          })
          if (d.focusMode && d.loopSentence) {
            const origIdx = d.focusSentenceMap[d.currentIndex] != null ? d.focusSentenceMap[d.currentIndex] : 0
            const sent = d.currentPassage && d.currentPassage.sentences[origIdx]
            if (sent && sent.end > 0 && ctx.currentTime >= sent.end) {
              ctx.seek(sent.start || 0)
            }
          }
        }
      })

      ctx.onError((res) => {
        const code = (res as any).errCode
        if (this.pageRef) {
          const d = this.pageRef.data
          const rt = d._retryCount || 0
          if (rt < 3) {
            this.pageRef.setData({ _retryCount: rt + 1, loading: true })
            setTimeout(() => { if (this.ctx && this.ctx.src) { this.ctx.play() } }, (rt + 1) * 5000)
            return
          }
        }
        wx.showToast({ title: `播放失败${code ? '(' + code + ')' : ''}`, icon: 'none' })
        if (this.pageRef) this.pageRef.setData({ isPlaying: false, loading: false })
      })

      ctx.onPlay(() => {
        if (this.pageRef) this.pageRef.setData({ loading: false })
      })

      this.ctx = ctx
    }
    return this.ctx
  }

  setOnEnded(handler: (() => void) | null) {
    this.customOnEnded = handler
  }

  play(src: string, rate: number = 1) {
    const ctx = this.getCtx()
    ctx.stop()
    ctx.src = src
    ctx.playbackRate = rate
    ctx.play()
    if (this.pageRef) this.pageRef.setData({ _retryCount: 0 })
  }

  resume(rate: number = 1) {
    if (!this.ctx) return
    this.ctx.playbackRate = rate
    this.ctx.play()
  }

  pause() {
    if (this.ctx) this.ctx.pause()
  }

  stop() {
    if (this.ctx) this.ctx.stop()
  }

  seek(time: number) {
    if (this.ctx) this.ctx.seek(time)
  }

  setRate(rate: number) {
    if (this.ctx) this.ctx.playbackRate = rate
  }

  getCurrentTime(): number {
    return this.ctx && this.ctx.currentTime != null ? this.ctx.currentTime : 0
  }

  getDuration(): number {
    return this.ctx && this.ctx.duration != null ? this.ctx.duration : 0
  }

  hasSource(): boolean {
    return !!(this.ctx && this.ctx.src)
  }

  destroy() {
    if (this.ctx) {
      this.ctx.destroy()
      this.ctx = null
    }
    this.detach()
  }
}

const audio = new AudioManager()

// ===== Page =====
Page<IListeningData, IListeningMethods>({
  data: {
    mode: 'list',
    passages: [],
    currentPassage: null,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    speedOptions: [0.6, 0.8, 1, 1.15, 1.3],
    showTranscript: true,
    loopSentence: false,
    hardSentences: [],
    sentenceHardStatus: [],
    completedPassages: [],
    loading: false,
    darkMode: false,
    audioMode: false,
    audioTime: 0,
    audioDuration: 0,
    audioTimeStr: '0:00',
    audioDurationStr: '0:00',
    pages: [],
    currentPage: 0,
    selectedAnswers: {},
    pageTouchX: 0,
    optionLetters: ['A', 'B', 'C', 'D'],
    dataWarning: '',
    focusMode: false,
    currentSectionLabel: '',
    markedPages: [],
    markedFlags: [],
    isCurrentMarked: false,
    examMode: false,
    summaryTotal: 0,
    summaryAnswered: 0,
    summaryMarked: 0,
    summaryResults: [],
    summaryCorrectCount: 0,
    focusSentences: [],
    focusSentenceMap: [],
    focusPageIndices: [],
  },

  onLoad(options: { passageId?: string; examMode?: string }) {
    if (options && options.examMode === '1') this.setData({ examMode: true })
    audio.attach(this)
    const passages = listeningData as IListeningItem[]
    const app = getApp<IAppOption>()
    const studyData = app.globalData.studyData
    this.setData({
      passages,
      darkMode: app.globalData.darkMode,
      completedPassages: studyData.completedListens,
    })
    if (options.passageId) {
      const passage = passages.find(p => p.id === Number(options.passageId))
      if (passage) {
        this.enterDetail({ currentTarget: { dataset: { id: passage.id } } } as unknown as WechatMiniprogram.TouchEvent)
      }
    }
  },

  onShow() {
    audio.attach(this)
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onHide() {
    audio.pause()
    this.setData({ isPlaying: false })
  },

  onUnload() {
    audio.destroy()
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    audio.attach(this)
    const id = Number(e.currentTarget.dataset.id)
    const passage = this.data.passages.find(p => p.id === id)
    if (!passage) return

    const app = getApp<IAppOption>()
    const stored = app.globalData.studyData.hardSentences || []
    const localHard = stored.filter(h => h.passageId === passage.id).map(h => h.sentenceIndex)
    const isAudio = !!passage.audioUrl

    if (isAudio) {
      const audioUrl = passage.audioUrl!.startsWith('http')
        ? passage.audioUrl!
        : `${API_BASE}${encodeURI(passage.audioUrl!)}`
      audio.stop()
      audio.play(audioUrl)

      const saved = app.globalData.studyData.listeningAnswers && app.globalData.studyData.listeningAnswers[passage.id] || {}
      const pages = buildPages(passage)

      let warns: string[] = []
      for (const p of pages) {
        if (p.type !== 'q') continue
        const n = p.opts && p.opts.length || 0
        if (n < 4) warns.push(`${p.stem}缺${4 - n}个选项`)
      }

      const fm = this.data.focusMode
      const sentenceHardStatus = passage.sentences.map((_, i) => localHard.indexOf(i) !== -1)
      this.setData({
        mode: 'detail',
        currentPassage: passage,
        currentIndex: 0,
        isPlaying: true,
        hardSentences: localHard,
        sentenceHardStatus,
        audioMode: true,
        audioTime: 0,
        audioDuration: 0,
        pages,
        currentPage: 0,
        selectedAnswers: saved,
        dataWarning: warns.length > 0 ? '⚠️ ' + warns.join('；') + '（PDF 提取缺陷，可手动编辑 listening_generated.ts）' : '',
        currentSectionLabel: pages.length > 0 && pages[0].type === 'q' ? pages[0].section : '',
        markedPages: [],
        markedFlags: new Array(pages.length).fill(false),
        loopSentence: fm,
        speed: fm ? 0.8 : 1,
        _retryCount: 0,
      })
      audio.setRate(fm ? 0.8 : 1)
    } else {
      const sentenceHardStatus = passage.sentences.map((_, i) => localHard.indexOf(i) !== -1)
      this.setData({
        mode: 'detail',
        currentPassage: passage,
        currentIndex: 0,
        isPlaying: false,
        hardSentences: localHard,
        sentenceHardStatus,
        audioMode: false,
        audioTime: 0,
        audioDuration: 0,
        pages: [],
        currentPage: 0,
        selectedAnswers: {},
      })
    }
  },

  backToList() {
    if (this.data.examMode) { wx.navigateBack(); return }
    audio.stop()
    this.setData({
      mode: 'list',
      currentPassage: null,
      isPlaying: false,
      audioMode: false,
      pages: [],
      currentPage: 0,
      dataWarning: '',
      focusMode: false,
      loopSentence: false,
      speed: 1,
    })
  },

  // ===== Page navigation (audio mode) =====
  onPageTouchStart(e: WechatMiniprogram.TouchEvent) {
    this.setData({ pageTouchX: e.touches[0].clientX })
  },

  onPageTouchEnd(e: WechatMiniprogram.TouchEvent) {
    const dx = e.changedTouches[0].clientX - this.data.pageTouchX
    if (dx > 50) this.prevPage()
    else if (dx < -50) this.nextPage()
  },

  onOptionTap(e: WechatMiniprogram.TouchEvent) {
    const i = parseInt(e.currentTarget.dataset.i as string)
    const oi = parseInt(e.currentTarget.dataset.oi as string)
    const sa: Record<number, number> = { ...this.data.selectedAnswers }
    if (sa[i] === oi) delete sa[i]
    else sa[i] = oi
    this.setData({ selectedAnswers: sa })

    const app = getApp<IAppOption>()
    const pid = this.data.currentPassage && this.data.currentPassage.id
    if (pid) {
      if (!app.globalData.studyData.listeningAnswers) app.globalData.studyData.listeningAnswers = {}
      app.globalData.studyData.listeningAnswers[pid] = sa
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
  },

  prevPage() {
    if (this.data.currentPage > 0) {
      const cp = this.data.currentPage - 1
      const p = this.data.pages[cp]
      const wasPlaying = this.data.isPlaying
      if (this.data.focusMode && wasPlaying) {
        audio.pause()
      }
      this.setData({
        currentPage: cp,
        currentSectionLabel: p && p.section || '',
        isCurrentMarked: this.data.markedFlags[cp] || false,
        isPlaying: this.data.focusMode ? false : wasPlaying,
      })
    }
  },

  nextPage() {
    const lastIdx = this.data.pages.length - 1
    if (this.data.currentPage < lastIdx) {
      const cp = this.data.currentPage + 1
      const p = this.data.pages[cp]
      const wasPlaying = this.data.isPlaying
      if (this.data.focusMode && wasPlaying) {
        audio.pause()
      }
      this.setData({
        currentPage: cp,
        currentSectionLabel: p && p.section || '',
        isCurrentMarked: this.data.markedFlags[cp] || false,
        isPlaying: this.data.focusMode ? false : wasPlaying,
      })
    } else if (this.data.currentPage >= lastIdx && this.data.audioMode) {
      this.viewSummary()
    }
  },

  viewSummary() {
    audio.pause()
    const qPages = this.data.pages.filter(p => p.type === 'q')
    const total = qPages.length
    const answered = Object.keys(this.data.selectedAnswers).length
    const marked = this.data.markedPages.length
    const ca = this.data.currentPassage && this.data.currentPassage.correctAnswers || {}
    const optionLetters = this.data.optionLetters
    let correctCount = 0
    const results: IQuestionResult[] = this.data.pages.map((p, pi) => {
      if (p.type !== 'q') return null
      const qNum = parseInt((p.stem || '').replace(/^Q/i, ''))
      const correctLetter = ca[String(qNum)] || ''
      const userOptionIdx = this.data.selectedAnswers[pi]
      const isAnswered = userOptionIdx != null
      const userLetter = isAnswered ? (optionLetters[userOptionIdx] || '') : ''
      const userText = isAnswered && p.opts ? (p.opts[userOptionIdx] || '') : ''
      const letterMap = { A: 0, B: 1, C: 2, D: 3 } as Record<string, number>
      const correctIdx = correctLetter ? (letterMap[correctLetter] !== undefined ? letterMap[correctLetter] : -1) : -1
      const correctText = correctIdx >= 0 && p.opts ? (p.opts[correctIdx] || '') : ''
      const isCorrect = correctLetter && isAnswered ? userLetter === correctLetter : false
      if (isCorrect) correctCount++
      return { pi, qNum, stem: p.stem || '', userLetter, userText, correctLetter, correctText, isCorrect, isAnswered, hasAnswerKey: !!correctLetter }
    }).filter(Boolean) as IQuestionResult[]
    this.setData({ mode: 'summary', isPlaying: false, summaryTotal: total, summaryAnswered: answered, summaryMarked: marked, summaryResults: results, summaryCorrectCount: correctCount })
  },

  retryPages() {
    this.setData({ mode: 'detail', currentPage: 0 })
  },

  toggleFocus() {
    const on = !this.data.focusMode
    if (on) {
      audio.pause()
      this.setData({ isPlaying: false })
      const passage = this.data.currentPassage
      const lines: string[] = []
      const pageIdx: number[] = []
      const sentMap: number[] = []
      const pages = this.data.pages
      for (let i = 0; i < pages.length; i++) {
        const p = pages[i]
        if (p.type === 'dir') {
          const short = p.stem && p.stem.length > 60 ? p.stem.slice(0, 60) + '...' : (p.stem || '')
          if (short) { lines.push(short); pageIdx.push(i); sentMap.push(0) }
        } else if (p.type === 'q' && p.opts && p.opts.length > 0) {
          const parts = [p.stem || '']
          for (let oi = 0; oi < p.opts.length; oi++) {
            parts.push(['A', 'B', 'C', 'D'][oi] + ') ' + p.opts[oi])
          }
          lines.push(parts.join('\n'))
          pageIdx.push(i)
          const qNum = parseInt((p.stem || '').replace(/^Q/i, ''))
          const sentIdx = passage ? passage.sentences.findIndex(s => {
            const m = s.text.match(/^(?:Q)?(\d+)\./)
            return m && parseInt(m[1]) === qNum
          }) : -1
          sentMap.push(sentIdx >= 0 ? sentIdx : 0)
        }
      }
      this.setData({
        focusMode: true,
        loopSentence: true,
        speed: 0.8,
        isPlaying: false,
        showTranscript: true,
        focusSentences: lines,
        focusSentenceMap: sentMap,
        focusPageIndices: pageIdx,
        currentIndex: 0,
        currentPage: 0,
      })
      audio.setRate(0.8)
    } else {
      audio.pause()
      audio.setRate(1)
      audio.seek(0)
      this.setData({
        focusMode: false,
        loopSentence: false,
        speed: 1,
        isPlaying: false,
        focusSentences: [],
        focusSentenceMap: [],
        focusPageIndices: [],
        currentIndex: 0,
        currentPage: 0,
        audioTime: 0,
        audioTimeStr: '0:00',
      })
    }
  },

  rewindAudio() {
    audio.seek(Math.max(0, audio.getCurrentTime() - 15))
  },

  forwardAudio() {
    audio.seek(Math.min(audio.getDuration(), audio.getCurrentTime() + 15))
  },

  markForReview() {
    const cp = this.data.currentPage
    const m = [...this.data.markedPages]
    const flags = [...this.data.markedFlags]
    const idx = m.indexOf(cp)
    if (idx >= 0) {
      m.splice(idx, 1)
      flags[cp] = false
      wx.showToast({ title: '已取消标记', icon: 'none' })
    } else {
      m.push(cp)
      flags[cp] = true
      wx.showToast({ title: '已标记需重听', icon: 'none' })
    }
    this.setData({ markedPages: m, markedFlags: flags, isCurrentMarked: flags[cp] })
  },

  // ===== Audio controls =====
  playCurrent() {
    if (this.data.focusMode) {
      this.seekFocusCurrent()
      return
    }
    const passage = this.data.currentPassage
    if (!passage) return
    const sentence = passage.sentences[this.data.currentIndex]
    if (!sentence) return
    this.playText(sentence.text)
  },

  playText(text: string, useAudioUrl?: string) {
    let src: string
    if (useAudioUrl) {
      src = useAudioUrl.startsWith('http') ? useAudioUrl : `${API_BASE}${encodeURI(useAudioUrl)}`
    } else {
      src = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=en`
    }
    audio.play(src, this.data.speed)
    this.setData({ isPlaying: true, loading: true })
  },

  seekAudio(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.audioMode) return
    const x = (e as any).detail.x
    if (x == null) return
    const query = wx.createSelectorQuery().in(this)
    query.select('.seek-track').boundingClientRect((rect: any) => {
      if (!rect || !rect.width) return
      const ratio = Math.max(0, Math.min(1, (x - rect.left) / rect.width))
      audio.seek(ratio * (this.data.audioDuration || 0))
    }).exec()
  },

  playPause() {
    if (this.data.focusMode) {
      if (this.data.isPlaying) {
        audio.pause()
        this.setData({ isPlaying: false })
      } else {
        this.playCurrent()
      }
      return
    }
    if (this.data.audioMode) {
      if (this.data.isPlaying) {
        audio.pause()
        this.setData({ isPlaying: false })
      } else {
        audio.resume(this.data.speed)
        this.setData({ isPlaying: true })
      }
    } else if (this.data.isPlaying) {
      audio.pause()
      this.setData({ isPlaying: false })
    } else {
      if (audio.hasSource()) {
        audio.resume(this.data.speed)
        this.setData({ isPlaying: true })
      } else {
        const passage = this.data.currentPassage
        if (!passage) return
        if (passage.audioUrl) this.playText('', passage.audioUrl)
        else this.playCurrent()
      }
    }
  },

  playSentence(e: WechatMiniprogram.TouchEvent) {
    const rawIndex = Number(e.currentTarget.dataset.index)
    const origIndex = this.data.focusMode
      ? (this.data.focusSentenceMap[rawIndex] != null ? this.data.focusSentenceMap[rawIndex] : rawIndex)
      : rawIndex
    this.setData({ currentIndex: rawIndex })
    if (this.data.focusMode) {
      const passage = this.data.currentPassage
      if (passage && passage.audioUrl) {
        const sent = passage.sentences[origIndex]
        if (sent && sent.start >= 0) {
          audio.seek(sent.start)
          if (!this.data.isPlaying) {
            audio.resume(this.data.speed)
            this.setData({ isPlaying: true })
          }
        } else {
          const text = this.data.focusSentences[rawIndex]
          if (text) this.playText(text)
        }
        return
      }
      const text = this.data.focusSentences[rawIndex]
      if (text) this.playText(text)
    } else {
      const passage = this.data.currentPassage
      if (passage) {
        if (passage.audioUrl) this.playText('', passage.audioUrl)
        else this.playText(passage.sentences[origIndex].text)
      }
    }
  },

  prevSentence() {
    if (this.data.focusMode) {
      if (this.data.currentIndex > 0) {
        this.setData({ currentIndex: this.data.currentIndex - 1 })
        this.seekFocusCurrent()
      }
    } else if (this.data.audioMode) {
      audio.seek(Math.max(0, audio.getCurrentTime() - 15))
    } else if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
      this.playCurrent()
    }
  },

  nextSentence() {
    if (this.data.focusMode) {
      if (this.data.currentIndex < this.data.focusSentences.length - 1) {
        this.setData({ currentIndex: this.data.currentIndex + 1 })
        this.seekFocusCurrent()
      }
    } else if (this.data.audioMode) {
      audio.seek(Math.min(audio.getDuration(), audio.getCurrentTime() + 15))
    } else {
      const passage = this.data.currentPassage
      if (!passage) return
      if (this.data.currentIndex < passage.sentences.length - 1) {
        this.setData({ currentIndex: this.data.currentIndex + 1 })
        this.playCurrent()
      }
    }
  },

  seekFocusCurrent() {
    const origIndex = this.data.focusSentenceMap[this.data.currentIndex] != null ? this.data.focusSentenceMap[this.data.currentIndex] : 0
    const sent = this.data.currentPassage && this.data.currentPassage.sentences[origIndex]
    if (sent) {
      audio.seek(sent.start || 0)
    }
    if (!this.data.isPlaying) {
      audio.resume(this.data.speed)
      this.setData({ isPlaying: true })
    }
  },

  setSpeed(e: WechatMiniprogram.TouchEvent) {
    const speed = parseFloat(e.currentTarget.dataset.speed as string)
    this.setData({ speed })
    audio.setRate(speed)
  },

  toggleTranscript() { this.setData({ showTranscript: !this.data.showTranscript }) },

  toggleLoop() { this.setData({ loopSentence: !this.data.loopSentence }) },

  toggleHard(e: WechatMiniprogram.TouchEvent) {
    const rawIndex = Number(e.currentTarget.dataset.index)
    const passage = this.data.currentPassage
    if (!passage) return
    const origIndex = this.data.focusMode
      ? (this.data.focusSentenceMap[rawIndex] != null ? this.data.focusSentenceMap[rawIndex] : rawIndex)
      : rawIndex
    const app = getApp<IAppOption>()
    const stored = app.globalData.studyData.hardSentences
    const hardSet = new Set(this.data.hardSentences)
    if (hardSet.has(origIndex)) {
      hardSet.delete(origIndex)
      const idx = stored.findIndex(h => h.passageId === passage.id && h.sentenceIndex === origIndex)
      if (idx !== -1) stored.splice(idx, 1)
      wx.showToast({ title: '已取消难句', icon: 'none' })
    } else {
      hardSet.add(origIndex)
      stored.push({ passageId: passage.id, sentenceIndex: origIndex, text: passage.sentences[origIndex].text, passageTitle: passage.title })
      wx.showToast({ title: '已标记难句', icon: 'none' })
    }
    const finalHard = [...hardSet]
    const sentenceHardStatus = passage.sentences.map((_, i) => finalHard.indexOf(i) !== -1)
    this.setData({ hardSentences: finalHard, sentenceHardStatus })
    wx.setStorageSync('studyData', app.globalData.studyData)
  },

  markCompleted() {
    const passage = this.data.currentPassage
    if (!passage) return
    const completedSet = new Set(this.data.completedPassages)
    completedSet.add(passage.id)
    const completed = [...completedSet]
    this.setData({ completedPassages: completed })
    const app = getApp<IAppOption>()
    app.globalData.studyData.completedListens = completed
    wx.setStorageSync('studyData', app.globalData.studyData)
    doCheckIn('listen')
    wx.showToast({ title: '已标记完成', icon: 'success' })
  },

  onShareAppMessage() {
    return {
      title: '🎵 听力精听 — 我在四级备考助手练习听力！',
      path: '/pages/listening/listening',
    }
  },

})
