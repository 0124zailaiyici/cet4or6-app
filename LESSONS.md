# 项目教训

## TypeScript

1. **接口定义落后于实际数据**：`IListeningData` 缺 `liteMode`/`tinyOptions`，`IListeningMethods` 缺 `resetPlayback`。接口没加，但 WXML 和 TS 方法已经在用，导致编译报错。教训：加功能前先更新接口定义。

2. **声明了不用就是垃圾**：`_advanceGuard` 字段、`audioUrl` 局部变量声明了但没读 → `tsc --noEmit` 报 TS6133。保留未使用的声明只会增加噪音。

3. **`undefined` 不能赋值给 `number`**：`IListeningPage.sentenceStart?` 是 `number | undefined`，但 `audio.playFrom()` 强要求 `number`。用 `!` 断言（已在前面 `if` guard 过）。

## WXML

4. **不要在 WXML 里调方法**：`.indexOf()`、`Math.min()`、`?.` 都不支持。必须预计算为布尔数组或字符串，然后直接引用数据字段。`translation.wxml` 的图标映射和 `sentences.wxml` 的高亮标记都犯了这错。

## 微信开发者工具

5. **新版本可能重置配置**：DevTools 更新到 2.01.2510260 后重写了 `project.private.config.json`，加上 `libVersion: "3.15.2"`。如果网络连不上微信 CDN，基础库下载失败导致内部 `WAServiceMainContext.js` 崩溃。解决：删 private config 的 libVersion，把 project.config.json 的设为 `"trial"`。

6. **`wx.request` 必须传 `fail` 回调**：新 DevTools 版本对未处理的请求失败更敏感。不传 `fail` 回调可能触发内部 `TypeError: i is not a function`。

## 翻译数据

7. **CN/EN 字符比 25-35% 即自然翻译**：不要追求 60-80%。地道中文比英文精炼，覆盖关键信息即达标。段落级最低阈值设在 15%。

8. **`paraTranslations` 索引必须与 `splitPassage`/`formatBPassage` 输出精确对齐**：段落索引差一位就导致翻译内容错位。每次改切段逻辑后必须逐一验证索引映射。

9. **官方历年真题 PDF 含权威参考译文**：`answer_keys/*.pdf` 中有官方阅卷标准译文。人名（康沃尔/科沃尔）、机构名（来福车/Lyft）、引语归属等手动扩写容易出错，应优先使用官方译文。

## WXML

10. **`text` 嵌套 `text` 阻断子元素 tap 事件**：用 `view > text` 结构替代。WXML 不允许 `String()`、`join()`、`map()` 等——预计算好再绑定。

## Railway 部署

11. **大文件上传可能失败**：22.6MB 的 mp3 在上次部署时被跳过。重新 push 触发自动部署即可。注意 Railway 免费版 500MB 存储限制。
