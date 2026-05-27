"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const writings_1 = __importDefault(require("../../../data/writings"));
const theme_1 = require("../../../utils/theme");
Page({
    data: {
        prompt: null,
        answer: '',
        darkMode: false,
    },
    onLoad() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        const writings = writings_1.default;
        const prompt = writings[0] || null;
        const saved = (getApp().globalData.studyData.writingAnswers || {})[prompt && prompt.id || 0] || '';
        this.setData({ prompt, answer: saved });
    },
    onInput(e) {
        this.setData({ answer: e.detail.value });
    },
    save() {
        if (!this.data.answer.trim()) {
            wx.showToast({ title: '请先写内容', icon: 'none' });
            return;
        }
        const app = getApp();
        const sd = app.globalData.studyData;
        if (!sd.writingAnswers)
            sd.writingAnswers = {};
        sd.writingAnswers[this.data.prompt && this.data.prompt.id || 0] = this.data.answer;
        wx.setStorageSync('studyData', sd);
        wx.showToast({ title: '已保存', icon: 'success' });
        wx.navigateBack();
    },
    goBack() { wx.navigateBack(); },
});
