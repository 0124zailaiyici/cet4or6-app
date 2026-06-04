# 项目教训

## TypeScript

1. **接口定义必须跟实际数据一致**：`IListeningData` 缺 `liteMode`/`tinyOptions`，`IListeningMethods` 缺 `resetPlayback`，但 WXML 和 TS 已经在用了一编译就报错。加功能前先更新接口定义。

2. **声明的变量/字段必须被使用**：`_advanceGuard` 字段、`audioUrl` 局部变量声明了没读 → `tsc --noEmit` 报 TS6133（`noUnusedLocals`）。删除或加下划线前缀。

3. **可选参数不能直接传给强类型函数**：`IListeningPage.sentenceStart?` 是 `number | undefined`，但 `audio.playFrom()` 强要求 `number`。用 `!` 断言（前提是前面已有 null guard）。

## WXML 模板

4. **不要在 WXML 表达式里调方法**：`.indexOf()`、`?.`、`??`、`Math.min()`、`Math.max()` 全不支持。必须预计算为布尔数组/字符串，然后直接引用数据字段。

5. **WXML 没有 HTML 标签**：`<h1>`、`<p>`、`<div>` 等会导致 500 编译错误。只能用微信原生组件：`<view>`、`<text>`、`<image>`、`<scroll-view>`、`<swiper>`、`<rich-text>`。

6. **动态事件名不支持**：`catchtap="{{condition ? 'fn1' : 'fn2'}}"` 会报错。改为始终绑定一个函数名，函数内部用 `if` 判断。

7. **`catchtap` vs `bindtap`**：`catchtap` 阻止事件冒泡（子元素点击不触发父级），`bindtap` 不阻止。需要阻止冒泡的场景用 `catchtap`。

## 微信开发者工具 / 基础库

8. **DevTools 更新会覆写 `project.private.config.json`**：升级到 2.01.2510260 后自动加了 `libVersion: "3.15.2"`。如果本地网络连不上微信 CDN，基础库下载失败导致 `WAServiceMainContext.js` 内部崩溃（`TypeError: i is not a function` / `Error: timeout`）。

   **修复**：删 private config 的 libVersion，project.config.json 的 libVersion 设为 `"trial"`（用本地缓存的库，不下载）。

9. **基础库 3.15.1 / 3.15.2 有已知 bug**：微信社区确认这两个版本会在 WAServiceMainContext 里报 `TypeError/Error: timeout`，降级到 3.15.0 或升级到 3.16+ 解决。如果 CDN 被屏蔽，用 `"trial"` 让 DevTools 自行选择可用版本。

10. **`wx.request` 必须传 `fail` 回调**：新 DevTools 对未处理的请求失败更敏感。不传 fail 回调可能触发内部错误。

11. **`project.private.config.json` 的代理设置会被重置**：DevTools 更新后，代理设置可能从"不使用系统代理"变回默认值，导致网络请求超时。每次更新后检查 设置 → 代理。

## 音频播放

12. **`InnerAudioContext` 设置顺序**：必须先设 `src` 再设 `playbackRate`，否则部分版本会静音。

13. **Railway 冷启动超时**：Railway 免费实例空闲后进入休眠，首次请求需要 30+ 秒。解决：app 启动时发一次 `/health` 预唤醒；音频播放失败后 2s 自动重试。

## 设计模式

14. **WXML 的 `wx:for` 必须配 `wx:key`**：不配 `wx:key` 时 DevTools 报 warning。如果遍历的是对象数组，在构建时给每个对象加唯一 `_key` 字段，然后用 `wx:key="_key"`。

15. **`IStudyData` 等持久化数据结构必须向后兼容**：storage 里的旧数据可能缺字段（如 `hardSentences`、`readingAnswers`），初始化时 `{...defaults, ...stored, missingField: stored.missingField || []}`。

16. **说明书类文档要先读源码再写**：凭猜测写的 UI 描述跟实际差距很大，每个模块的 WXML 都 100-270 行，事件函数 10-33 个。必须逐文件分析后再落笔。

## 项目管理

17. **README 比代码更影响第一印象**：GitHub 首页空着 = 没项目。功能列表、技术栈、截图、快速启动、部署地址这五块缺一不可。README 写完项目看起来就专业了。

18. **静态截图不如可运行 demo**：README 里的 `TODO: 截图` 占位没有说服力。花一小时做一个浏览器直接打开的 HTML demo（手机框 + Tab 导航 + 真实数据），面试时直接发链接，比截 6 张图有效得多。

19. **部署到公网的服务必须加鉴权**：Railway URL 是公开的，爬虫或扫端口工具几分钟就能找到。任何调用第三方付费 API 的接口（DeepSeek、TTS、翻译）都必须有 token 校验。`API_ACCESS_TOKEN` 是最低成本的防护——本地开发不设 token 跳过校验，上线后必须设。

20. **`/debug` 等调试路由上线前必须删掉**：暴露服务器路径、文件列表、内部路径是安全风险。开发时方便，上线前必须剔除或加鉴权。

21. **产品定位决定技术投入**：这个项目最缺的不是功能，是"可见性"。花时间做 AI 作文批改增强，不如花时间写 README 和做 Web demo——面试官根本不会去装微信开发者工具。技术债务可以慢慢还，但第一印象只有一次。
