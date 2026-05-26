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
        this.setData({ filteredSentences: filtered, favTexts, masterTexts });
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
        this.setData({
            masteredIds: masteredArr,
            masterTexts,
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
        this.setData({ favoriteIds: favArr, favTexts, filteredSentences: this.data.filteredSentences.slice() });
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
    },
    prevSentence() {
        if (this.data.immersionIndex > 0) {
            this.setData({ immersionIndex: this.data.immersionIndex - 1 });
        }
    },
    nextSentence() {
        const max = this.data.filteredSentences.length - 1;
        if (this.data.immersionIndex < max) {
            this.setData({ immersionIndex: this.data.immersionIndex + 1 });
        }
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
                this.setData({
                    allSentences,
                    topics,
                    topicCounts,
                    favTexts,
                    masterTexts,
                    showGenModal: false,
                    generating: false,
                });
                this.doFilter();
                const hash = allSentences.length + '|' + allSentences[0] && allSentences[0].english + '|' + allSentences[allSentences.length - 1] && allSentences[allSentences.length - 1].english;
                wx.setStorageSync('sentenceHash', hash);
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
                this.setData({
                    allSentences,
                    topics,
                    topicCounts: tc,
                    favTexts,
                    masterTexts,
                    showPasteModal: false,
                    parsing: false,
                });
                this.doFilter();
                const hash = allSentences.length + '|' + allSentences[0] && allSentences[0].english + '|' + allSentences[allSentences.length - 1] && allSentences[allSentences.length - 1].english;
                wx.setStorageSync('sentenceHash', hash);
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
