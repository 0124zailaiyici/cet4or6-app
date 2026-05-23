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

interface IErrorsData {
  tab: number
  readingErrors: IErrorItem[]
  listeningErrors: IErrorItem[]
  rightCount: number
  wrongCount: number
  totalAttempted: number
  darkMode: boolean
}

interface IErrorsMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  loadErrors(): void
}

Page<IErrorsData, IErrorsMethods>({
  data: {
    tab: 0,
    readingErrors: [],
    listeningErrors: [],
    rightCount: 0,
    wrongCount: 0,
    totalAttempted: 0,
    darkMode: false,
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadErrors()
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    this.setData({ tab })
  },

  loadErrors() {
    const app = getApp<IAppOption>()
    const sd = app.globalData.studyData
    const readingErrors: IErrorItem[] = []
    const listeningErrors: IErrorItem[] = []

    // Reading errors
    if (sd.readingAnswers) {
      for (const pidStr of Object.keys(sd.readingAnswers)) {
        const pid = parseInt(pidStr)
        const ans = sd.readingAnswers[pid]
        const passage = (readingsData as any[]).find((r: any) => r.id === pid)
        if (!passage) continue
        const correct = passage.correctAnswers || {}
        const title = passage.title || ''

        // Section C
        if (ans.cAnswers) {
          for (const qiStr of Object.keys(ans.cAnswers)) {
            const qi = parseInt(qiStr)
            const selLetter = ans.cAnswers[qi]
            const correctLetter = correct[String(qi)] || ''
            const qText = passage.questions?.[qi] || ''
            const opts = passage.choices?.[qi] || []
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

        // Section B
        if (ans.matchAnswers) {
          for (const siStr of Object.keys(ans.matchAnswers)) {
            const si = parseInt(siStr)
            const letter = ans.matchAnswers[si]
            const correctLetter = correct[String(si)] || ''
            const stmt = passage.questions?.[si] || ''
            readingErrors.push({
              id: `r-${pid}-b-${si}`, source: title, section: '长篇阅读',
              qLabel: `#${si + 1}`, question: stmt, userAnswer: `匹配 ${letter}`,
              correctAnswer: `匹配 ${correctLetter || '?'}`, isCorrect: letter === correctLetter,
              passageId: pid, passageType: 'reading',
            })
          }
        }

        // Section A
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

    // Listening errors
    if (sd.listeningAnswers) {
      for (const pidStr of Object.keys(sd.listeningAnswers)) {
        const pid = parseInt(pidStr)
        const pageAnswers = sd.listeningAnswers[pid]
        const passage = (listeningData as any[]).find((r: any) => r.id === pid)
        if (!passage) continue
        const correct = passage.correctAnswers || {}
        for (const piStr of Object.keys(pageAnswers)) {
          const pi = parseInt(piStr)
          const oi = pageAnswers[pi]
          const sentText = passage.sentences?.[pi]?.text || ''
          const qm = sentText.match(/^Q(\d+)\./)
          const qLabel = qm ? `Q${qm[1]}` : `第${pi}页`
          const userLetter = optionLetter(oi)
          const correctLetter = qm ? (correct[qm[1]] || '?') : '?'
          const isCorrect = userLetter === correctLetter
          listeningErrors.push({
            id: `l-${pid}-${pi}`, source: passage.title || '', section: '听力',
            qLabel, question: sentText.slice(0, 80), userAnswer: userLetter,
            correctAnswer: correctLetter, isCorrect, passageId: pid, passageType: 'listening',
          })
        }
      }
    }

    const right = [...readingErrors, ...listeningErrors].filter(e => e.isCorrect).length
    const wrong = readingErrors.length + listeningErrors.length - right

    this.setData({
      readingErrors, listeningErrors,
      rightCount: right, wrongCount: wrong,
      totalAttempted: readingErrors.length + listeningErrors.length,
    })
  },
})

function optionLetter(i: number): string {
  return ['A', 'B', 'C', 'D'][i] || '?'
}
