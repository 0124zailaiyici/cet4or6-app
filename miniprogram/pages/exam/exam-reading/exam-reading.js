"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readings_1 = __importDefault(require("../../../data/readings"));
const theme_1 = require("../../../utils/theme");
Page({
    data: {
        passages: [],
        darkMode: false,
    },
    onLoad() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        const app = getApp();
        const rData = readings_1.default;
        const ids = (app.globalData.examSet === '2019062') ? rData.slice(4, 8).map((r) => r.id) : rData.slice(0, 4).map((r) => r.id);
        const passages = ids.map((id) => rData.find((r) => r.id === id)).filter(Boolean);
        this.setData({ passages });
    },
    select(e) {
        const id = e.currentTarget.dataset.id;
        const type = e.currentTarget.dataset.type;
        const map = { A: 'exam-reading-a', B: 'exam-reading-b', C: 'exam-reading-c' };
        const page = map[type];
        if (page)
            wx.navigateTo({ url: `/pages/exam/${page}/${page}?id=${id}` });
    },
    goBack() { wx.navigateBack(); },
});
