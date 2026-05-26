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
        activeStmt: -1,
        _paraPages: [],
        _paraPageIdx: 0,
        _curParas: [],
        _stmtPages: [],
        _stmtPageIdx: 0,
        _curStmts: [],
        _stmtMax: 1,
        _touchX: 0,
        _touchStmtX: 0,
        _submitted: false,
        showResult: false,
        _correctCount: 0,
        _totalCount: 0,
        _stmtResults: {},
        _letterResults: {},
        _resultItems: [],
        _availLetters: [],
        _scrollToResult: '',
        darkMode: false,
        letters: 'ABCDEFGHIJKLMN'.split(''),
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
        const paras = fmtBPassage(p.passage || '');
        const paraPages = splitBParas(paras);
        const stmtPages = splitBStmts(p.questions || []);
        let submitted = false, stmtResults = {}, letterResults = {}, resultItems = [], correctCount = 0;
        const ma = ans.matchAnswers || {};
        if (ans.submitted) {
            submitted = true;
            const ca = p.correctAnswers || {};
            const annot = reading_annotations_1.default[p.id];
            Object.keys(ca).forEach(k => {
                const qi = Number(k);
                const ua = ma[qi];
                const isCorrect = ua === ca[k];
                if (isCorrect)
                    correctCount++;
                stmtResults[qi] = isCorrect ? 'ok' : 'ko';
                const correctLetter = ca[k];
                if (!letterResults[correctLetter] || letterResults[correctLetter] === 'ok')
                    letterResults[correctLetter] = 'ok';
                if (ua && ua !== correctLetter)
                    letterResults[ua] = 'ko';
                resultItems.push({ label: `#${qi + 36}`, questionStem: (p.questions || [])[qi] || '', userAnswer: ua || '未选', correctAnswer: `第${correctLetter}段`, isCorrect, locate: annot && annot.qLocate && annot.qLocate[String(qi)] || '', hint: annot && annot.qHint && annot.qHint[String(qi)] || '' });
            });
        }
        const avail = this.data.letters.filter((l) => !Object.values(ma).includes(l));
        this.setData({
            passage: Object.assign(Object.assign({}, p), { _ans: ans, _ma: ma }),
            _paraPages: paraPages,
            _paraPageIdx: 0,
            _curParas: paraPages[0] || [],
            _stmtPages: stmtPages,
            _stmtPageIdx: 0,
            _curStmts: stmtPages[0] || [],
            _stmtMax: stmtPages.length,
            _submitted: submitted,
            showResult: false,
            _correctCount: correctCount,
            _totalCount: Object.keys(p.correctAnswers || {}).length,
            _stmtResults: stmtResults,
            _letterResults: letterResults,
            _resultItems: resultItems,
            _availLetters: avail,
        });
    },
    onTouchStart(e) { this.data._touchX = e.touches[0].clientX; },
    onTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - this.data._touchX;
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
    onStmtTouchStart(e) { this.data._touchStmtX = e.touches[0].clientX; },
    onStmtTouchEnd(e) {
        const dx = e.changedTouches[0].clientX - this.data._touchStmtX;
        const sp = this.data._stmtPages;
        if (dx < -50 && this.data._stmtPageIdx < sp.length - 1) {
            const idx = this.data._stmtPageIdx + 1;
            this.setData({ _stmtPageIdx: idx, _curStmts: sp[idx] || [] });
        }
        else if (dx > 50 && this.data._stmtPageIdx > 0) {
            const idx = this.data._stmtPageIdx - 1;
            this.setData({ _stmtPageIdx: idx, _curStmts: sp[idx] || [] });
        }
    },
    refresh(id) {
        const app = getApp();
        const ans = app.globalData.studyData.readingAnswers[id] || {};
        const p = Object.assign(Object.assign({}, this.data.passage), { _ans: ans, _ma: ans.matchAnswers || {} });
        this.setData({ passage: p });
    },
    onSelectStmt(e) {
        if (this.data._submitted)
            return;
        const qi = Number(e.currentTarget.dataset.qi);
        this.setData({ activeStmt: this.data.activeStmt === qi ? -1 : qi });
    },
    showResultAgain() { this.setData({ showResult: true }); },
    hideResult() { this.setData({ showResult: false }); },
    removeMatch(e) {
        if (this.data._submitted)
            return;
        const idx = Number(e.currentTarget.dataset.idx);
        const p = this.data.passage;
        if (!p)
            return;
        const app = getApp();
        let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] };
        const ma = Object.assign({}, (ans.matchAnswers || {}));
        delete ma[idx];
        const avail = this.data.letters.filter((l) => !Object.values(ma).includes(l));
        ans = Object.assign(Object.assign({}, ans), { matchAnswers: ma });
        app.globalData.studyData.readingAnswers[p.id] = ans;
        wx.setStorageSync('studyData', app.globalData.studyData);
        this.setData({ _availLetters: avail });
        this.refresh(p.id);
    },
    onMatchLetter(e) {
        if (this.data._submitted)
            return;
        const val = e.currentTarget.dataset.val;
        const qi = this.data.activeStmt;
        if (qi < 0) {
            wx.showToast({ title: '请先点选一条陈述', icon: 'none' });
            return;
        }
        const p = this.data.passage;
        if (!p)
            return;
        const app = getApp();
        let ans = app.globalData.studyData.readingAnswers[p.id] || { blankAnswers: {}, usedFlags: [] };
        const ma = Object.assign({}, (ans.matchAnswers || {}));
        if (ma[qi] === val) {
            delete ma[qi];
        }
        else {
            Object.keys(ma).forEach(k => { if (ma[Number(k)] === val)
                delete ma[Number(k)]; });
            ma[qi] = val;
        }
        const avail = this.data.letters.filter((l) => !Object.values(ma).includes(l));
        ans = Object.assign(Object.assign({}, ans), { matchAnswers: ma });
        app.globalData.studyData.readingAnswers[p.id] = ans;
        wx.setStorageSync('studyData', app.globalData.studyData);
        this.setData({ activeStmt: -1, _availLetters: avail });
        this.refresh(p.id);
    },
    jumpToParagraph(e) {
        const loc = e.currentTarget.dataset.locate;
        const letter = loc.replace(/[段\s]/g, '');
        const paras = this.data._paraPages;
        const target = paras.findIndex((page) => page.some((para) => para.letter === letter));
        if (target >= 0)
            this.setData({ _paraPageIdx: target, _curParas: paras[target] || [] });
    },
    scrollToResultItem(e) {
        this.setData({ _scrollToResult: 'r-' + e.currentTarget.dataset.idx });
    },
    goBack() { wx.navigateBack(); },
});
function fmtBPassage(text) {
    const parts = text.split(/(?=[A-N][)）])/g);
    return parts.filter(Boolean).map(p => {
        const m = p.match(/^([A-N][)）])/);
        return m ? { letter: m[1].replace(/[)）]/, ''), text: p.slice(m[0].length).trim() } : { letter: '', text: p.trim() };
    });
}
function splitBParas(paras) {
    const pages = [];
    for (let i = 0; i < paras.length; i += 2)
        pages.push(paras.slice(i, i + 2));
    return pages;
}
function splitBStmts(questions) {
    const items = questions.map((q, qi) => ({ qi, q }));
    const pages = [];
    for (let i = 0; i < items.length; i += 5)
        pages.push(items.slice(i, i + 5));
    return pages;
}
