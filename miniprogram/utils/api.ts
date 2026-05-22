const API_BASE = 'http://localhost:3001'

interface CorrectionResult {
  score: number
  dimensions?: {
    vocabulary: number
    grammar: number
    semantics: number
    expression: number
  }
  suggestions: string
  reference: string
}

interface WritingResult {
  score: number
  dimensions: {
    content: number
    structure: number
    language: number
  }
  suggestions: string
  reference: string
}

function request<T>(url: string, data: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}${url}`,
      method: 'POST',
      data,
      header: { 'Content-Type': 'application/json' },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data as T)
        } else {
          reject(new Error(`服务器错误 ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`请求失败: ${err.errMsg}`))
      },
    })
  })
}

export function correctTranslation(chinese: string, userAnswer: string) {
  return request<CorrectionResult>('/correct_translation', { chinese, userAnswer })
}

export function correctWriting(prompt: string, userAnswer: string) {
  return request<WritingResult>('/correct_writing', { prompt, userAnswer })
}

export function teachSentence(pattern: string, userSentence?: string) {
  return request<{ explanation: string }>('/teach_sentence', { pattern, userSentence })
}

export function lookupWord(word: string): Promise<any> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}/dictionary?word=${encodeURIComponent(word)}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data)
        else reject(new Error(`查询失败 ${res.statusCode}`))
      },
      fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
    })
  })
}

export function aiTranslateWord(word: string): Promise<{ chinese: string }> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}/dictionary/ai?word=${encodeURIComponent(word)}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data as { chinese: string })
        else reject(new Error(`翻译失败 ${res.statusCode}`))
      },
      fail: (err) => reject(new Error(`请求失败: ${err.errMsg}`)),
    })
  })
}

export function correctParagraph(prompt: string, userAnswer: string) {
  return request<{ score: number; dimensions: { coherence: number; content: number; language: number }; suggestions: string }>('/correct_paragraph', { prompt, userAnswer })
}

export interface GeneratedSentence {
  english: string
  chinese: string
  keywords: string[]
  topic: string
}

export function generateSentence(params: { word?: string; topic?: string; count?: number }) {
  return request<GeneratedSentence[]>('/generate_sentence', params)
}

export function parseSentences(text: string) {
  return request<GeneratedSentence[]>('/parse_sentences', { text })
}

export function checkHealth(): Promise<{ status: string; apiKey: boolean }> {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE}/health`,
      method: 'GET',
      timeout: 2000,
      success: (res) => {
        if (res.statusCode === 200) resolve(res.data as { status: string; apiKey: boolean })
        else reject(new Error(`health check failed: ${res.statusCode}`))
      },
      fail: (err) => reject(err),
    })
  })
}
