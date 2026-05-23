/**
 * 自动时间码检测脚本 v2 — 段落级分段
 * 用法: node server/detect_timecodes.js
 *
 * CET-4 听力结构（8 个段落覆盖 25 题）:
 *   Section A: News 1(Q1-2) / News 2(Q3-4) / News 3(Q5-7)
 *   Section B: Conv 1(Q8-11) / Conv 2(Q12-15)
 *   Section C: Pass 1(Q16-18) / Pass 2(Q19-21) / Pass 3(Q22-25)
 *
 * 用较大停顿（>8秒，段落间停顿）而非小题间停顿来切分
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const AUDIO_DIR = path.join(__dirname, 'audio')
const TIMECODE_FILE = path.join(AUDIO_DIR, 'timecodes.json')

// 每个 Section 的段落分组: [起始题号, 结束题号]
const PARAGRAPH_GROUPS = [
  [1, 2], [3, 4], [5, 7],           // Section A: 3 news reports
  [8, 11], [12, 15],                 // Section B: 2 conversations
  [16, 18], [19, 21], [22, 25],      // Section C: 3 passages
]

if (!fs.existsSync(TIMECODE_FILE)) {
  console.error('❌ timecodes.json 不存在，请先运行 import_listening.js')
  process.exit(1)
}

const timecodes = JSON.parse(fs.readFileSync(TIMECODE_FILE, 'utf-8'))

function detectBigSilences(mp3Path) {
  // 用更严格的阈值: 静音超过 8 秒才计为段落边界
  const result = execSync(
    `ffmpeg -i "${mp3Path}" -af "silencedetect=noise=-30dB:d=8" -f null - 2>&1`,
    { encoding: 'utf-8', timeout: 60000 }
  )

  const boundaries = [0]
  const regex = /silence_start:\s*([\d.]+)/g
  let match
  while ((match = regex.exec(result)) !== null) {
    boundaries.push(parseFloat(match[1]))
  }

  const durMatch = result.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
  const totalDuration = durMatch
    ? parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
    : boundaries[boundaries.length - 1] + 60

  boundaries.push(totalDuration)
  return { boundaries, totalDuration }
}

function mapToParagraphs(boundaries, totalDuration) {
  // 去重排序
  const unique = [...new Set(boundaries)].sort((a, b) => a - b)

  // 合并靠近的边界（<15秒）
  const merged = [unique[0]]
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] - merged[merged.length - 1] < 15) {
      merged[merged.length - 1] = unique[i]
    } else {
      merged.push(unique[i])
    }
  }

  console.log(`   📊 ${merged.length - 1} 个段落边界: ${merged.map(v => Math.round(v) + 's').join(', ')}`)

  // 确保至少有 8 个段落（加首尾至少 9 个边界点）
  // 如果不够，均匀切分
  if (merged.length < 9) {
    console.log('   ⚠️ 段落数不足，按均匀分配补充')
    const segmentSize = totalDuration / 8
    const uniform = [0]
    for (let i = 1; i <= 8; i++) {
      uniform.push(Math.round(i * segmentSize))
    }
    return uniform
  }

  // 取前 9 个边界（对应 8 段）
  // 如果多了，取间距最大的 9 个（跳过小题间停顿）
  if (merged.length > 9) {
    // 计算相邻边界的间距，保留间距最大的前 8 个切点
    const gaps = []
    for (let i = 1; i < merged.length - 1; i++) {
      gaps.push({ idx: i, gap: merged[i + 1] - merged[i - 1] })
    }
    gaps.sort((a, b) => b.gap - a.gap)
    const keptIndices = new Set([0, merged.length - 1])
    for (let i = 0; i < 7 && i < gaps.length; i++) {
      keptIndices.add(gaps[i].idx)
    }
    const kept = [...keptIndices].sort((a, b) => a - b).map(i => merged[i])
    // 首尾必须保留
    if (kept[0] !== 0) kept.unshift(0)
    if (kept[kept.length - 1] !== totalDuration) kept.push(totalDuration)
    console.log(`   📐 筛选后 ${kept.length - 1} 段落`)
    return kept
  }

  return merged
}

// ===== 主逻辑 =====
console.log('🔍 段落级时间码检测 (v2)...\n')

let updated = 0

for (const [idStr, tc] of Object.entries(timecodes)) {
  const audioUrl = tc.audioUrl
  if (!audioUrl) continue

  const mp3Path = path.join(__dirname, audioUrl.replace(/^\/audio\//, 'audio/'))
  if (!fs.existsSync(mp3Path)) {
    console.log(`⚠️ 音频不存在: ${mp3Path}`)
    continue
  }

  console.log(`🎵 ${tc.title}`)
  const { boundaries, totalDuration } = detectBigSilences(mp3Path)
  const paragraphs = mapToParagraphs(boundaries, totalDuration)

  // 将段落映射到题目分组
  const segments = tc.segments
  for (let gi = 0; gi < PARAGRAPH_GROUPS.length && gi < paragraphs.length - 1; gi++) {
    const [qStart, qEnd] = PARAGRAPH_GROUPS[gi]
    const tStart = Math.round(paragraphs[gi])
    const tEnd = Math.round(paragraphs[gi + 1])

    for (let qi = qStart; qi <= qEnd; qi++) {
      const idx = qi - 1
      if (idx < segments.length) {
        segments[idx].start = tStart
        segments[idx].end = tEnd
        updated++
      }
    }
  }

  console.log(`   ✅ ${Math.min(paragraphs.length - 1, 8)} 段落 @ ${Math.round(totalDuration)}秒`)
  for (let gi = 0; gi < PARAGRAPH_GROUPS.length && gi < paragraphs.length - 1; gi++) {
    const [qStart, qEnd] = PARAGRAPH_GROUPS[gi]
    console.log(`      Q${qStart}-Q${qEnd}: ${Math.round(paragraphs[gi])}s - ${Math.round(paragraphs[gi + 1])}s`)
  }
  console.log()
}

fs.writeFileSync(TIMECODE_FILE, JSON.stringify(timecodes, null, 2), 'utf-8')
console.log(`⏱️  已更新 ${updated} 段时间码 → ${TIMECODE_FILE}`)
console.log('📝 接下来运行 node server/apply_timecodes.js 应用到数据文件')
