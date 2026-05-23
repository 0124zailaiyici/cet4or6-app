import listeningData from '../../data/listening'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

const API_BASE = 'http://localhost:3001'

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
}

interface IListeningPage {
  type: 'dir' | 'q'
  section: string
  stem?: string
  opts?: string[]
}

interface IListeningData {
  mode: 'list' | 'detail'
  passages: IListeningItem[]
  currentPassage: IListeningItem | null
  currentIndex: number
  isPlaying: boolean
  speed: number
  speedOptions: number[]
  showTranscript: boolean
  dictationMode: boolean
  loopSentence: boolean
  hardSentences: number[]
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
  currentSectionLabel: string
  markedPages: number[]
  markedFlags: boolean[]
  isCurrentMarked: boolean
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
  toggleDictation(): void
  toggleLoop(): void
  toggleHard(e: WechatMiniprogram.TouchEvent): void
  markCompleted(): void
  getBlankText(text: string): string
  seekAudio(e: WechatMiniprogram.TouchEvent): void
  onPageTouchStart(e: WechatMiniprogram.TouchEvent): void
  onPageTouchEnd(e: WechatMiniprogram.TouchEvent): void
  onOptionTap(e: WechatMiniprogram.TouchEvent): void
  prevPage(): void
  nextPage(): void
  toggleFocus(): void
  rewindAudio(): void
  forwardAudio(): void
  markForReview(): void
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
  let currentQ: { section: string; stem: string; opts: Array<{l: string; t: string}> } | null = null
  let hasContent = false

  function pushDir() {
    if (dirs.length > 0) {
      const txt = dirs.join(' ').replace(/\s+/g, ' ').trim()
      if (txt.length > 5) pages.push({ type: 'dir', section: 'Directions', stem: txt })
      dirs.length = 0
    }
  }

  function addOpts(text: string) {
    if (!currentQ) return
    const parts = text.split(/(?=[A-D]\))/).filter(Boolean)
    for (const p of parts) {
      const m = p.match(/^([A-D])\)\s*(.*)/)
      if (m) currentQ.opts.push({ l: m[1], t: m[2].trim() })
    }
  }

  for (const line of lines) {
    if (/\d{4}年\d+月/.test(line) && /第\d+页/.test(line)) continue

    const qMatch = line.match(/^(?:Q)?(\d+)\.\s*(.*)/)
    if (qMatch) {
      if (currentQ) {
        pushDir()
        pages.push({ type: 'q', ...currentQ, opts: currentQ.opts.map(o => o.t) })
      }
      const qNum = parseInt(qMatch[1])
      const rest = qMatch[2].trim()
      currentQ = { section: sectionLabel(qNum), stem: `Q${qNum}.`, opts: [] }
      hasContent = true
      addOpts(rest)
      continue
    }

    if (/^[A-D]\)/.test(line) && currentQ) {
      addOpts(line)
      continue
    }

    if (!hasContent) dirs.push(line)
    else if (line.length > 5) dirs.push(line)
  }

  if (currentQ) {
    pushDir()
    pages.push({ type: 'q', ...currentQ, opts: currentQ.opts.map(o => o.t) })
  }

  // 每题直接使用导入的原始选项（导入已做了去重）
  for (const p of pages) {
    if (p.type !== 'q' || !p.opts) continue
    // 只保留非空选项
    p.opts = p.opts.filter(o => o.length > 0)
  }

  if (pages.every(p => p.type === 'dir')) return []

  // Add section dir pages at natural boundaries
  return pages
}

let audioCtx: WechatMiniprogram.InnerAudioContext | null = null
let pageRef: any = null

function getAudioCtx(): WechatMiniprogram.InnerAudioContext {
  if (!audioCtx) {
    audioCtx = wx.createInnerAudioContext()
    audioCtx.obeyMuteSwitch = false
    audioCtx.volume = 1
    audioCtx.autoplay = true
    audioCtx.onCanplay(() => {
      if (pageRef) pageRef.setData({ loading: false })
    })
    audioCtx.onEnded(() => {
      if (!pageRef) return
      if (pageRef.data.audioMode) {
        if (pageRef.data.loopSentence) {
          audioCtx!.seek(0)
          audioCtx!.play()
        } else {
          pageRef.setData({ isPlaying: false })
        }
      } else if (pageRef.data.loopSentence) {
        pageRef.playCurrent()
      } else if (pageRef.data.currentIndex < pageRef.data.currentPassage.sentences.length - 1) {
        pageRef.nextSentence()
      } else {
        pageRef.setData({ isPlaying: false })
      }
    })
    audioCtx.onTimeUpdate(() => {
      if (pageRef && pageRef.data.audioMode && audioCtx) {
        const fmt = (t: number) => {
          const m = Math.floor(t / 60)
          const s = Math.floor(t % 60)
          return `${m}:${s < 10 ? '0' : ''}${s}`
        }
        pageRef.setData({
          audioTime: audioCtx.currentTime,
          audioDuration: audioCtx.duration,
          audioTimeStr: fmt(audioCtx.currentTime),
          audioDurationStr: fmt(audioCtx.duration),
        })
      }
    })
    audioCtx.onError((res) => {
      const code = (res as any).errCode
      wx.showToast({ title: `播放失败${code ? '(' + code + ')' : ''}`, icon: 'none' })
      if (pageRef) pageRef.setData({ isPlaying: false, loading: false })
    })
  }
  return audioCtx
}

Page<IListeningData, IListeningMethods>({
  data: {
    mode: 'list',
    passages: [],
    currentPassage: null,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    speedOptions: [0.5, 0.75, 1, 1.25, 1.5],
    showTranscript: true,
    dictationMode: false,
    loopSentence: false,
    hardSentences: [],
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
    optionLetters: ['A','B','C','D'],
    dataWarning: '',
    focusMode: true,
    currentSectionLabel: '',
    markedPages: [],
    markedFlags: [],
    isCurrentMarked: false,
  },

  onLoad(options: { passageId?: string }) {
    pageRef = this
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
        this.enterDetail({ currentTarget: { dataset: { id: passage.id } } } as WechatMiniprogram.TouchEvent)
      }
    }
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onUnload() {
    pageRef = null
    if (audioCtx) { audioCtx.destroy(); audioCtx = null }
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const passage = this.data.passages.find(p => p.id === id)
    if (passage) {
      const app = getApp<IAppOption>()
      const stored = app.globalData.studyData.hardSentences || []
      const localHard = stored.filter(h => h.passageId === passage.id).map(h => h.sentenceIndex)
      const isAudio = !!passage.audioUrl
      if (isAudio) {
        const ctx = getAudioCtx()
        ctx.stop()
        ctx.playbackRate = this.data.speed
        ctx.src = passage.audioUrl!.startsWith('http')
          ? passage.audioUrl!
          : `${API_BASE}${encodeURI(passage.audioUrl!)}`
        const saved = app.globalData.studyData.listeningAnswers?.[passage.id] || {}
        const pages = buildPages(passage)
        // 检查数据完整性
        let warns: string[] = []
        for (const p of pages) {
          if (p.type !== 'q') continue
          const n = p.opts?.length || 0
          if (n < 4) warns.push(`${p.stem}缺${4-n}个选项`)
        }
        // 精听模式默认开循环、慢速0.75
        this.setData({
          mode: 'detail', currentPassage: passage, currentIndex: 0, isPlaying: true,
          hardSentences: localHard, audioMode: true, audioTime: 0, audioDuration: 0,
          pages, currentPage: 0, selectedAnswers: saved,
          dataWarning: warns.length > 0 ? '⚠️ ' + warns.join('；') : '',
          focusMode: true,
          currentSectionLabel: pages.length > 0 && pages[0].type === 'q' ? pages[0].section : '',
          markedPages: [],
          markedFlags: new Array(pages.length).fill(false),
          loopSentence: true,
          speed: 0.75,
        })
        if (audioCtx) audioCtx.playbackRate = 0.75
      } else {
        this.setData({
          mode: 'detail', currentPassage: passage, currentIndex: 0, isPlaying: false,
          hardSentences: localHard, audioMode: false, audioTime: 0, audioDuration: 0,
          pages: [], currentPage: 0, selectedAnswers: {},
        })
      }
    }
  },

  backToList() {
    if (audioCtx) { audioCtx.destroy(); audioCtx = null }
    this.setData({ mode: 'list', currentPassage: null, isPlaying: false, audioMode: false, pages: [], currentPage: 0, dataWarning: '' })
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
    const i = e.currentTarget.dataset.i as number  // page index
    const oi = e.currentTarget.dataset.oi as number  // option index
    const sa = { ...this.data.selectedAnswers }
    if (sa[i] === oi) delete sa[i]
    else sa[i] = oi
    this.setData({ selectedAnswers: sa })
    // Persist
    const app = getApp<IAppOption>()
    const pid = this.data.currentPassage?.id
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
      const isPlaying = this.data.isPlaying
      if (this.data.focusMode && isPlaying && audioCtx) {
        audioCtx.pause()
      }
      this.setData({ currentPage: cp, currentSectionLabel: p?.section || '', isCurrentMarked: this.data.markedFlags[cp], isPlaying: this.data.focusMode ? false : isPlaying })
    }
  },

  nextPage() {
    if (this.data.currentPage < this.data.pages.length - 1) {
      const cp = this.data.currentPage + 1
      const p = this.data.pages[cp]
      const isPlaying = this.data.isPlaying
      if (this.data.focusMode && isPlaying && audioCtx) {
        audioCtx.pause()
      }
      this.setData({ currentPage: cp, currentSectionLabel: p?.section || '', isCurrentMarked: this.data.markedFlags[cp], isPlaying: this.data.focusMode ? false : isPlaying })
    }
  },

  toggleFocus() {
    const on = !this.data.focusMode
    if (on) {
      this.setData({ focusMode: true, loopSentence: true, speed: 0.75 })
      if (audioCtx) audioCtx.playbackRate = 0.75
    } else {
      this.setData({ focusMode: false, loopSentence: false, speed: 1 })
      if (audioCtx) audioCtx.playbackRate = 1
    }
  },

  rewindAudio() {
    if (!audioCtx) return
    audioCtx.seek(Math.max(0, audioCtx.currentTime - 15))
  },

  forwardAudio() {
    if (!audioCtx) return
    audioCtx.seek(Math.min(audioCtx.duration, audioCtx.currentTime + 15))
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
    const passage = this.data.currentPassage
    if (!passage) return
    const sentence = passage.sentences[this.data.currentIndex]
    if (!sentence) return
    this.playText(sentence.text)
  },

  playText(text: string, useAudioUrl?: string) {
    const ctx = getAudioCtx()
    ctx.stop()
    ctx.playbackRate = this.data.speed
    if (useAudioUrl) {
      ctx.src = useAudioUrl.startsWith('http') ? useAudioUrl : `${API_BASE}${encodeURI(useAudioUrl)}`
    } else {
      ctx.src = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=en`
    }
    ctx.play()
    this.setData({ isPlaying: true, loading: true })
    ctx.onPlay(() => this.setData({ loading: false }))
  },

  seekAudio(e: WechatMiniprogram.TouchEvent) {
    if (!this.data.audioMode || !audioCtx) return
    const rect = (e.currentTarget as any).boundingClientRect
    if (!rect) return
    const x = e.detail.x - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    const seekTime = ratio * this.data.audioDuration
    audioCtx.seek(seekTime)
  },

  playPause() {
    const ctx = getAudioCtx()
    if (this.data.audioMode) {
      if (this.data.isPlaying) { ctx.pause(); this.setData({ isPlaying: false }) }
      else { ctx.playbackRate = this.data.speed; ctx.play(); this.setData({ isPlaying: true }) }
    } else if (this.data.isPlaying) {
      ctx.pause(); this.setData({ isPlaying: false })
    } else {
      if (ctx.src) { ctx.play(); this.setData({ isPlaying: true }) }
      else {
        const passage = this.data.currentPassage
        if (!passage) return
        if (passage.audioUrl) this.playText('', passage.audioUrl)
        else this.playCurrent()
      }
    }
  },

  playSentence(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({ currentIndex: index })
    const passage = this.data.currentPassage
    if (passage) {
      if (passage.audioUrl) this.playText('', passage.audioUrl)
      else this.playText(passage.sentences[index].text)
    }
  },

  prevSentence() {
    if (this.data.audioMode) {
      const ctx = getAudioCtx()
      ctx.seek(Math.max(0, ctx.currentTime - 15))
    } else if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
      this.playCurrent()
    }
  },

  nextSentence() {
    if (this.data.audioMode) {
      const ctx = getAudioCtx()
      ctx.seek(Math.min(ctx.duration, ctx.currentTime + 15))
    } else {
      const passage = this.data.currentPassage
      if (!passage) return
      if (this.data.currentIndex < passage.sentences.length - 1) {
        this.setData({ currentIndex: this.data.currentIndex + 1 })
        this.playCurrent()
      }
    }
  },

  setSpeed(e: WechatMiniprogram.TouchEvent) {
    const speed = e.currentTarget.dataset.speed as number
    this.setData({ speed })
    if (audioCtx) audioCtx.playbackRate = speed
  },

  toggleTranscript() { this.setData({ showTranscript: !this.data.showTranscript }) },
  toggleDictation() { this.setData({ dictationMode: !this.data.dictationMode }) },
  toggleLoop() { this.setData({ loopSentence: !this.data.loopSentence }) },

  toggleHard(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    const passage = this.data.currentPassage
    if (!passage) return
    const app = getApp<IAppOption>()
    const stored = app.globalData.studyData.hardSentences
    const hardSet = new Set(this.data.hardSentences)
    if (hardSet.has(index)) {
      hardSet.delete(index)
      const idx = stored.findIndex(h => h.passageId === passage.id && h.sentenceIndex === index)
      if (idx !== -1) stored.splice(idx, 1)
      wx.showToast({ title: '已取消难句', icon: 'none' })
    } else {
      hardSet.add(index)
      stored.push({ passageId: passage.id, sentenceIndex: index, text: passage.sentences[index].text, passageTitle: passage.title })
      wx.showToast({ title: '已标记难句', icon: 'none' })
    }
    this.setData({ hardSentences: [...hardSet] })
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
    doCheckIn()
    wx.showToast({ title: '已标记完成', icon: 'success' })
  },

  getBlankText(text: string): string {
    if (!this.data.dictationMode) return text
    const words = text.split(' ')
    return words.map((w, i) => i % 3 === 0 ? '____' : w).join(' ')
  },
})
