import { applyTheme, getDarkMode } from '../../utils/theme'

interface IQItem {
  q: string
  opts: string[]
  answer: number
}

Page({
  data: {
    step: 0,
    darkMode: false,
    questions: [
      { q: '"The center of American automobile innovation has in the past decade moved 2,000 miles away."\n这句话的大意是？', opts: ['美国汽车价格涨了', '汽车创新中心转移了', '汽车工厂倒闭了', '高速公路修好了'], answer: 1 },
      { q: '"It is a mistake to simply equate longevity with issues of old age."\n"equate" 最接近的意思是？', opts: ['等同', '计算', '争论', '解决'], answer: 0 },
      { q: '四级听力 Section A 通常是什么题型？', opts: ['新闻报道选择题', '完形填空', '段落翻译', '命题作文'], answer: 0 },
    ] as IQItem[],
    answered: [] as number[],
    showingResult: false,
    resultEmoji: '',
    resultTitle: '',
    resultDesc: '',
    resultCorrect: 0,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
  },

  skip() {
    wx.setStorageSync('hasGuided', true)
    wx.reLaunch({ url: '/pages/index/index' })
  },

  nextStep() {
    this.setData({ step: this.data.step + 1 })
  },

  onTapOpt(e: WechatMiniprogram.TouchEvent) {
    const oi = Number(e.currentTarget.dataset.oi)
    const step = this.data.step - 1
    if (this.data.showingResult) return

    const answered = [...this.data.answered]
    answered[step] = oi
    this.setData({ answered, showingResult: true })

    setTimeout(() => {
      if (step < this.data.questions.length - 1) {
        this.setData({ step: this.data.step + 1, showingResult: false })
      } else {
        const correctCount = this.data.questions.filter((q, i) => answered[i] === q.answer).length
        const result = [3, 1, 0].reduce((best, c) => Math.abs(c - correctCount) < Math.abs(best - correctCount) ? c : best, correctCount)
        const r = result === 3
          ? { emoji: '🏆', title: '满分！', desc: '你的基础很不错，开始系统备考吧！' }
          : result >= 1
            ? { emoji: '🎉', title: '不错的开始！', desc: '继续练习，坚持就是进步。' }
            : { emoji: '💪', title: '第一步已经迈出了！', desc: '没关系，从基础开始，每天进步一点点。' }
        this.setData({ step: 99, showingResult: false, resultEmoji: r.emoji, resultTitle: r.title, resultDesc: r.desc, resultCorrect: correctCount })
      }
    }, 800)
  },

  finish() {
    wx.setStorageSync('hasGuided', true)
    wx.reLaunch({ url: '/pages/index/index' })
  },
})
