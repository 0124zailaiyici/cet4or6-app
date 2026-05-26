"use strict";
/**
 * Unified error handling for the app.
 * Displays a toast and optionally calls a callback.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.showApiError = showApiError;
exports.showNetworkError = showNetworkError;
function showApiError(err, fallbackMsg) {
    const msg = extractMessage(err) || fallbackMsg || '操作失败';
    wx.showToast({ title: msg.length > 20 ? msg.slice(0, 18) + '…' : msg, icon: 'none', duration: 2000 });
}
function showNetworkError(fallbackMsg) {
    const msg = fallbackMsg || '请确认 server 已启动';
    wx.showToast({ title: msg, icon: 'none', duration: 3000 });
}
function extractMessage(err) {
    if (!err)
        return null;
    if (typeof err === 'string')
        return err;
    if (err.errMsg) {
        const m = err.errMsg;
        if (m.includes('request:fail'))
            return '网络连接失败';
        if (m.includes('timeout'))
            return '请求超时';
        return m;
    }
    if (err.message)
        return err.message;
    if (err.error)
        return err.error;
    return null;
}
