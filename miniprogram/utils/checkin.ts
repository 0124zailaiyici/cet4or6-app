function today(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function doCheckIn(activity?: string): number {
  const app = getApp<IAppOption>()
  const sd = app.globalData.studyData
  const t = today()

  // Check-in
  if (sd.checkInDates.indexOf(t) === -1) {
    sd.checkInDates.push(t)
  }

  // Today activity tracking
  if (!sd.todayActivity || sd.todayActivity.date !== t) {
    sd.todayActivity = { date: t, listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 }
  }
  if (activity === 'listen') sd.todayActivity.listen++
  else if (activity === 'sentence') sd.todayActivity.sentence++
  else if (activity === 'translation') sd.todayActivity.translation++
  else if (activity === 'writing') sd.todayActivity.writing++
  if (activity) sd.todayActivity.total++
  wx.setStorageSync('studyData', sd)

  return calcStreak(sd.checkInDates)
}

export function getTodayActivity(): { listen: number; sentence: number; translation: number; writing: number; total: number } {
  const app = getApp<IAppOption>()
  const sd = app.globalData.studyData
  const t = today()
  if (sd.todayActivity && sd.todayActivity.date === t) {
    return sd.todayActivity
  }
  return { listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 }
}

export function calcStreak(dates: string[]): number {
  if (dates.length === 0) return 0
  const sorted = [...dates].sort().reverse()
  let streak = 0
  const d = new Date()
  for (let i = 0; i < sorted.length; i++) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const expected = `${y}-${m}-${day}`
    if (sorted[i] === expected) {
      streak++
      d.setDate(d.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export function isCheckedInToday(): boolean {
  const app = getApp<IAppOption>()
  return app.globalData.studyData.checkInDates.indexOf(today()) !== -1
}

export function getMonthDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}
