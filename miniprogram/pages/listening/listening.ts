import listeningData from '../../data/listening'
import { doCheckIn } from '../../utils/checkin'
import { applyTheme, getDarkMode } from '../../utils/theme'

const API_BASE = 'http://localhost:3000'

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
}

interface IListeningMethods {
  enterDetail(e: WechatMiniprogram.TouchEvent): void
  backToList(): void
  playPause(): void
  playCurrent(): void
  playText(text: string): void
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
}

let audioCtx: WechatMiniprogram.InnerAudioContext | null = null
let pageRef: any = null

function getAudioCtx(): WechatMiniprogram.InnerAudioContext {
  if (!audioCtx) {
    audioCtx = wx.createInnerAudioContext()
    audioCtx.onEnded(() => {
      if (!pageRef) return
      if (pageRef.data.loopSentence) {
        pageRef.playCurrent()
      } else if (pageRef.data.currentIndex < pageRef.data.currentPassage.sentences.length - 1) {
        pageRef.nextSentence()
      } else {
        pageRef.setData({ isPlaying: false })
      }
    })
    audioCtx.onError(() => {
      wx.showToast({ title: '播放失败', icon: 'none' })
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
  },

  onLoad() {
    pageRef = this
    const passages = listeningData as IListeningItem[]
    const app = getApp<IAppOption>()
    const studyData = app.globalData.studyData
    this.setData({
      passages,
      darkMode: app.globalData.darkMode,
      completedPassages: studyData.completedListens,
    })
  },

  onShow() {
    applyTheme(getDarkMode())
    const app = getApp<IAppOption>()
    this.setData({ darkMode: app.globalData.darkMode })
  },

  onUnload() {
    pageRef = null
    if (audioCtx) {
      audioCtx.destroy()
      audioCtx = null
    }
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const passage = this.data.passages.find(p => p.id === id)
    if (passage) {
      const app = getApp<IAppOption>()
      const stored = app.globalData.studyData.hardSentences || []
      const localHard = stored.filter(h => h.passageId === passage.id).map(h => h.sentenceIndex)
      this.setData({
        mode: 'detail',
        currentPassage: passage,
        currentIndex: 0,
        isPlaying: false,
        hardSentences: localHard,
      })
    }
  },

  backToList() {
    if (audioCtx) audioCtx.stop()
    this.setData({ mode: 'list', currentPassage: null, isPlaying: false })
  },

  playCurrent() {
    const passage = this.data.currentPassage
    if (!passage) return
    const sentence = passage.sentences[this.data.currentIndex]
    if (!sentence) return
    this.playText(sentence.text)
  },

  playText(text: string) {
    const ctx = getAudioCtx()
    ctx.stop()
    ctx.playbackRate = this.data.speed
    ctx.src = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=en`
    ctx.play()
    this.setData({ isPlaying: true, loading: true })
    ctx.onPlay(() => this.setData({ loading: false }))
  },

  playPause() {
    if (this.data.isPlaying) {
      getAudioCtx().pause()
      this.setData({ isPlaying: false })
    } else {
      getAudioCtx().play()
      this.setData({ isPlaying: true })
    }
  },

  playSentence(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({ currentIndex: index })
    const passage = this.data.currentPassage
    if (passage) {
      const sentence = passage.sentences[index]
      this.playText(sentence.text)
    }
  },

  prevSentence() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
      this.playCurrent()
    }
  },

  nextSentence() {
    const passage = this.data.currentPassage
    if (!passage) return
    if (this.data.currentIndex < passage.sentences.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 })
      this.playCurrent()
    }
  },

  setSpeed(e: WechatMiniprogram.TouchEvent) {
    const speed = e.currentTarget.dataset.speed as number
    this.setData({ speed })
    if (audioCtx) audioCtx.playbackRate = speed
  },

  toggleTranscript() {
    this.setData({ showTranscript: !this.data.showTranscript })
  },

  toggleDictation() {
    this.setData({ dictationMode: !this.data.dictationMode })
  },

  toggleLoop() {
    this.setData({ loopSentence: !this.data.loopSentence })
  },

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
      stored.push({
        passageId: passage.id,
        sentenceIndex: index,
        text: passage.sentences[index].text,
        passageTitle: passage.title,
      })
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
