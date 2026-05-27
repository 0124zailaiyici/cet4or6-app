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
Object.defineProperty(exports, "__esModule", { value: true });
const api_1 = require("../../utils/api");
const theme_1 = require("../../utils/theme");
const POS_MAP = {
    '名词': 'noun', 'noun': 'noun',
    '动词': 'verb', 'verb': 'verb',
    '形容词': 'adjective', 'adjective': 'adjective',
    '副词': 'adverb', 'adverb': 'adverb',
    '介词': 'preposition', 'preposition': 'preposition',
    '连词': 'conjunction', 'conjunction': 'conjunction',
    '代词': 'pronoun', 'pronoun': 'pronoun',
    '感叹词': 'interjection', 'interjection': 'interjection',
};
Page({
    data: {
        query: '',
        result: null,
        error: '',
        loading: false,
        history: [],
        darkMode: false,
        aiAvailable: false,
        aiEnabled: false,
        exampleCount: 0,
        adding: false,
    },
    onLoad() {
        this._applyDarkMode();
        const raw = wx.getStorageSync('dictHistory');
        if (raw)
            this.setData({ history: raw });
        this.setData({ aiEnabled: wx.getStorageSync('dictAiEnabled') === true });
        (0, api_1.checkHealth)().then(r => {
            if (r.apiKey)
                this.setData({ aiAvailable: true });
        }).catch(() => { });
    },
    onShow() {
        this._applyDarkMode();
    },
    _applyDarkMode() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        const app = getApp();
        this.setData({ darkMode: app.globalData.darkMode });
    },
    onInput(e) {
        this.setData({ query: e.detail.value, error: '', result: null });
    },
    search(e) {
        return __awaiter(this, void 0, void 0, function* () {
            const word = e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.word;
            const q = (word || this.data.query).trim();
            if (!q)
                return;
            this.setData({ loading: true, error: '', result: null });
            if (word)
                this.setData({ query: word });
            try {
                let result;
                if (this.data.aiAvailable && this.data.aiEnabled) {
                    try {
                        const ai = yield (0, api_1.aiFullDict)(q);
                        result = ai;
                        if (result.meanings) {
                            result.meanings.forEach(m => { m._posClass = POS_MAP[m.partOfSpeech] || m.partOfSpeech; });
                        }
                    }
                    catch (_a) {
                        this.setData({ aiEnabled: false });
                        wx.setStorageSync('dictAiEnabled', false);
                        return this.search();
                    }
                }
                else {
                    const data = yield (0, api_1.lookupWord)(q);
                    const entry = Array.isArray(data) ? data[0] : data;
                    const phonetics = entry.phonetics || [];
                    const foundPhonetic = phonetics.find((p) => p.text) || {};
                    const phonetic = entry.phonetic || foundPhonetic.text || '';
                    const foundAudio = phonetics.find((p) => p.audio) || {};
                    const audio = foundAudio.audio || '';
                    const chinese = entry.chinese || '';
                    result = {
                        word: entry.word,
                        phonetic,
                        audio,
                        chinese,
                        meanings: (entry.meanings || []).map((m) => ({
                            partOfSpeech: m.partOfSpeech,
                            _posClass: POS_MAP[m.partOfSpeech] || m.partOfSpeech,
                            synonyms: (m.synonyms || []).slice(0, 5) || [],
                            antonyms: (m.antonyms || []).slice(0, 5) || [],
                            definitions: (m.definitions || []).slice(0, 3).map((d) => ({
                                definition: d.definition,
                                definitionCn: d.definitionCn || '',
                                example: d.example || '',
                                exampleCn: d.exampleCn || '',
                            })) || [],
                        })) || [],
                        sourceUrls: entry.sourceUrls || [],
                    };
                }
                const exampleCount = result.meanings.reduce((s, m) => s + m.definitions.filter(d => d.example).length, 0);
                this.setData({ result, exampleCount, loading: false, error: '' });
                const history = this.data.history;
                if (!history.includes(q.toLowerCase())) {
                    history.unshift(q.toLowerCase());
                    if (history.length > 20)
                        history.pop();
                    wx.setStorageSync('dictHistory', history);
                    this.setData({ history });
                }
            }
            catch (_b) {
                this.setData({ error: '未找到该单词，请检查拼写', loading: false });
            }
        });
    },
    clear() {
        this.setData({ query: '', result: null, error: '' });
    },
    toggleAi() {
        const val = !this.data.aiEnabled;
        this.setData({ aiEnabled: val });
        wx.setStorageSync('dictAiEnabled', val);
    },
    addToVocab() {
        const r = this.data.result;
        if (!r || this.data.adding)
            return;
        const app = getApp();
        const words = app.globalData.studyData.vocabWords;
        if (words.find((w) => w.word === r.word)) {
            wx.showToast({ title: '已在单词本中', icon: 'none' });
            this.setData({ adding: true });
            return;
        }
        words.unshift({
            word: r.word, phonetic: r.phonetic, definition: '', chn: r.chinese || '',
            source: '词典查询', context: '', contextCn: '', audioUrl: r.audio || '',
            status: 'new', correctStreak: 0, growth: 0, stars: 0,
        });
        wx.setStorageSync('studyData', app.globalData.studyData);
        this.setData({ adding: true });
        wx.showToast({ title: '已加入单词本', icon: 'success' });
    },
    playAudio() {
        const audioSrc = this.data.result && this.data.result.audio;
        if (!audioSrc)
            return;
        const ctx = wx.createInnerAudioContext();
        ctx.src = audioSrc;
        ctx.play();
    },
});
