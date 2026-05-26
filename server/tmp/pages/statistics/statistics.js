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
        weekBars: [], modules: [],
        totalCorrect: 0, totalWrong: 0,
        calendar: [], monthLabel: '',
        darkMode: false,
        achievements: [],
    },
    onLoad() { this.refresh(); },
    onShow() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        this.refresh();
    },
    refresh() {
        const app = getApp();
        const sd = app.globalData.studyData;
        // Streak
        const streak = (0, checkin_1.calcStreak)(sd.checkInDates);
        // Weekly bars (last 7 days)
        const weekBars = [];
        const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const count = (sd.todayActivity && sd.todayActivity.date === dateStr ? sd.todayActivity && sd.todayActivity.total || 0 : 0);
            // Check if checked in
            const checked = sd.checkInDates.includes(dateStr);
            weekBars.push({ h: checked ? Math.max(20, Math.min(100, count * 25)) : 0, label: weekLabels[i], today: i === 0 });
        }
        // Module accuracy
        const getModuleStats = (type) => {
            let correct = 0, total = 0;
            if (type === 'reading' && sd.readingAnswers) {
                for (const pidStr of Object.keys(sd.readingAnswers)) {
                    const ans = sd.readingAnswers[Number(pidStr)];
                    const passage = readings_1.default.find((r) => r.id === Number(pidStr));
                    if (!passage || !passage.correctAnswers || !ans && ans.cAnswers)
                        continue;
                    for (const qi of Object.keys(passage.correctAnswers)) {
                        if (passage.correctAnswers[qi] === ans.cAnswers[Number(qi)])
                            correct++;
                        total++;
                    }
                }
            }
            if (type === 'listening' && sd.listeningAnswers) {
                for (const pidStr of Object.keys(sd.listeningAnswers)) {
                    const ans = sd.listeningAnswers[Number(pidStr)];
                    const passage = listening_1.default.find((l) => l.id === Number(pidStr));
                    if (!passage && passage.correctAnswers)
                        continue;
                    for (const qi of Object.keys(passage.correctAnswers)) {
                        for (const piStr of Object.keys(ans)) {
                            const pi = Number(piStr);
                            const sentText = passage.sentences && passage.sentences[pi] && passage.sentences[pi].text || '';
                            if ((sentText.match(/^Q(\d+)\./) || [])[1] === qi && optionLetter(ans[pi]) === passage.correctAnswers[qi])
                                correct++;
                        }
                        total++;
                    }
                }
            }
            return { correct, total };
        };
        const readStats = getModuleStats('reading');
        const listenStats = getModuleStats('listening');
        const modules = [
            { icon: '🎵', label: '听力', pct: listenStats.total > 0 ? Math.round(listenStats.correct / listenStats.total * 100) : 0, detail: `${listenStats.correct}/${listenStats.total}`, color: '#4fc3f7' },
            { icon: '📖', label: '阅读', pct: readStats.total > 0 ? Math.round(readStats.correct / readStats.total * 100) : 0, detail: `${readStats.correct}/${readStats.total}`, color: '#81c784' },
            { icon: '💬', label: '句子', pct: sd.masteredSentences.length > 0 ? Math.min(100, Math.round(sd.masteredSentences.length / 50 * 100)) : 0, detail: `${sd.masteredSentences.length}/50`, color: '#ffb74d' },
            { icon: '🌟', label: '翻译', pct: sd.translationRecords.length > 0 ? Math.round(sd.translationRecords.reduce((a, r) => a + (r.score || 0), 0) / sd.translationRecords.length) : 0, detail: `${sd.translationRecords.length}次`, color: '#ce93d8' },
        ];
        // Total correct/wrong
        const totalCorrect = readStats.correct + listenStats.correct;
        const totalWrong = Math.max(0, (readStats.total + listenStats.total) - totalCorrect);
        // Calendar
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const daysInMonth = new Date(year, month, 0).getDate();
        const firstDay = new Date(year, month - 1, 1).getDay();
        const cells = [];
        for (let i = 0; i < firstDay; i++)
            cells.push({ day: null, level: 0, isToday: false });
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const checked = sd.checkInDates.includes(dateStr);
            const isToday = d === now.getDate();
            const level = checked ? (isToday ? 3 : (sd.todayActivity && sd.todayActivity.date === dateStr ? 2 : 1)) : 0;
            cells.push({ day: d, level, isToday });
        }
        const calRows = [];
        for (let i = 0; i < cells.length; i += 7) {
            const row = cells.slice(i, i + 7);
            while (row.length < 7)
                row.push({ day: null, level: 0, isToday: false });
            calRows.push(row);
        }
        // Achievements
        const totalQ = Object.values(sd.readingAnswers || {}).reduce((a, r) => a + (r.cAnswers ? Object.keys(r.cAnswers).length : 0), 0)
            + Object.values(sd.listeningAnswers || {}).reduce((a, r) => a + Object.keys(r).length, 0);
        const totalUnits = sd.completedListens.length + sd.masteredSentences.length + sd.translationRecords.length + sd.writingRecords.length;
        const achievements = [
            { emoji: '🔥', name: '连续 7 天', unlocked: streak >= 7 },
            { emoji: '🎯', name: '完成 100 题', unlocked: totalQ >= 100 },
            { emoji: '💯', name: '正确率 >80%', unlocked: (totalCorrect + totalWrong) > 0 && totalCorrect / (totalCorrect + totalWrong) >= 0.8 },
            { emoji: '⭐', name: '连续 30 天', unlocked: streak >= 30 },
            { emoji: '📚', name: '做完 5 套', unlocked: totalUnits >= 5 },
            { emoji: '🌙', name: '全题做完', unlocked: (readStats.total > 0 && readStats.correct === readStats.total) || false },
        ];
        this.setData({
            streak,
            totalItems: totalCorrect + totalWrong,
            accuracy: (totalCorrect + totalWrong) > 0 ? Math.round(totalCorrect / (totalCorrect + totalWrong) * 100) : 0,
            monthDays: sd.checkInDates.filter(d => d.startsWith(`${year}-${String(month).padStart(2, '0')}`)).length,
            weekBars, modules, totalCorrect, totalWrong,
            calendar: calRows,
            monthLabel: `${year}年${month}月`,
            achievements,
        });
    },
    clearData() {
        wx.showModal({
            title: '确认清除',
            content: '将清除所有学习记录，此操作不可撤销。',
            success: (res) => {
                if (res.confirm) {
                    const empty = {
                        completedListens: [], masteredSentences: [], translationRecords: [], writingRecords: [],
                        checkInDates: [], favoriteSentenceIds: [], hardSentences: [],
                        readingAnswers: {}, listeningAnswers: {},
                        todayActivity: { date: '', listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 },
                        vocabWords: [], dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 },
                    };
                    const app = getApp();
                    app.globalData.studyData = empty;
                    wx.setStorageSync('studyData', empty);
                    this.refresh();
                    wx.showToast({ title: '已清除', icon: 'success' });
                }
            },
        });
    },
});
function optionLetter(i) { return ['A', 'B', 'C', 'D'][i] || '?'; }
