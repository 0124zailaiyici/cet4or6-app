"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const checkin_1 = require("../../utils/checkin");
const theme_1 = require("../../utils/theme");
const readings_1 = __importDefault(require("../../data/readings"));
Page({
    data: {
        greeting: '',
        checkedIn: false,
        streak: 0,
        favoriteCount: 0,
        readingCount: 0,
        todayStats: { listened: 0, sentences: 0, translations: 0, writings: 0 },
        goalStats: { listenPct: 0, sentencePct: 0, translationPct: 0, writingPct: 0, overallPct: 0 },
        darkMode: false,
    },
    onLoad() {
        this.refresh();
    },
    onShow() {
        this.refresh();
    },
    refresh() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        const hour = new Date().getHours();
        let greeting = '晚上好 🌙';
        if (hour < 12)
            greeting = '早上好 🌤';
        else if (hour < 18)
            greeting = '下午好 ☀️';
        const app = getApp();
        const sd = app.globalData.studyData;
        const goal = sd.dailyGoal;
        const today = (0, checkin_1.getTodayActivity)();
        // Show today's activity counts
        this.setData({
            greeting,
            checkedIn: (0, checkin_1.isCheckedInToday)(),
            streak: (0, checkin_1.calcStreak)(sd.checkInDates),
            favoriteCount: sd.favoriteSentenceIds.length,
            readingCount: readings_1.default.length,
            todayStats: { listened: today.listen, sentences: today.sentence, translations: today.translation, writings: today.writing },
            goalStats: {
                listenPct: goal.listen > 0 ? Math.min(100, Math.round(today.listen / goal.listen * 100)) : 0,
                sentencePct: goal.sentence > 0 ? Math.min(100, Math.round(today.sentence / goal.sentence * 100)) : 0,
                translationPct: goal.translation > 0 ? Math.min(100, Math.round(today.translation / goal.translation * 100)) : 0,
                writingPct: goal.writing > 0 ? Math.min(100, Math.round(today.writing / goal.writing * 100)) : 0,
                overallPct: goal.listen + goal.sentence + goal.translation + goal.writing > 0
                    ? Math.min(100, Math.round(today.total / (goal.listen + goal.sentence + goal.translation + goal.writing) * 100)) : 0,
            },
            darkMode: (0, theme_1.getDarkMode)(),
        });
    },
    goTo(e) {
        const url = e.currentTarget.dataset.url;
        if (url.includes('vocab') || url.includes('settings') || url.includes('profile') || url.includes('statistics')) {
            wx.switchTab({ url });
        }
        else {
            wx.navigateTo({ url });
        }
    },
    handleCheckIn() {
        const streak = (0, checkin_1.doCheckIn)('daily');
        this.setData({ checkedIn: true, streak });
        wx.showToast({ title: `打卡成功！连续 ${streak} 天`, icon: 'success' });
    },
});
