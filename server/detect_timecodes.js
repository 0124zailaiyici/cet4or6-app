/**
 * 自动时间码检测脚本
 * 用法: node server/detect_timecodes.js
 *
 * 使用 FFmpeg silencedetect 自动分析 MP3 音频中的静音段，
 * 推算出每道题对应的音频起止时间
 */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const AUDIO_DIR = path.join(__dirname, 'audio')
const TIMECODE_FILE = path.join(AUDIO_DIR, 'timecodes.json')

if (!fs.existsSync(TIMECODE_FILE)) {
  console.error('❌ timecodes.json 不存在，请先运行 import_listening.js')
  process.exit(1)
}

const timecodes = JSON.parse(fs.readFileSync(TIMECODE_FILE, 'utf-8'))

function detectSilence(mp3Path) {
  try {
    const result = execSync(
      `ffmpeg -i "${mp3Path}" -af "silencedetect=noise=-30dB:d=2" -f null - 2>&1`,
      { encoding: 'utf-8', timeout: 60000 }
    )

    const silences = []
    const regex = /silence_start:\s*([\d.]+)[\s\S]*?silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/g
    let match
    while ((match = regex.exec(result)) !== null) {
      silences.push({
        start: parseFloat(match[1]),
        end: parseFloat(match[2]),
        duration: parseFloat(match[3]),
      })
    }

    // 获取总时长
    const durMatch = result.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/)
    let totalDuration = 0
    if (durMatch) {
      totalDuration = parseInt(durMatch[1]) * 3600 + parseInt(durMatch[2]) * 60 + parseFloat(durMatch[3])
    }

    return { silences, totalDuration }
  } catch (err) {
    console.error(`   ❌ FFmpeg 分析失败: ${err.message}`)
    return null
  }
}

function mapSilencesToQuestions(silences, totalDuration, questionCount) {
  // 找到显著的静音间隙（>4秒，通常是段落之间的停顿）
  const bigGaps = silences.filter(s => s.duration >= 4)

  // 如果找到的间隙不够，用所有 ≥2秒的
  const gaps = bigGaps.length >= 5 ? bigGaps : silences.filter(s => s.duration >= 3)

  if (gaps.length === 0) {
    // 没有检测到足够间隙，均匀分配
    console.log('   ⚠️ 未检测到足够静音段，按均匀分配估算')
    const segmentDuration = totalDuration / questionCount
    const result = []
    for (let i = 0; i < questionCount; i++) {
      result.push({
        start: Math.round(i * segmentDuration),
        end: Math.round((i + 1) * segmentDuration),
      })
    }
    return result
  }

  // 用静音段分割
  console.log(`   📊 检测到 ${gaps.length} 个显著静音段，${silences.length} 个总静音段`)
  
  const boundaries = [0]
  for (const g of gaps) {
    boundaries.push(g.start)  // 静音开始 = 上一段结束
    boundaries.push(g.end)    // 静音结束 = 下一段开始
  }
  boundaries.push(totalDuration)

  // 去重排序
  const unique = [...new Set(boundaries)].sort((a, b) => a - b)
  
  // 合并相邻很近的边界（<3秒）
  const merged = [unique[0]]
  for (let i = 1; i < unique.length; i++) {
    if (unique[i] - merged[merged.length - 1] < 3) {
      merged[merged.length - 1] = unique[i]
    } else {
      merged.push(unique[i])
    }
  }

  // 将边界映射到题目
  const segments = []
  for (let i = 0; i < questionCount && i < merged.length - 1; i++) {
    segments.push({
      start: Math.round(merged[i]),
      end: Math.round(merged[Math.min(i + 1, merged.length - 1)]),
    })
  }

  // 如果段数不够，补足
  while (segments.length < questionCount) {
    const last = segments[segments.length - 1] || { start: 0, end: totalDuration }
    const avg = (last.end - last.start)
    segments.push({
      start: last.end,
      end: Math.round(Math.min(last.end + avg, totalDuration)),
    })
  }

  return segments
}

// ===== 主逻辑 =====
console.log('🔍 自动检测听力时间码...\n')

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
  const result = detectSilence(mp3Path)
  if (!result) continue

  const questionCount = tc.segments.length
  const segments = mapSilencesToQuestions(result.silences, result.totalDuration, questionCount)

  // 应用时间码
  for (let i = 0; i < Math.min(tc.segments.length, segments.length); i++) {
    tc.segments[i].start = segments[i].start
    tc.segments[i].end = segments[i].end
    updated++
  }

  console.log(`   ✅ ${segments.length} 段 @ ${Math.round(result.totalDuration)}秒\n`)
}

// 保存
fs.writeFileSync(TIMECODE_FILE, JSON.stringify(timecodes, null, 2), 'utf-8')
console.log(`⏱️  已更新 ${updated} 段时间码 → ${TIMECODE_FILE}`)
console.log('📝 接下来运行 node server/apply_timecodes.js 应用到数据文件')
