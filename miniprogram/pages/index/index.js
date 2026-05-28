"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const checkin_1 = require("../../utils/checkin");
const theme_1 = require("../../utils/theme");
const API_BASE = 'https://cet4or6-app-production.up.railway.app';
function getStatusBarHeight() {
    try {
        return wx.getSystemInfoSync().statusBarHeight || 0;
    }
    catch (_a) {
        return 0;
    }
}
// Pool of daily sentences
const DAILY_SENTENCES = [
    { en: '"The center of American automobile innovation has moved 2,000 miles away."', zh: '美国汽车创新中心已经转移了 2000 英里。' },
    { en: '"It is a mistake to simply equate longevity with issues of old age."', zh: '把长寿简单地等同于老年问题是个错误。' },
    { en: '"Longer lives have implications for all of life, not just the end of it."', zh: '更长的寿命对整个人生都有影响，不仅仅是生命的终点。' },
    { en: '"Options are more valuable the longer they can be held."', zh: '选择权能持有越久就越有价值。' },
    { en: '"If many people are living for longer, then this will result in an inevitable redesign of work and life."', zh: '如果很多人的寿命更长，工作和生活将不可避免地重新设计。' },
    { en: '"A multi-stage life will have profound changes not just in how you manage your career, but also in your approach to life."', zh: '多阶段生活不仅会深刻改变你的职业管理方式，也会改变你的人生态度。' },
    { en: '"Being self-aware, investing in broader networks of friends, and being open to new ideas will become even more crucial skills."', zh: '自我认知、拓展朋友圈、对新想法保持开放，将成为更关键的技能。' },
    { en: '"Current life structures, career paths, and social norms are out of tune with the emerging reality of longer lifespans."', zh: '当前的生活结构、职业道路和社会规范与寿命延长的新现实格格不入。' },
];
let dailyPick = null;
let _dailyCtx = null;
Page({
    data: {
        greeting: '',
        checkedIn: false,
        streak: 0,
        darkMode: false,
        missionTitle: '开始学习',
        missionSub: '今天第一件事，从这里开始',
        missionBtn: '开始',
        dailyEn: '',
        dailyZh: '',
        dailyPlaying: false,
        todayListen: 0,
        todaySentence: 0,
        todayTrans: 0,
        todayWrite: 0,
        statusBarHeight: 0,
    },
    onLoad() {
        this.setData({ statusBarHeight: getStatusBarHeight() });
        this.refresh();
    },
    onShow() {
        this.refresh();
    },
    refresh() {
        (0, theme_1.applyTheme)((0, theme_1.getDarkMode)());
        const hour = new Date().getHours();
        let greeting = '晚上好 🌙';
        if (hour < 12)
            greeting = '早上好 🌤';
        else if (hour < 18)
            greeting = '下午好 ☀️';
        const app = getApp();
        const sd = app.globalData.studyData;
        const today = (0, checkin_1.getTodayActivity)();
        const checkedIn = (0, checkin_1.isCheckedInToday)();
        const streak = (0, checkin_1.calcStreak)(sd.checkInDates);
        const todayListen = today.listen || 0;
        const todaySentence = today.sentence || 0;
        const todayTrans = today.translation || 0;
        const todayWrite = today.writing || 0;
        // Mission recommendation
        let missionTitle = '休息一下 🌟';
        let missionSub = '今天任务都完成了，真棒！';
        let missionBtn = '继续';
        if (!checkedIn) {
            missionTitle = '打个卡';
            missionSub = '今天还没打卡，花 3 秒开始吧';
            missionBtn = '去打卡';
        }
        else if (today.listen === 0) {
            missionTitle = '听一个句子';
            missionSub = '精听一句真题，2 分钟搞定';
            missionBtn = '去听力';
        }
        else if (today.sentence === 0) {
            missionTitle = '读一个句子';
            missionSub = '语境中记单词，5 分钟搞定';
            missionBtn = '去句子';
        }
        else if (today.translation === 0) {
            missionTitle = '翻一段话';
            missionSub = '中译英练手感';
            missionBtn = '去翻译';
        }
        // Daily sentence (pick once per session)
        if (dailyPick === null)
            dailyPick = Math.floor(Math.random() * DAILY_SENTENCES.length);
        const ds = DAILY_SENTENCES[dailyPick];
        this.setData({
            greeting,
            checkedIn,
            streak,
            darkMode: (0, theme_1.getDarkMode)(),
            missionTitle,
            missionSub,
            missionBtn,
            dailyEn: ds.en,
            dailyZh: ds.zh,
            todayListen,
            todaySentence,
            todayTrans,
            todayWrite,
        });
    },
    goTo(e) {
        const url = e.currentTarget.dataset.url;
        if (url.includes('vocab') || url.includes('settings') || url.includes('profile') || url.includes('statistics')) {
            wx.switchTab({ url });
        }
        else {
            wx.navigateTo({ url });
        }
    },
    handleCheckIn() {
        const streak = (0, checkin_1.doCheckIn)('daily');
        this.setData({ checkedIn: true, streak });
        wx.showToast({ title: `打卡成功！连续 ${streak} 天`, icon: 'success' });
        this.refresh();
    },
    doMission() {
        const { missionTitle } = this.data;
        if (missionTitle.includes('打卡')) {
            this.handleCheckIn();
        }
        else if (missionTitle.includes('句子')) {
            wx.navigateTo({ url: '/pages/listening/listening' });
        }
        else if (missionTitle.includes('单词')) {
            wx.navigateTo({ url: '/pages/sentences/sentences' });
        }
        else if (missionTitle.includes('翻译')) {
            wx.navigateTo({ url: '/pages/translation/translation' });
        }
    },
    playDailySentence() {
        if (this.data.dailyPlaying) {
            if (_dailyCtx) {
                _dailyCtx.stop();
                _dailyCtx.destroy();
                _dailyCtx = null;
            }
            this.setData({ dailyPlaying: false });
            return;
        }
        const text = this.data.dailyEn.replace(/['"]/g, '');
        this.setData({ dailyPlaying: true });
        _dailyCtx = wx.createInnerAudioContext();
        _dailyCtx.obeyMuteSwitch = false;
        _dailyCtx.autoplay = true;
        _dailyCtx.src = `${API_BASE}/tts?text=${encodeURIComponent(text)}&lang=en`;
        _dailyCtx.onEnded(() => { if (_dailyCtx) {
            _dailyCtx.destroy();
            _dailyCtx = null;
        } ; this.setData({ dailyPlaying: false }); });
        _dailyCtx.onError(() => { if (_dailyCtx) {
            _dailyCtx.destroy();
            _dailyCtx = null;
        } ; this.setData({ dailyPlaying: false }); });
    },
    quickListen() { wx.navigateTo({ url: '/pages/listening/listening' }); },
    quickVocab() { wx.switchTab({ url: '/pages/vocab/vocab' }); },
    quickReading() { wx.navigateTo({ url: '/pages/reading/reading' }); },
});
