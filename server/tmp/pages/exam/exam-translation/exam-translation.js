"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const translations_1 = __importDefault(require("../../../data/translations"));
const theme_1 = require("../../../utils/theme");
Page({
    data: {
        item: null,
        answer: '',
        darkMode: false,
    },
    onLoad() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        const translations = translations_1.default.filter((t) => t && t.chinese);
        const item = translations.find((t) => t.source && t.source.includes('真题')) || translations[0] || null;
        const saved = (getApp().globalData.studyData.translationAnswers || {})[item && item.id || 0] || '';
        this.setData({ item, answer: saved });
    },
    onInput(e) {
        this.setData({ answer: e.detail.value });
    },
    save() {
        if (!this.data.answer.trim()) {
            wx.showToast({ title: '请先翻译', icon: 'none' });
            return;
        }
        const app = getApp();
        const sd = app.globalData.studyData;
        if (!sd.translationAnswers)
            sd.translationAnswers = {};
        sd.translationAnswers[this.data.item && this.data.item.id || 0] = this.data.answer;
        wx.setStorageSync('studyData', sd);
        wx.showToast({ title: '已保存', icon: 'success' });
        wx.navigateBack();
    },
    goBack() { wx.navigateBack(); },
});
