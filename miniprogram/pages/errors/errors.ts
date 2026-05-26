import readingsData from '../../data/readings'
import listeningData from '../../data/listening'
import { applyTheme, getDarkMode } from '../../utils/theme'

interface IErrorItem {
  id: string
  source: string
  section: string
  qLabel: string
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  passageId: number
  passageType: string
}

interface IQuizOption {
  text: string
  isCorrect: boolean
  letter: string
}

interface IFloor {
  id: string
  name: string
  icon: string
  cleared: boolean
  locked: boolean
}

Page({
  data: {
    view: 'boss',
    tab: 0,
    readingErrors: [] as IErrorItem[],
    listeningErrors: [] as IErrorItem[],
    rightCount: 0,
    wrongCount: 0,
    totalAttempted: 0,
    darkMode: false,
    floors: [] as IFloor[],
    currentFloor: 0,
    bossHP: 0,
    maxHP: 0,
    combo: 0,
    battleLog: [] as string[],
    bossDefeated: false,
    allCleared: false,
    currentError: null as IErrorItem | null,
    quizOptions: [] as IQuizOption[],
    totalErrors: 0,
    totalCleared: 0,
    showResult: false,
    animating: false,
    answering: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() } as any)
    this.loadErrors()
  },

  switchView(e: WechatMiniprogram.TouchEvent) {
    const v = e.currentTarget.dataset.view as string
    this.setData({ view: v } as any)
    if (v === 'boss') {
      this.startBossRush()
    }
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    this.setData({ tab } as any)
  },

  loadErrors() {
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData
    const readingErrors: IErrorItem[] = []
    const listeningErrors: IErrorItem[] = []

    if (sd.readingAnswers) {
      for (const pidStr of Object.keys(sd.readingAnswers)) {
        const pid = parseInt(pidStr)
        const ans = (sd.readingAnswers as any)[pid]
        const passage = (readingsData as any[]).find((r: any) => r.id === pid)
        if (!passage) continue
        const correct = passage.correctAnswers || {}
        const title = passage.title || ''

        if (ans.cAnswers) {
          for (const qiStr of Object.keys(ans.cAnswers)) {
            const qi = parseInt(qiStr)
            const selLetter = ans.cAnswers[qi]
            const correctLetter = correct[String(qi)] || ''
            const qText = passage.questions && passage.questions[qi] || ''
            const opts = passage.choices && passage.choices[qi] || []
            const optText = opts.find((o: string) => o.startsWith(selLetter + ')')) || selLetter
            const correctText = opts.find((o: string) => o.startsWith(correctLetter + ')')) || correctLetter
            readingErrors.push({
              id: `r-${pid}-c-${qi}`, source: title, section: '仔细阅读',
              qLabel: `Q${qi + 1}`, question: qText, userAnswer: optText,
              correctAnswer: correctText, isCorrect: selLetter === correctLetter,
              passageId: pid, passageType: 'reading',
            })
          }
        }

        if (ans.matchAnswers) {
          for (const siStr of Object.keys(ans.matchAnswers)) {
            const si = parseInt(siStr)
            const letter = ans.matchAnswers[si]
            const correctLetter = correct[String(si)] || ''
            const stmt = passage.questions && passage.questions[si] || ''
            readingErrors.push({
              id: `r-${pid}-b-${si}`, source: title, section: '长篇阅读',
              qLabel: `#${si + 1}`, question: stmt, userAnswer: `匹配 ${letter}`,
              correctAnswer: `匹配 ${correctLetter || '?'}`, isCorrect: letter === correctLetter,
              passageId: pid, passageType: 'reading',
            })
          }
        }

        if (ans.blankAnswers) {
          for (const bn of Object.keys(ans.blankAnswers)) {
            const word = ans.blankAnswers[bn]
            const correctWord = correct[bn] || ''
            readingErrors.push({
              id: `r-${pid}-a-${bn}`, source: title, section: '选词填空',
              qLabel: `第${bn}空`, question: `填入「${word}」`, userAnswer: word,
              correctAnswer: correctWord, isCorrect: word === correctWord,
              passageId: pid, passageType: 'reading',
            })
          }
        }
      }
    }

    if (sd.listeningAnswers) {
      for (const pidStr of Object.keys(sd.listeningAnswers)) {
        const pid = parseInt(pidStr)
        const pageAnswers = (sd.listeningAnswers as any)[pid]
        const passage = (listeningData as any[]).find((r: any) => r.id === pid)
        if (!passage) continue
        const correct = passage.correctAnswers || {}
        for (const piStr of Object.keys(pageAnswers)) {
          const pi = parseInt(piStr)
          const oi = pageAnswers[pi]
          const sentText = passage.sentences && passage.sentences[pi] && passage.sentences[pi].text || ''
          const qm = sentText.match(/^Q(\d+)\./)
          const qLabel = qm ? `Q${qm[1]}` : `第${pi}页`
          const userLetter = optionLetter(oi)
          const correctLetter = qm ? (correct[qm[1]] || '?') : '?'
          const isCorrect = userLetter === correctLetter
          listeningErrors.push({
            id: `l-${pid}-${pi}`, source: passage.title || '', section: '听力',
            qLabel, question: sentText.slice(0, 100), userAnswer: userLetter,
            correctAnswer: correctLetter, isCorrect, passageId: pid, passageType: 'listening',
          })
        }
      }
    }

    const all = [...readingErrors, ...listeningErrors]
    const right = all.filter(e => e.isCorrect).length
    const wrong = all.length - right

    this.setData({
      readingErrors, listeningErrors,
      rightCount: right, wrongCount: wrong,
      totalAttempted: all.length,
    } as any)

    this.startBossRush()
  },

  startBossRush() {
    const wr: IErrorItem[] = this.data.readingErrors.filter(e => !e.isCorrect)
    const wl: IErrorItem[] = this.data.listeningErrors.filter(e => !e.isCorrect)
    const all: IErrorItem[] = [...wr, ...wl]

    if (all.length === 0) {
      this.setData({
        floors: [{ id: 'empty', name: '没有错题', icon: '🎉', cleared: false, locked: false }],
        currentFloor: 0, bossHP: 0, maxHP: 1,
        totalErrors: 0, totalCleared: 0,
      } as any)
      return
    }

    const grouped: { [key: string]: IErrorItem[] } = {}
    for (const e of all) {
      const key = e.passageType + ':' + e.source
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(e)
    }

    const floors: IFloor[] = Object.keys(grouped).map((key, i) => ({
      id: key,
      name: grouped[key][0].source || (grouped[key][0].passageType === 'reading' ? '阅读' : '听力'),
      icon: grouped[key][0].passageType === 'reading' ? '📖' : '🎵',
      cleared: false,
      locked: i > 0,
    }))

    this.setData({
      floors,
      currentFloor: 0,
      combo: 0,
      battleLog: ['⚔️ 战斗开始！复习错题来攻击 Boss！'],
      bossDefeated: false,
      allCleared: false,
      totalErrors: all.length,
      totalCleared: 0,
      showResult: false,
      animating: false,
      answering: false,
    } as any)

    this.setFloorBoss(0, all)
  },

  setFloorBoss(floorIdx: number, allErrors: IErrorItem[] | null) {
    const errors: IErrorItem[] = allErrors || this.getAllErrors()
    const floor = this.data.floors[floorIdx]
    if (!floor) return
    const wrong: IErrorItem[] = errors.filter(e => !e.isCorrect)
      .filter(e => e.passageType + ':' + e.source === floor.id)
    const count = wrong.length

    this.setData({
      currentFloor: floorIdx,
      maxHP: count,
      bossHP: count,
      currentError: null,
      quizOptions: [],
      bossDefeated: false,
    } as any)

    this.nextEnemy(errors)
  },

  getAllErrors(): IErrorItem[] {
    const wr: IErrorItem[] = this.data.readingErrors.filter(e => !e.isCorrect)
    const wl: IErrorItem[] = this.data.listeningErrors.filter(e => !e.isCorrect)
    return [...wr, ...wl]
  },

  getCurrentFloorErrors(allErrors: IErrorItem[]): IErrorItem[] {
    const floor = this.data.floors[this.data.currentFloor]
    if (!floor) return []
    return allErrors.filter(e => e.passageType + ':' + e.source === floor.id)
  },

  nextEnemy(allErrors?: IErrorItem[]) {
    const errors: IErrorItem[] = allErrors || this.getAllErrors()
    const floorErrors: IErrorItem[] = this.getCurrentFloorErrors(errors)
    const remaining: IErrorItem[] = floorErrors.filter(e => !(e as any)._cleared)

    if (remaining.length === 0) {
      const floors = this.data.floors
      if (this.data.currentFloor < floors.length - 1) {
        floors[this.data.currentFloor].cleared = true
        floors[this.data.currentFloor + 1].locked = false
        this.setData({
          floors,
          bossDefeated: true,
          battleLog: ['🎉 楼层 Boss 击败！'].concat(this.data.battleLog).slice(0, 10),
        } as any)
      } else {
        floors[this.data.currentFloor].cleared = true
        this.setData({
          floors,
          bossDefeated: true,
          allCleared: true,
          showResult: true,
          battleLog: ['🏆 所有错题已讨伐！'].concat(this.data.battleLog).slice(0, 10),
        } as any)
      }
      return
    }

    const enemy = remaining[0]
    const options: IQuizOption[] = this.buildQuizOptions(enemy, errors)

    this.setData({
      currentError: enemy,
      quizOptions: options,
      bossDefeated: false,
      answering: false,
    } as any)
  },

  buildQuizOptions(enemy: IErrorItem, allErrors: IErrorItem[]): IQuizOption[] {
    const letters = ['A', 'B', 'C', 'D']
    const correct: IQuizOption = { text: enemy.correctAnswer, isCorrect: true, letter: '' }
    const user: IQuizOption = { text: enemy.userAnswer, isCorrect: false, letter: '' }
    const others: IQuizOption[] = []

    const pool: IErrorItem[] = allErrors.filter(e => e.id !== enemy.id && e.passageType === enemy.passageType)
    const usedTexts = new Set([enemy.correctAnswer, enemy.userAnswer])

    for (const e of pool) {
      const t = e.correctAnswer
      if (t && !usedTexts.has(t)) {
        others.push({ text: t, isCorrect: false, letter: '' })
        usedTexts.add(t)
      }
      if (others.length >= 2) break
    }

    const fillers = ['A) 不确定', 'B) 以上都不对', 'C) 需要复习', 'D) 其他']
    while (others.length < 2) {
      const f = fillers[others.length]
      if (!usedTexts.has(f)) {
        others.push({ text: f, isCorrect: false, letter: '' })
        usedTexts.add(f)
      }
    }

    const result: IQuizOption[] = [correct, user, others[0], others[1]]
    const shuffled = result.sort(() => Math.random() - 0.5)
    shuffled.forEach((o, i) => { o.letter = letters[i] })
    return shuffled
  },

  attack(e: WechatMiniprogram.TouchEvent) {
    if (this.data.animating || this.data.answering) return
    const isCorrect = e.currentTarget.dataset.correct === 'true'
    if (!this.data.currentError) return

    this.setData({ answering: true } as any)

    if (isCorrect) {
      const combo = this.data.combo + 1
      const newHP = Math.max(0, this.data.bossHP - 1)
      const log = `⚡ 正确！连击 x${combo}!`
      const battleLog: string[] = [log].concat(this.data.battleLog).slice(0, 10)

      this.setData({
        bossHP: newHP,
        combo,
        battleLog,
        animating: true,
        totalCleared: this.data.totalCleared + 1,
      } as any)

      const allErrors: IErrorItem[] = this.getAllErrors()
      for (const e of allErrors) {
        if (e.id === (this.data.currentError as IErrorItem).id) {
          (e as any)._cleared = true
          break
        }
      }

      setTimeout(() => {
        this.setData({ animating: false } as any)
        if (newHP <= 0) {
          setTimeout(() => this.nextEnemy(allErrors), 600)
        } else {
          this.nextEnemy(allErrors)
        }
      }, 800)
    } else {
      const battleLog: string[] = ['💥 错误！连击中断！'].concat(this.data.battleLog).slice(0, 10)
      this.setData({
        combo: 0,
        battleLog,
        animating: true,
      } as any)
      setTimeout(() => {
        this.setData({ animating: false, answering: false } as any)
        const err = this.data.currentError
        if (err) {
          wx.showToast({ title: `答案: ${err.correctAnswer}`, icon: 'none', duration: 1500 })
        }
        this.nextEnemy(this.getAllErrors())
      }, 600)
    }
  },

  moveToFloor(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const floor = this.data.floors[idx]
    if (!floor || floor.locked || floor.cleared) return
    this.setFloorBoss(idx, null)
  },

  restartBattle() {
    for (const e of this.getAllErrors()) {
      delete (e as any)._cleared
    }
    this.setData({ showResult: false, allCleared: false } as any)
    this.startBossRush()
  },

  goReading() {
    wx.navigateTo({ url: '/pages/reading/reading' })
  },

  goListening() {
    wx.navigateTo({ url: '/pages/listening/listening' })
  },
})

function optionLetter(i: number): string {
  return ['A', 'B', 'C', 'D'][i] || '?'
}
