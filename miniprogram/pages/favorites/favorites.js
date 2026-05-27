"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sentences_1 = __importDefault(require("../../data/sentences"));
const theme_1 = require("../../utils/theme");
Page({
    data: {
        tab: 0,
        tabs: ['⭐ 收藏句子', '❗ 难句记录'],
        favSentences: [],
        hardListens: [],
        scrollTop: 0,
        darkMode: false,
    },
    onShow() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        const app = getApp();
        this.setData({ darkMode: app.globalData.darkMode });
        this.refresh();
    },
    refresh() {
        const app = getApp();
        const all = sentences_1.default;
        const favIds = app.globalData.studyData.favoriteSentenceIds;
        const idSet = new Set(favIds);
        const masteredIds = app.globalData.studyData.masteredSentences || [];
        const masteredSet = new Set(masteredIds);
        const favSentences = all
            .filter(s => idSet.has(s.id))
            .reverse()
            .map(s => (Object.assign(Object.assign({}, s), { mastered: masteredSet.has(s.id) })));
        this.setData({
            favSentences,
            hardListens: app.globalData.studyData.hardSentences || [],
        });
    },
    removeHard(e) {
        const idx = e.currentTarget.dataset.index;
        const app = getApp();
        const h = app.globalData.studyData.hardSentences;
        if (!h || idx < 0 || idx >= h.length)
            return;
        wx.showModal({
            title: '移除难句',
            content: '确定移除此难句记录吗？',
            success: (res) => {
                if (res.confirm) {
                    h.splice(idx, 1);
                    wx.setStorageSync('studyData', app.globalData.studyData);
                    this.refresh();
                    wx.showToast({ title: '已移除难句', icon: 'none' });
                }
            }
        });
    },
    onSwitchTab(e) {
        const tab = e.currentTarget.dataset.tab;
        this.setData({ tab, scrollTop: 0 });
    },
    removeFavorite(e) {
        const id = e.currentTarget.dataset.id;
        const app = getApp();
        const ids = app.globalData.studyData.favoriteSentenceIds;
        wx.showModal({
            title: '取消收藏',
            content: '确定取消收藏这个句子吗？',
            success: (res) => {
                if (res.confirm) {
                    const idx = ids.indexOf(id);
                    if (idx !== -1)
                        ids.splice(idx, 1);
                    wx.setStorageSync('studyData', app.globalData.studyData);
                    this.refresh();
                    wx.showToast({ title: '已取消收藏', icon: 'none' });
                }
            }
        });
    },
    gotoSentence(e) {
        const id = e.currentTarget.dataset.id;
        wx.navigateTo({ url: `/pages/sentences/sentences?id=${id}` });
    },
    goToListening(e) {
        const passageId = e.currentTarget.dataset.passageid;
        wx.navigateTo({ url: `/pages/listening/listening?passageId=${passageId}` });
    },
});
