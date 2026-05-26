"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTheme = applyTheme;
exports.getDarkMode = getDarkMode;
exports.toggleDarkMode = toggleDarkMode;
function applyTheme(dark) {
    if (dark) {
        wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#12121f' });
        wx.setBackgroundColor({ backgroundColor: '#12121f' });
        wx.setTabBarStyle({ color: '#a090b0', selectedColor: '#ff8fab', backgroundColor: '#1e1e38', borderStyle: 'black' });
    }
    else {
        wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#ffffff' });
        wx.setBackgroundColor({ backgroundColor: '#fff5f7' });
        wx.setTabBarStyle({ color: '#8a7a9a', selectedColor: '#ff6b8a', backgroundColor: '#ffffff', borderStyle: 'white' });
    }
}
function getDarkMode() {
    const app = getApp();
    return !!app.globalData.darkMode;
}
function toggleDarkMode() {
    const app = getApp();
    const newVal = !app.globalData.darkMode;
    app.globalData.darkMode = newVal;
    wx.setStorageSync('darkMode', newVal);
    applyTheme(newVal);
    return newVal;
}
