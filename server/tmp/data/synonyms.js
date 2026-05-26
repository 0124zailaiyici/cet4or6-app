"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSynonymMap = buildSynonymMap;
const synonymGroups = [
    ['important', 'significant', 'crucial', 'essential', 'vital', 'key', 'major'],
    ['many', 'numerous', 'countless', 'plenty of', 'a lot of', 'abundant'],
    ['more and more', 'increasingly', 'growing', 'a growing number of'],
    ['people', 'individuals', 'the public', 'citizens', 'population'],
    ['beautiful', 'gorgeous', 'splendid', 'magnificent', 'stunning'],
    ['traditional', 'conventional', 'customary', 'classic', 'age-old'],
    ['popular', 'widespread', 'prevalent', 'common', 'well-liked', 'favored'],
    ['protect', 'preserve', 'safeguard', 'conserve', 'defend'],
    ['environment', 'nature', 'ecology', 'natural world'],
    ['development', 'growth', 'advancement', 'progress', 'expansion'],
    ['convenient', 'handy', 'accessible', 'user-friendly'],
    ['provide', 'offer', 'supply', 'furnish', 'give'],
    ['attract', 'draw', 'appeal to', 'pull in', 'captivate'],
    ['country', 'nation', 'state', 'land'],
    ['culture', 'heritage', 'civilization', 'tradition'],
    ['elderly', 'aged', 'senior', 'older', 'old'],
    ['healthy', 'fit', 'robust', 'well', 'vigorous'],
    ['gradually', 'increasingly', 'steadily', 'progressively'],
    ['realize', 'recognize', 'understand', 'become aware of'],
    ['necessary', 'essential', 'indispensable', 'requisite', 'needed'],
    ['various', 'diverse', 'varied', 'different kinds of', 'a variety of'],
    ['precious', 'valuable', 'priceless', 'treasured', 'cherished'],
    ['world', 'globe', 'earth', 'planet'],
    ['choose', 'select', 'pick', 'opt for'],
    ['improve', 'enhance', 'better', 'upgrade', 'boost'],
    ['method', 'approach', 'way', 'means', 'mode'],
    ['famous', 'well-known', 'renowned', 'celebrated', 'noted'],
    ['therefore', 'thus', 'hence', 'consequently', 'as a result'],
    ['because', 'since', 'as', 'for', 'due to', 'owing to'],
    ['however', 'nevertheless', 'nonetheless', 'yet', 'still'],
    ['show', 'demonstrate', 'indicate', 'reveal', 'display'],
    ['use', 'utilize', 'employ', 'make use of', 'apply'],
    ['help', 'assist', 'aid', 'support'],
    ['change', 'transform', 'alter', 'shift', 'modify'],
    ['begin', 'start', 'commence', 'initiate', 'launch'],
    ['end', 'finish', 'complete', 'conclude', 'terminate'],
    ['think', 'believe', 'consider', 'hold', 'deem'],
    ['chance', 'opportunity', 'occasion', 'prospect'],
    ['difficult', 'challenging', 'tough', 'hard', 'demanding'],
    ['happy', 'joyful', 'delighted', 'pleased', 'glad', 'cheerful'],
    ['skill', 'technique', 'craft', 'artistry', 'expertise'],
    ['perform', 'conduct', 'carry out', 'execute', 'stage'],
    ['usual', 'common', 'typical', 'ordinary', 'normal'],
    ['big', 'large', 'huge', 'enormous', 'massive', 'immense'],
    ['small', 'tiny', 'minor', 'little', 'petite'],
    ['fast', 'rapid', 'swift', 'quick', 'speedy'],
    ['slow', 'gradual', 'leisurely', 'unhurried'],
    ['rich', 'wealthy', 'affluent', 'well-off', 'prosperous'],
    ['poor', 'needy', 'impoverished', 'underprivileged'],
    ['new', 'fresh', 'novel', 'innovative', 'original'],
    ['old', 'ancient', 'historic', 'antique', 'aged'],
    ['strong', 'powerful', 'mighty', 'robust', 'sturdy'],
    ['weak', 'fragile', 'feeble', 'delicate', 'frail'],
    ['love', 'adore', 'cherish', 'treasure', 'be fond of'],
    ['hate', 'dislike', 'detest', 'loathe', 'abhor'],
    ['part', 'portion', 'section', 'segment', 'component'],
    ['collect', 'gather', 'accumulate', 'amass', 'assemble'],
    ['travel', 'journey', 'trip', 'tour', 'voyage'],
];
function buildSynonymMap() {
    const map = new Map();
    for (const group of synonymGroups) {
        for (const word of group) {
            const key = word.toLowerCase();
            if (!map.has(key))
                map.set(key, new Set());
            const set = map.get(key);
            for (const other of group) {
                if (other !== word)
                    set.add(other.toLowerCase());
            }
        }
    }
    return map;
}
exports.default = synonymGroups;
