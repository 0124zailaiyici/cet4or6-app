"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readings_1 = __importDefault(require("../../data/readings"));
const listening_1 = __importDefault(require("../../data/listening"));
const checkin_1 = require("../../utils/checkin");
const theme_1 = require("../../utils/theme");
Page({
    data: {
        streak: 0, totalItems: 0, accuracy: 0, monthDays: 0,
        achievements: [],
        calendar: [],
        monthLabel: '',
        darkMode: false,
    },
    onShow() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        this.loadData();
    },
    loadData() {
        const app = getApp();
        const sd = app.globalData.studyData;
        const streak = (0, checkin_1.calcStreak)(sd.checkInDates);
        // Correct/wrong from reading & listening
        const getStats = () => {
            let correct = 0, total = 0;
            if (sd.readingAnswers) {
                for (const pidStr of Object.keys(sd.readingAnswers)) {
                    const ans = sd.readingAnswers[Number(pidStr)];
                    const p = readings_1.default.find((r) => r.id === Number(pidStr));
                    if (!p || !p.correctAnswers || !ans || !ans.cAnswers)
                        continue;
                    for (const qi of Object.keys(p.correctAnswers)) {
                        if (p.correctAnswers[qi] === ans.cAnswers[Number(qi)])
                            correct++;
                        total++;
                    }
                }
            }
            if (sd.listeningAnswers) {
                for (const pidStr of Object.keys(sd.listeningAnswers)) {
                    const ans = sd.listeningAnswers[Number(pidStr)];
                    const p = listening_1.default.find((l) => l.id === Number(pidStr));
                    if (!p && p.correctAnswers)
                        continue;
                    for (const qi of Object.keys(p.correctAnswers)) {
                        for (const piStr of Object.keys(ans)) {
                            const sentText = p.sentences && p.sentences[Number(piStr)] && p.sentences[Number(piStr)].text || '';
                            if ((sentText.match(/^Q(\d+)\./) || [])[1] === qi && ['A', 'B', 'C', 'D'][ans[Number(piStr)]] === p.correctAnswers[qi])
                                correct++;
                        }
                        total++;
                    }
                }
            }
            return { correct, total };
        };
        const stats = getStats();
        const totalItems = stats.total;
        const accuracy = totalItems > 0 ? Math.round(stats.correct / totalItems * 100) : 0;
        // Calendar
        const now = new Date(), year = now.getFullYear(), month = now.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1).getDay();
        const cells = [];
        for (let i = 0; i < firstDay; i++)
            cells.push({ day: null, level: 0, isToday: false });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const checked = sd.checkInDates.includes(dateStr);
            const lv = checked ? (d === now.getDate() ? 3 : (sd.todayActivity && sd.todayActivity.date === dateStr ? 2 : 1)) : 0;
            cells.push({ day: d, level: lv, isToday: d === now.getDate() });
        }
        const calRows = [];
        for (let i = 0; i < cells.length; i += 7) {
            const row = cells.slice(i, i + 7);
            while (row.length < 7)
                row.push({ day: null, level: 0, isToday: false });
            calRows.push(row);
        }
        // Achievements
        const totalQ = stats.total;
        const achievements = [
            { emoji: '🔥', name: '连续 7 天', unlocked: streak >= 7 },
            { emoji: '🎯', name: '100 题', unlocked: totalQ >= 100 },
            { emoji: '💯', name: '正确率 >80%', unlocked: totalQ > 0 && stats.correct / totalQ >= 0.8 },
            { emoji: '⭐', name: '30 天', unlocked: streak >= 30 },
        ];
        this.setData({
            streak, totalItems: totalQ, accuracy, monthDays: sd.checkInDates.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length,
            calendar: calRows, achievements, monthLabel: `${year}年${month}月`,
        });
    },
    goPage(e) {
        const url = e.currentTarget.dataset.url;
        wx.navigateTo({ url });
    },
});
