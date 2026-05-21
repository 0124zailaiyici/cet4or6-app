export function applyTheme(dark: boolean) {
  if (dark) {
    wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#12121f' })
    wx.setBackgroundColor({ backgroundColor: '#12121f' })
  } else {
    wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#ffffff' })
    wx.setBackgroundColor({ backgroundColor: '#fff5f7' })
  }
}

export function getDarkMode(): boolean {
  const app = getApp<IAppOption>()
  return !!app.globalData.darkMode
}

export function toggleDarkMode(): boolean {
  const app = getApp<IAppOption>()
  const newVal = !app.globalData.darkMode
  app.globalData.darkMode = newVal
  wx.setStorageSync('darkMode', newVal)
  applyTheme(newVal)
  return newVal
}
