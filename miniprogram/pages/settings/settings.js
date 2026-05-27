"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const theme_1 = require("../../utils/theme");
Page({
    data: {
        listen: 1,
        sentence: 5,
        translation: 1,
        writing: 1,
        darkMode: false,
        version: '1.0.0',
        cacheSize: '',
    },
    onLoad() {
        const app = getApp();
        const g = app.globalData.studyData.dailyGoal;
        this.setData({
            listen: g.listen, sentence: g.sentence, translation: g.translation, writing: g.writing,
            darkMode: (0, theme_1.getDarkMode)(),
            cacheSize: this.getCacheSize(),
        });
    },
    onShow() {
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
    },
    change(e) {
        const field = e.currentTarget.dataset.field;
        const delta = Number(e.currentTarget.dataset.delta);
        const key = field;
        const val = Math.max(0, this.data[key] + delta);
        const app = getApp();
        app.globalData.studyData.dailyGoal[key] = val;
        wx.setStorageSync('studyData', app.globalData.studyData);
        this.setData({ [key]: val });
    },
    toggleDark() {
        const newVal = (0, theme_1.toggleDarkMode)();
        this.setData({ darkMode: newVal });
        wx.showToast({ title: newVal ? '已切换暗黑模式' : '已切换浅色模式', icon: 'none' });
    },
    getCacheSize() {
        try {
            const info = wx.getStorageInfoSync();
            const kb = Math.round(info.currentSize);
            return kb > 1024 ? `${(kb / 1024).toFixed(1)}MB` : `${kb}KB`;
        }
        catch (_) {
            return '';
        }
    },
    clearCache() {
        wx.showModal({
            title: '清除缓存',
            content: '将清除所有学习记录和数据，此操作不可撤销。',
            confirmText: '确认清除',
            success: (res) => {
                if (res.confirm) {
                    try {
                        wx.clearStorageSync();
                    }
                    catch (_) { }
                    const app = getApp();
                    app.globalData.studyData = {
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
                        dailyGoal: { listen: 1, sentence: 5, translation: 1, writing: 1 },
                    };
                    wx.setStorageSync('studyData', app.globalData.studyData);
                    wx.setStorageSync('darkMode', false);
                    this.setData({ cacheSize: '0KB', listen: 1, sentence: 5, translation: 1, writing: 1, darkMode: false });
                    wx.showToast({ title: '已清除所有数据', icon: 'success' });
                }
            },
        });
    },
    goReminder() {
        wx.navigateTo({ url: '/pages/reminder/reminder' });
    },
    goFeedback() {
        wx.navigateTo({ url: '/pages/feedback/feedback' });
    },
    exportData() {
        const app = getApp();
        const json = JSON.stringify(app.globalData.studyData, null, 2);
        try {
            const fs = wx.getFileSystemManager();
            const fileName = `cet4_backup_${new Date().toISOString().slice(0, 10)}.txt`;
            const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
            fs.writeFileSync(filePath, json, 'utf-8');
            wx.shareFileMessage({ filePath, fileName });
            wx.showToast({ title: '发送备份到文件传输助手', icon: 'none' });
        }
        catch (e) {
            wx.setClipboardData({ data: json });
            wx.showToast({ title: '已复制到剪贴板', icon: 'success' });
        }
    },
    importData() {
        wx.chooseMessageFile({
            count: 1,
            type: 'file',
            success: (res) => {
                const file = res.tempFiles[0];
                if (!file.name.endsWith('.json')) {
                    wx.showToast({ title: '请选择 .json 文件', icon: 'none' });
                    return;
                }
                try {
                    const fs = wx.getFileSystemManager();
                    const content = fs.readFileSync(file.path, 'utf-8');
                    const data = JSON.parse(content);
                    const app = getApp();
                    app.globalData.studyData = Object.assign(Object.assign({}, app.globalData.studyData), data);
                    wx.setStorageSync('studyData', app.globalData.studyData);
                    wx.showToast({ title: '数据已恢复！', icon: 'success' });
                }
                catch (_) {
                    wx.showToast({ title: '文件格式错误', icon: 'none' });
                }
            },
        });
    },
});
