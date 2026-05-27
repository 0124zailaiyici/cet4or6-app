"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sentences_1 = __importDefault(require("../../data/sentences"));
const theme_1 = require("../../utils/theme");
const checkin_1 = require("../../utils/checkin");
const api_1 = require("../../utils/api");
Page({
    data: {
        allSentences: [],
        filteredSentences: [],
        topics: [],
        topicCounts: {},
        currentTopic: '全部',
        masteredIds: [],
        favoriteIds: [],
        searchQuery: '',
        darkMode: false,
        viewMode: 'list',
        immersionIndex: 0,
        scrollHeight: 600,
        showGenModal: false,
        genInput: '',
        genType: 'word',
        genCount: 3,
        generating: false,
        showPasteModal: false,
        pasteText: '',
        parsing: false,
        favTexts: [],
        masterTexts: [],
        favStatus: [],
        masterStatus: [],
        immFavStatus: false,
        immMasterStatus: false,
        puzzleWords: [],
        puzzleSelected: [],
        puzzleAnswers: [],
        puzzleWordUsed: [],
        puzzleScore: 0,
        puzzleCombo: 0,
        puzzleIndex: 0,
        puzzleTotal: 0,
        puzzleFinished: false,
        puzzleStars: 0,
        puzzleErrors: 0,
        puzzleRevealed: false,
        puzzleSkipped: false,
        puzzleDone: false,
        puzzleHintIndices: [],
        puzzleInitialSelected: [],
        puzzleSentences: [],
    },
    onLoad(options) {
        const app = getApp();
        this.setData({ darkMode: app.globalData.darkMode });
        let scrollH = 400;
        try {
            const sys = wx.getWindowInfo();
            const px = sys.windowWidth / 750;
            scrollH = Math.floor(sys.windowHeight - 310 * px - 80 * px - 90 * px - (sys.statusBarHeight || 20) - 10);
            if (scrollH < 200)
                scrollH = 400;
        }
        catch (_) { }
        this.setData({ scrollHeight: scrollH });
        const sentences = sentences_1.default;
        const topics = [...new Set(sentences.map(s => s.topic))];
        topics.unshift('全部');
        const topicCounts = {};
        sentences.forEach(s => {
            topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
        });
        topics.push('已掌握', '未掌握');
        topicCounts['已掌握'] = 0;
        topicCounts['未掌握'] = sentences.length;
        this.setData({
            allSentences: sentences,
            filteredSentences: sentences,
            topics,
            topicCounts,
            masteredIds: app.globalData.studyData.masteredSentences || [],
            favoriteIds: app.globalData.studyData.favoriteSentenceIds || [],
            favTexts: sentences.map(s => (app.globalData.studyData.favoriteSentenceIds || []).indexOf(s.id) >= 0 ? '已收藏' : '收藏'),
            masterTexts: sentences.map(s => (app.globalData.studyData.masteredSentences || []).indexOf(s.id) >= 0 ? '已掌握' : '掌握'),
            favStatus: sentences.map(s => (app.globalData.studyData.favoriteSentenceIds || []).indexOf(s.id) >= 0),
            masterStatus: sentences.map(s => (app.globalData.studyData.masteredSentences || []).indexOf(s.id) >= 0),
        });
        if (options.id) {
            const idx = sentences.findIndex(s => s.id === Number(options.id));
            if (idx >= 0) {
                this.setData({ viewMode: 'immersion', immersionIndex: idx });
            }
        }
    },
    onShow() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        const app = getApp();
        this.setData({ darkMode: app.globalData.darkMode });
        this.doFilter();
    },
    doFilter() {
        const q = this.data.searchQuery.toLowerCase().trim();
        const masteredSet = new Set(this.data.masteredIds);
        const favSet = new Set(this.data.favoriteIds);
        let filtered = this.data.allSentences;
        if (this.data.currentTopic === '已掌握') {
            filtered = filtered.filter(s => masteredSet.has(s.id));
        }
        else if (this.data.currentTopic === '未掌握') {
            filtered = filtered.filter(s => !masteredSet.has(s.id));
        }
        else if (this.data.currentTopic !== '全部') {
            filtered = filtered.filter(s => s.topic === this.data.currentTopic);
        }
        if (q) {
            filtered = filtered.filter(s => s.english.toLowerCase().indexOf(q) !== -1 ||
                s.chinese.indexOf(q) !== -1 ||
                s.keywords.some(k => k.toLowerCase().indexOf(q) !== -1));
        }
        const favTexts = filtered.map(s => favSet.has(s.id) ? '已收藏' : '收藏');
        const masterTexts = filtered.map(s => masteredSet.has(s.id) ? '已掌握' : '掌握');
        const favStatus = filtered.map(s => favSet.has(s.id));
        const masterStatus = filtered.map(s => masteredSet.has(s.id));
        this.setData({ filteredSentences: filtered, favTexts, masterTexts, favStatus, masterStatus });
    },
    onSearchInput(e) {
        this.setData({ searchQuery: e.detail.value });
        this.doFilter();
    },
    clearSearch() {
        this.setData({ searchQuery: '' });
        this.doFilter();
    },
    filterByTopic(e) {
        const topic = e.currentTarget.dataset.topic;
        this.setData({ currentTopic: topic });
        this.doFilter();
    },
    toggleMaster(e) {
        const id = e.currentTarget.dataset.id;
        const idNum = Number(id);
        const before = this.data.masteredIds;
        const mastered = new Set(before);
        if (mastered.has(idNum))
            mastered.delete(idNum);
        else
            mastered.add(idNum);
        const masteredArr = [...mastered];
        const masteredSet = new Set(masteredArr);
        const masterTexts = this.data.filteredSentences.map(s => masteredSet.has(s.id) ? '已掌握' : '掌握');
        const masterStatus = this.data.filteredSentences.map(s => masteredSet.has(s.id));
        const immIdx = this.data.immersionIndex;
        const immMasterStatus = this.data.filteredSentences.length > immIdx ? masteredSet.has(this.data.filteredSentences[immIdx].id) : false;
        this.setData({
            masteredIds: masteredArr,
            masterTexts,
            masterStatus,
            immMasterStatus,
            topicCounts: Object.assign(Object.assign({}, this.data.topicCounts), { '已掌握': masteredArr.length, '未掌握': this.data.allSentences.length - masteredArr.length }),
            filteredSentences: this.data.filteredSentences.slice(),
        });
        this.doFilter();
        const app = getApp();
        app.globalData.studyData.masteredSentences = masteredArr;
        wx.setStorageSync('studyData', app.globalData.studyData);
        (0, checkin_1.doCheckIn)('sentence');
    },
    toggleFavorite(e) {
        const id = e.currentTarget.dataset.id;
        const idNum = Number(id);
        const before = this.data.favoriteIds;
        const fav = new Set(before);
        if (fav.has(idNum))
            fav.delete(idNum);
        else
            fav.add(idNum);
        const favArr = [...fav];
        const favSet = new Set(favArr);
        const favTexts = this.data.filteredSentences.map(s => favSet.has(s.id) ? '已收藏' : '收藏');
        const favStatus = this.data.filteredSentences.map(s => favSet.has(s.id));
        const immIdx = this.data.immersionIndex;
        const immFavStatus = this.data.filteredSentences.length > immIdx ? favSet.has(this.data.filteredSentences[immIdx].id) : false;
        this.setData({ favoriteIds: favArr, favTexts, favStatus, immFavStatus, filteredSentences: this.data.filteredSentences.slice() });
        const app = getApp();
        app.globalData.studyData.favoriteSentenceIds = favArr;
        wx.setStorageSync('studyData', app.globalData.studyData);
    },
    goDict() {
        wx.navigateTo({ url: '/pages/dictionary/dictionary' });
    },
    noop() { },
    switchMode(e) {
        const mode = e.currentTarget.dataset.mode;
        this.setData({ viewMode: mode, immersionIndex: 0 });
        if (mode === 'puzzle') {
            this.startPuzzle();
        }
    },
    prevSentence() {
        if (this.data.immersionIndex > 0) {
            const idx = this.data.immersionIndex - 1;
            const s = this.data.filteredSentences[idx];
            this.setData({
                immersionIndex: idx,
                immFavStatus: this.data.favoriteIds.indexOf(s.id) >= 0,
                immMasterStatus: this.data.masteredIds.indexOf(s.id) >= 0,
            });
        }
    },
    nextSentence() {
        const max = this.data.filteredSentences.length - 1;
        if (this.data.immersionIndex < max) {
            const idx = this.data.immersionIndex + 1;
            const s = this.data.filteredSentences[idx];
            this.setData({
                immersionIndex: idx,
                immFavStatus: this.data.favoriteIds.indexOf(s.id) >= 0,
                immMasterStatus: this.data.masteredIds.indexOf(s.id) >= 0,
            });
        }
    },
    startPuzzle() {
        const sentences = this.data.filteredSentences.filter(s => !s.english.includes('"') && s.english.split(' ').length >= 3 && s.english.split(' ').length <= 12);
        if (sentences.length === 0) {
            wx.showToast({ title: '没有适合拼图的句子', icon: 'none' });
            this.setData({ viewMode: 'list' });
            return;
        }
        this.setData({
            puzzleTotal: Math.min(sentences.length, 8),
            puzzleIndex: 0,
            puzzleScore: 0,
            puzzleCombo: 0,
            puzzleFinished: false,
            puzzleStars: 0,
            puzzleErrors: 0,
            puzzleRevealed: false,
            puzzleSkipped: false,
            puzzleHintIndices: [],
            puzzleInitialSelected: [],
            puzzleSentences: sentences,
        });
        this.loadPuzzleSentence(sentences);
    },
    loadPuzzleSentence(sentences) {
        const idx = this.data.puzzleIndex;
        if (idx >= sentences.length || idx >= this.data.puzzleTotal) {
            this.finishPuzzle();
            return;
        }
        const s = sentences[idx];
        const words = s.english.replace(/[.,!?;:'"]/g, '').split(/\s+/).filter(w => w.length > 0);
        const shuffled = words.map((w, i) => ({ w, i })).sort(() => Math.random() - 0.5).map(x => x.i);
        // Auto-place keywords as hints based on sentence length
        // Match multi-word keyword phrases against sentence words
        const keyOrigIndices = [];
        for (const kw of (s.keywords || [])) {
            const kwWords = kw.toLowerCase().replace(/[!?;:'"]/g, '')
                .split(/\.\.\.+|\s+/).map(w => w.replace(/[.,]/g, '')).filter(w => w.length > 0);
            if (kwWords.length === 0)
                continue;
            let found = false;
            // Step 1: exact phrase match (consecutive words)
            for (let i = 0; i <= words.length - kwWords.length; i++) {
                let match = true;
                for (let j = 0; j < kwWords.length; j++) {
                    if (words[i + j].toLowerCase() !== kwWords[j]) {
                        match = false;
                        break;
                    }
                }
                if (match) {
                    for (let j = 0; j < kwWords.length; j++) {
                        if (keyOrigIndices.indexOf(i + j) < 0)
                            keyOrigIndices.push(i + j);
                    }
                    found = true;
                    break;
                }
            }
            // Step 2: individual word matching (handles inflected forms like "learning" vs "learn")
            if (!found) {
                for (const kww of kwWords) {
                    if (kww.length <= 2)
                        continue;
                    const idx = words.findIndex(w => w.toLowerCase() === kww || w.toLowerCase().startsWith(kww));
                    if (idx >= 0 && keyOrigIndices.indexOf(idx) < 0)
                        keyOrigIndices.push(idx);
                }
            }
        }
        keyOrigIndices.sort((a, b) => a - b);
        let autoCount = 0;
        const wlen = words.length;
        if (wlen <= 4)
            autoCount = Math.min(1, keyOrigIndices.length);
        else if (wlen <= 6)
            autoCount = Math.min(2, keyOrigIndices.length);
        else if (wlen <= 8)
            autoCount = Math.min(3, keyOrigIndices.length);
        else
            autoCount = Math.min(4, keyOrigIndices.length);
        const selected = new Array(words.length).fill(null);
        const used = shuffled.map(() => false);
        const hintIndices = [];
        for (let k = 0; k < autoCount; k++) {
            const origIdx = keyOrigIndices[k];
            const pwIdx = shuffled.indexOf(origIdx);
            selected[origIdx] = pwIdx;
            used[pwIdx] = true;
            hintIndices.push(pwIdx);
        }
        this.setData({
            puzzleWords: shuffled.map(i => words[i]),
            puzzleAnswers: words.map((_, j) => shuffled.indexOf(j)),
            puzzleSelected: selected,
            puzzleWordUsed: used,
            puzzleFinished: false,
            puzzleErrors: 0,
            puzzleRevealed: false,
            puzzleSkipped: false,
            puzzleHintIndices: hintIndices,
            puzzleInitialSelected: [...selected],
        });
    },
    tapPuzzleWord(e) {
        if (this.data.puzzleFinished)
            return;
        const wi = Number(e.currentTarget.dataset.wi);
        const used = this.data.puzzleWordUsed;
        if (used[wi])
            return;
        const selected = [...this.data.puzzleSelected];
        const emptyIdx = selected.indexOf(null);
        if (emptyIdx < 0)
            return;
        selected[emptyIdx] = wi;
        used[wi] = true;
        this.setData({ puzzleSelected: selected, puzzleWordUsed: used });
        if (selected.indexOf(null) < 0) {
            this.checkPuzzleAnswer();
        }
    },
    untapPuzzleWord(e) {
        if (this.data.puzzleFinished)
            return;
        const pos = Number(e.currentTarget.dataset.pos);
        const selected = [...this.data.puzzleSelected];
        const wi = selected[pos];
        if (wi === null)
            return;
        if (this.data.puzzleHintIndices.indexOf(wi) >= 0)
            return;
        const used = [...this.data.puzzleWordUsed];
        selected[pos] = null;
        used[wi] = false;
        this.setData({ puzzleSelected: selected, puzzleWordUsed: used });
    },
    checkPuzzleAnswer() {
        const selected = this.data.puzzleSelected;
        const answers = this.data.puzzleAnswers;
        const sentences = this.data.puzzleSentences;
        let allCorrect = true;
        for (let i = 0; i < answers.length; i++) {
            if (selected[i] !== answers[i]) {
                allCorrect = false;
                break;
            }
        }
        if (allCorrect) {
            const combo = this.data.puzzleCombo + 1;
            const bonus = combo > 1 ? combo * 5 : 0;
            const score = this.data.puzzleScore + 10 + bonus;
            this.setData({
                puzzleCombo: combo,
                puzzleScore: score,
                puzzleFinished: true,
            });
            wx.showToast({ title: `✓ 正确！+${10 + bonus}分`, icon: 'none', duration: 1000 });
            setTimeout(() => {
                this.setData({
                    puzzleIndex: this.data.puzzleIndex + 1,
                    puzzleFinished: false,
                });
                this.loadPuzzleSentence(sentences);
            }, 1200);
        }
        else {
            const errors = this.data.puzzleErrors + 1;
            const init = this.data.puzzleInitialSelected;
            const used = [...this.data.puzzleWordUsed];
            // Reset to initial state (keep auto-placed keywords)
            for (let i = 0; i < init.length; i++) {
                if (selected[i] !== null && (init[i] === null || selected[i] !== init[i])) {
                    used[selected[i]] = false;
                }
            }
            this.setData({
                puzzleCombo: 0,
                puzzleErrors: errors,
                puzzleFinished: true,
                puzzleSelected: [...init],
                puzzleWordUsed: used,
            });
            wx.showToast({ title: '✗ 顺序不对，再试试', icon: 'none', duration: 1000 });
            setTimeout(() => {
                this.setData({ puzzleFinished: false });
            }, 800);
        }
    },
    finishPuzzle() {
        const total = this.data.puzzleTotal;
        const maxScore = total * 50 + 100;
        const ratio = this.data.puzzleScore / maxScore;
        let stars = 0;
        if (ratio >= 0.8)
            stars = 3;
        else if (ratio >= 0.5)
            stars = 2;
        else if (ratio > 0)
            stars = 1;
        this.setData({ puzzleDone: true, puzzleFinished: true, puzzleStars: stars });
    },
    restartPuzzle() {
        this.setData({ puzzleScore: 0, puzzleCombo: 0, puzzleIndex: 0, puzzleFinished: false, puzzleStars: 0, puzzleDone: false });
        this.startPuzzle();
    },
    showAnswer() {
        if (this.data.puzzleRevealed)
            return;
        const answers = this.data.puzzleAnswers;
        const allUsed = new Array(this.data.puzzleWords.length).fill(true);
        this.setData({
            puzzleSelected: answers,
            puzzleWordUsed: allUsed,
            puzzleRevealed: true,
            puzzleFinished: true,
            puzzleHintIndices: answers,
            puzzleCombo: 0,
        });
        wx.showToast({ title: '👁 正确答案如上', icon: 'none', duration: 1500 });
        setTimeout(() => {
            const list = this.data.puzzleSentences;
            const next = this.data.puzzleIndex + 1;
            if (next >= list.length || next >= this.data.puzzleTotal) {
                this.finishPuzzle();
            }
            else {
                this.setData({ puzzleIndex: next, puzzleFinished: false });
                this.loadPuzzleSentence(list);
            }
        }, 1800);
    },
    skipSentence() {
        if (this.data.puzzleSkipped)
            return;
        this.setData({ puzzleSkipped: true, puzzleFinished: true, puzzleCombo: 0 });
        wx.showToast({ title: '⏭ 已跳过，进入下一题', icon: 'none', duration: 1500 });
        setTimeout(() => {
            const list = this.data.puzzleSentences;
            const next = this.data.puzzleIndex + 1;
            if (next >= list.length || next >= this.data.puzzleTotal) {
                this.finishPuzzle();
            }
            else {
                this.setData({ puzzleIndex: next, puzzleFinished: false, puzzleSkipped: false });
                this.loadPuzzleSentence(list);
            }
        }, 1600);
    },
    openGenModal() {
        this.setData({ showGenModal: true, genInput: '' });
    },
    closeGenModal() {
        this.setData({ showGenModal: false });
    },
    onGenInput(e) {
        this.setData({ genInput: e.detail.value });
    },
    setGenType(e) {
        this.setData({ genType: e.currentTarget.dataset.type });
    },
    adjustGenCount(e) {
        const delta = parseInt(e.currentTarget.dataset.delta, 10);
        const next = this.data.genCount + delta;
        if (next >= 1 && next <= 5) {
            this.setData({ genCount: next });
        }
    },
    doGenerate() {
        return __awaiter(this, void 0, void 0, function* () {
            const input = this.data.genInput.trim();
            if (!input) {
                wx.showToast({ title: '请输入单词或话题', icon: 'none' });
                return;
            }
            this.setData({ generating: true });
            try {
                const params = {
                    count: this.data.genCount,
                };
                if (this.data.genType === 'word') {
                    params.word = input;
                }
                else {
                    params.topic = input;
                }
                const results = yield (0, api_1.generateSentence)(params);
                const maxId = Math.max(0, ...this.data.allSentences.map(s => s.id));
                const newSentences = results.map((item, i) => ({
                    id: maxId + i + 1,
                    english: item.english,
                    chinese: item.chinese,
                    keywords: item.keywords,
                    topic: item.topic,
                }));
                const allSentences = [...this.data.allSentences, ...newSentences];
                const topics = [...new Set(allSentences.map(s => s.topic))];
                topics.unshift('全部');
                topics.push('已掌握', '未掌握');
                const topicCounts = {};
                allSentences.forEach(s => {
                    topicCounts[s.topic] = (topicCounts[s.topic] || 0) + 1;
                });
                topicCounts['已掌握'] = this.data.masteredIds.length;
                topicCounts['未掌握'] = allSentences.length - this.data.masteredIds.length;
                const favTexts = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0 ? '已收藏' : '收藏');
                const masterTexts = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0 ? '已掌握' : '掌握');
                const favStatus = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0);
                const masterStatus = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0);
                this.setData({
                    allSentences,
                    topics,
                    topicCounts,
                    favTexts,
                    masterTexts,
                    favStatus,
                    masterStatus,
                    showGenModal: false,
                    generating: false,
                });
                this.doFilter();
                wx.showToast({ title: `已生成 ${results.length} 个句子`, icon: 'success' });
            }
            catch (err) {
                wx.showToast({ title: err.message || '生成失败', icon: 'none' });
                this.setData({ generating: false });
            }
        });
    },
    openPasteModal() {
        this.setData({ showPasteModal: true, pasteText: '' });
    },
    closePasteModal() {
        this.setData({ showPasteModal: false });
    },
    onPasteInput(e) {
        this.setData({ pasteText: e.detail.value });
    },
    doParse() {
        return __awaiter(this, void 0, void 0, function* () {
            const text = this.data.pasteText.trim();
            if (text.length < 10) {
                wx.showToast({ title: '文本太短，至少10个字符', icon: 'none' });
                return;
            }
            this.setData({ parsing: true });
            try {
                const results = yield (0, api_1.parseSentences)(text);
                const maxId = Math.max(0, ...this.data.allSentences.map(s => s.id));
                const newSentences = results.map((item, i) => ({
                    id: maxId + i + 1,
                    english: item.english,
                    chinese: item.chinese,
                    keywords: item.keywords,
                    topic: item.topic,
                }));
                const allSentences = [...this.data.allSentences, ...newSentences];
                const topics = [...new Set(allSentences.map(s => s.topic))];
                topics.unshift('全部');
                topics.push('已掌握', '未掌握');
                const tc = {};
                allSentences.forEach(s => {
                    tc[s.topic] = (tc[s.topic] || 0) + 1;
                });
                tc['已掌握'] = this.data.masteredIds.length;
                tc['未掌握'] = allSentences.length - this.data.masteredIds.length;
                const favTexts = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0 ? '已收藏' : '收藏');
                const masterTexts = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0 ? '已掌握' : '掌握');
                const favStatus = allSentences.map(s => this.data.favoriteIds.indexOf(s.id) >= 0);
                const masterStatus = allSentences.map(s => this.data.masteredIds.indexOf(s.id) >= 0);
                this.setData({
                    allSentences,
                    topics,
                    topicCounts: tc,
                    favTexts,
                    masterTexts,
                    favStatus,
                    masterStatus,
                    showPasteModal: false,
                    parsing: false,
                });
                this.doFilter();
                wx.showToast({ title: `已导入 ${results.length} 个句子`, icon: 'success' });
            }
            catch (err) {
                wx.showToast({ title: err.message || '解析失败', icon: 'none' });
                this.setData({ parsing: false });
            }
        });
    },
    onShareAppMessage() {
        return {
            title: `💬 语境句子 — 已掌握 ${this.data.masteredIds.length} 句！`,
            path: '/pages/sentences/sentences',
        };
    },
});
