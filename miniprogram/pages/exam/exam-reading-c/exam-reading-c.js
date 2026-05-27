"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const readings_1 = __importDefault(require("../../../data/readings"));
const reading_annotations_1 = __importDefault(require("../../reading/reading_annotations"));
const theme_1 = require("../../../utils/theme");
Page({
    data: {
        passage: null,
        currentQ: 0,
        _paraPages: [],
        _paraPageIdx: 0,
        _curParas: [],
        _touchParaX: 0,
        _submitted: false,
        showResult: false,
        _correctCount: 0,
        _totalCount: 0,
        _qResults: {},
        _resultItems: [],
        _scrollToResult: '',
        darkMode: false,
        touchX: 0,
    },
    onLoad(opts) {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        this.setData({ darkMode: (0, theme_1.getDarkMode)() });
        const id = Number(opts.id);
        const rData = readings_1.default;
        const p = rData.find((r) => r.id === id);
        if (!p)
            return;
        const app = getApp();
        const ans = app.globalData.studyData.readingAnswers[id] || {};
        const ca = ans.cAnswers || {};
        const choices = (p.questions || []).map((_, qi) => (p.choices && p.choices[qi]) ? p.choices[qi] : ['A', 'B', 'C', 'D']);
        const paras = splitIntoParas(p.passage || '');
        const paraPages = groupPages(paras, 2);
        let submitted = false, qResults = {}, resultItems = [], correctCount = 0;
        if (ans.submitted) {
            submitted = true;
            const correct = p.correctAnswers || {};
            const annot = reading_annotations_1.default[p.id];
            Object.keys(correct).forEach(k => {
                const qi = Number(k);
                const ua = ca[qi];
                const letter = correct[k];
                const isCorrect = ua ? (ua === letter || ua.startsWith(letter)) : false;
                if (isCorrect)
                    correctCount++;
                qResults[qi] = isCorrect ? 'ok' : 'ko';
                const allOpts = (p.choices && p.choices[qi] || []).map((ch) => ch);
                const correctIdx = allOpts.findIndex((ch) => ch.startsWith(letter));
                const userIdx = ua ? allOpts.findIndex((ch) => ch.startsWith(ua.slice(0, 1))) : -1;
                resultItems.push({ label: `Q${qi + 46}`, questionStem: (p.questions || [])[qi] || '', userAnswer: ua ? ua.slice(0, 1).toUpperCase() + ')' : '未选', correctAnswer: correct[k] + ')', isCorrect, allOptions: allOpts, correctOptionIndex: correctIdx, userOptionIndex: userIdx, locate: annot && annot.qLocate && annot.qLocate[String(qi)] || '', hint: annot && annot.qHint && annot.qHint[String(qi)] || '' });
            });
        }
        this.setData({ passage: Object.assign(Object.assign({}, p), { _ans: ans, _ca: ca, _choices: choices }), _paraPages: paraPages, _paraPageIdx: 0, _curParas: paraPages[0] || [], _submitted: submitted, showResult: false, _correctCount: correctCount, _totalCount: Object.keys(p.correctAnswers || {}).length, _qResults: qResults, _resultItems: resultItems });
    },
    onParaTouchStart(e) { this.data._touchParaX = e.touches[0].clientX; },
    onParaTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - this.data._touchParaX;
        const pp = this.data._paraPages;
        if (dx < -50 && this.data._paraPageIdx < pp.length - 1) {
            const idx = this.data._paraPageIdx + 1;
            this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] });
        }
        else if (dx > 50 && this.data._paraPageIdx > 0) {
            const idx = this.data._paraPageIdx - 1;
            this.setData({ _paraPageIdx: idx, _curParas: pp[idx] || [] });
        }
    },
    refresh(id) {
        const app = getApp();
        const ans = app.globalData.studyData.readingAnswers[id] || {};
        const p = Object.assign(Object.assign({}, this.data.passage), { _ans: ans, _ca: ans.cAnswers || {} });
        this.setData({ passage: p });
    },
    onSelect(e) {
        if (this.data._submitted)
            return;
        const qi = Number(e.currentTarget.dataset.qi);
        const val = e.currentTarget.dataset.val;
        const p = this.data.passage;
        if (!p)
            return;
        const app = getApp();
        let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] };
        const ca = Object.assign({}, (ans.cAnswers || {}));
        if (ca[qi] === val)
            delete ca[qi];
        else
            ca[qi] = val;
        ans = Object.assign(Object.assign({}, ans), { cAnswers: ca });
        app.globalData.studyData.readingAnswers[p.id] = ans;
        wx.setStorageSync('studyData', app.globalData.studyData);
        this.refresh(p.id);
    },
    onTouchStart(e) { this.data.touchX = e.touches[0].clientX; },
    onTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - this.data.touchX;
        const p = this.data.passage;
        if (!p)
            return;
        if (dx < -50 && this.data.currentQ < (p._choices && p._choices.length || 1) - 1)
            this.setData({ currentQ: this.data.currentQ + 1 });
        else if (dx > 50 && this.data.currentQ > 0)
            this.setData({ currentQ: this.data.currentQ - 1 });
    },
    showResultAgain() { this.setData({ showResult: true }); },
    hideResult() { this.setData({ showResult: false }); },
    jumpToParagraph(e) {
        const loc = e.currentTarget.dataset.locate;
        const pIdx = parseInt(loc.replace(/[^0-9]/g, '')) - 1;
        let acc = 0;
        const target = this.data._paraPages.findIndex((page) => { acc += page.length; return acc > pIdx; });
        const pageIdx = Math.max(0, target < 0 ? this.data._paraPages.length - 1 : target);
        this.setData({ _paraPageIdx: pageIdx, _curParas: this.data._paraPages[pageIdx] || [] });
    },
    scrollToResultItem(e) {
        this.setData({ _scrollToResult: 'r-' + e.currentTarget.dataset.idx });
    },
    goBack() { wx.navigateBack(); },
});
function splitIntoParas(text) {
    const sents = text.match(/[^.!?]+[.!?]+/g) || [text];
    const paras = [];
    for (let i = 0; i < sents.length; i += 2)
        paras.push(sents.slice(i, i + 2).join('').trim());
    return paras.filter(Boolean);
}
function groupPages(items, maxPerPage) {
    const pages = [];
    for (let i = 0; i < items.length; i += maxPerPage)
        pages.push(items.slice(i, i + maxPerPage));
    return pages;
}
