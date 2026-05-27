"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.correctTranslation = correctTranslation;
exports.correctWriting = correctWriting;
exports.teachSentence = teachSentence;
exports.lookupWord = lookupWord;
exports.aiTranslateWord = aiTranslateWord;
exports.aiFullDict = aiFullDict;
exports.correctParagraph = correctParagraph;
exports.generateSentence = generateSentence;
exports.parseSentences = parseSentences;
exports.translateText = translateText;
exports.translateTextBatch = translateTextBatch;
exports.checkHealth = checkHealth;
// 部署到公网后改成你的 Railway 地址：
// wx.setStorageSync('api_base', 'https://cet4or6-app-production.up.railway.app')
const API_BASE = (() => { try {
    return wx.getStorageSync('api_base') || 'https://cet4or6-app-production.up.railway.app';
}
catch (_) {
    return 'https://cet4or6-app-production.up.railway.app';
} })();
function request(url, data) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}${url}`,
            method: 'POST',
            data,
            header: { 'Content-Type': 'application/json' },
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res.data);
                }
                else {
                    reject(new Error(`服务器错误 ${res.statusCode}`));
                }
            },
            fail: (err) => {
                reject(new Error(`请求失败: ${err.errMsg}`));
            },
        });
    });
}
function correctTranslation(chinese, userAnswer) {
    return request('/correct_translation', { chinese, userAnswer });
}
function correctWriting(prompt, userAnswer) {
    return request('/correct_writing', { prompt, userAnswer });
}
function teachSentence(pattern, userSentence) {
    return request('/teach_sentence', { pattern, userSentence });
}
function lookupWord(word) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/dictionary?word=${encodeURIComponent(word)}`,
            method: 'GET',
            timeout: 8000,
            success: (res) => {
                if (res.statusCode === 200)
                    resolve(res.data);
                else
                    reject(new Error(`查询失败 ${res.statusCode}`));
            },
            fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
        });
    });
}
function aiTranslateWord(word) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/dictionary/ai?word=${encodeURIComponent(word)}`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200)
                    resolve(res.data);
                else
                    reject(new Error(`翻译失败 ${res.statusCode}`));
            },
            fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
        });
    });
}
function aiFullDict(word) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/dictionary/ai?word=${encodeURIComponent(word)}&full=true`,
            method: 'GET',
            success: (res) => {
                if (res.statusCode === 200)
                    resolve(res.data);
                else
                    reject(new Error(`AI词典失败 ${res.statusCode}`));
            },
            fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
        });
    });
}
function correctParagraph(prompt, userAnswer) {
    return request('/correct_paragraph', { prompt, userAnswer });
}
function generateSentence(params) {
    return request('/generate_sentence', params);
}
function parseSentences(text) {
    return request('/parse_sentences', { text });
}
function translateText(text) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/translate?text=${encodeURIComponent(text)}`,
            method: 'GET',
            success: (res) => { if (res.statusCode === 200)
                resolve(res.data);
            else
                reject(new Error(`翻译失败 ${res.statusCode}`)); },
            fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
        });
    });
}
function translateTextBatch(texts) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/translate_batch`,
            method: 'POST',
            data: { texts },
            header: { 'Content-Type': 'application/json' },
            success: (res) => { if (res.statusCode === 200)
                resolve(res.data);
            else
                reject(new Error(`批量翻译失败 ${res.statusCode}`)); },
            fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
        });
    });
}
function checkHealth() {
    return new Promise((resolve, reject) => {
        wx.request({
            url: `${API_BASE}/health`,
            method: 'GET',
            timeout: 2000,
            success: (res) => {
                if (res.statusCode === 200)
                    resolve(res.data);
                else
                    reject(new Error(`health check failed: ${res.statusCode}`));
            },
            fail: (err) => reject(err),
        });
    });
}
