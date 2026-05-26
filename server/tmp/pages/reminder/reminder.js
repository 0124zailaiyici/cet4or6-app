"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const theme_1 = require("../../utils/theme");
Page({
    data: {
        morningTime: '7:30',
        eveningTime: '21:00',
        morningTimes: ['7:00', '7:30', '8:00', '8:30'],
        eveningTimes: ['19:00', '20:00', '21:00', '22:00'],
        morningSub: false,
        eveningSub: false,
        weeklySub: false,
        darkMode: false,
    },
    onShow() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
    },
    toggleMorning() {
        if (!this.data.morningSub) {
            wx.showToast({ title: '已订阅晨间提醒', icon: 'success' });
        }
        this.setData({ morningSub: !this.data.morningSub });
    },
    toggleEvening() {
        if (!this.data.eveningSub) {
            wx.showToast({ title: '已订阅晚间提醒', icon: 'success' });
        }
        this.setData({ eveningSub: !this.data.eveningSub });
    },
    toggleWeekly() {
        if (!this.data.weeklySub) {
            wx.showToast({ title: '已订阅学习周报', icon: 'success' });
        }
        this.setData({ weeklySub: !this.data.weeklySub });
    },
    setMorningTime(e) {
        this.setData({ morningTime: e.currentTarget.dataset.time });
        wx.showToast({ title: '已设为 ' + e.currentTarget.dataset.time, icon: 'none' });
    },
    setEveningTime(e) {
        this.setData({ eveningTime: e.currentTarget.dataset.time });
        wx.showToast({ title: '已设为 ' + e.currentTarget.dataset.time, icon: 'none' });
    },
});
