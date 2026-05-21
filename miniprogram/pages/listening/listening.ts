import listeningData from '../../data/listening'
import { doCheckIn } from '../../utils/checkin'

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
}

interface IListeningMethods {
  enterDetail(e: WechatMiniprogram.TouchEvent): void
  backToList(): void
  playPause(): void
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
  },

  onLoad() {
    const passages = listeningData as IListeningItem[]
    const app = getApp<IAppOption>()
    const studyData = app.globalData.studyData
    this.setData({
      passages,
      completedPassages: studyData.completedListens,
    })
  },

  enterDetail(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as number
    const passage = this.data.passages.find(p => p.id === id)
    if (passage) {
      this.setData({
        mode: 'detail',
        currentPassage: passage,
        currentIndex: 0,
        isPlaying: false,
      })
    }
  },

  backToList() {
    this.setData({ mode: 'list', currentPassage: null, isPlaying: false })
  },

  playPause() {
    if (!this.data.currentPassage) return
    if (this.data.currentPassage.audioUrl) {
      this.setData({ isPlaying: !this.data.isPlaying })
    } else {
      wx.showToast({ title: '音频暂未配置', icon: 'none' })
    }
  },

  playSentence(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index as number
    this.setData({ currentIndex: index, isPlaying: true })
  },

  prevSentence() {
    if (this.data.currentIndex > 0) {
      this.setData({ currentIndex: this.data.currentIndex - 1 })
    }
  },

  nextSentence() {
    const passage = this.data.currentPassage
    if (!passage) return
    if (this.data.currentIndex < passage.sentences.length - 1) {
      this.setData({ currentIndex: this.data.currentIndex + 1 })
    }
  },

  setSpeed(e: WechatMiniprogram.TouchEvent) {
    const speed = e.currentTarget.dataset.speed as number
    this.setData({ speed })
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
    const hardSet = new Set(this.data.hardSentences)
    if (hardSet.has(index)) {
      hardSet.delete(index)
    } else {
      hardSet.add(index)
    }
    this.setData({ hardSentences: [...hardSet] })
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
    const blanked = words.map((w, i) => {
      return i % 3 === 0 ? '____' : w
    })
    return blanked.join(' ')
  },
})
