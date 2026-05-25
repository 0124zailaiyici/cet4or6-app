/**
 * Unified error handling for the app.
 * Displays a toast and optionally calls a callback.
 */

export function showApiError(err: any, fallbackMsg?: string) {
  const msg = extractMessage(err) || fallbackMsg || '操作失败'
  wx.showToast({ title: msg.length > 20 ? msg.slice(0, 18) + '…' : msg, icon: 'none', duration: 2000 })
}

export function showNetworkError(fallbackMsg?: string) {
  const msg = fallbackMsg || '请确认 server 已启动'
  wx.showToast({ title: msg, icon: 'none', duration: 3000 })
}

function extractMessage(err: any): string | null {
  if (!err) return null
  if (typeof err === 'string') return err
  if (err.errMsg) {
    const m = err.errMsg
    if (m.includes('request:fail')) return '网络连接失败'
    if (m.includes('timeout')) return '请求超时'
    return m
  }
  if (err.message) return err.message
  if (err.error) return err.error
  return null
}
