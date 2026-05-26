"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const theme_1 = require("./utils/theme");
const defaults = {
    completedListens: [],
    masteredSentences: [],
    translationRecords: [],
    writingRecords: [],
    checkInDates: [],
    favoriteSentenceIds: [],
    hardSentences: [],
    readingAnswers: {},
    listeningAnswers: {},
    todayActivity: { date: '', listen: 0, sentence: 0, translation: 0, writing: 0, total: 0 },
    vocabWords: [],
    dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 }
};
App({
    globalData: {
        userInfo: undefined,
        darkMode: wx.getStorageSync('darkMode') || false,
        examDeadline: 0,
        examSet: '',
        studyData: (() => {
            const stored = wx.getStorageSync('studyData');
            return stored ? Object.assign(Object.assign(Object.assign({}, defaults), stored), { hardSentences: stored.hardSentences || [], readingAnswers: stored.readingAnswers || {} }) : Object.assign({}, defaults);
        })()
    },
    onLaunch() {
        const studyData = wx.getStorageSync('studyData');
        if (!studyData) {
            wx.setStorageSync('studyData', this.globalData.studyData);
        }
        if (this.globalData.darkMode) {
            (0, theme_1.applyTheme)(true);
        }
        // 首次启动显示引导页
        if (!wx.getStorageSync('hasGuided')) {
            wx.reLaunch({ url: '/pages/guide/guide' });
        }
    }
});
