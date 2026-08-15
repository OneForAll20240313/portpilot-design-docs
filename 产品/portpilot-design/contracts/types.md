# PortPilot Service 层值类型契约（types.md）

> 本文件统一 catalog `contracts/service-api.md` 各 Service 用例签名中出现的值对象/枚举/结构体。实现方以本文件为准，签名与 types.md 一致。本文件是 SSOT，14 章数据模型与各 schema 仅引用，不重复定义冲突。
>
> 类型命名遵循 11.3 标准术语。`*Id` 均为字符串（UUID 或系统标识）。`Result` 为 `{ ok: bool, error?: ErrorCode }`。

## 1. 通用基元

| 类型 | 定义 | 说明 |
|---|---|---|
| `Bytes` | `byte[]` | 原始字节序列 |
| `ConnectionId` | `string` | 连接实例标识（对应已建立连接的会话） |
| `SessionId` | `string` | 会话标识（UUID） |
| `ms_t` | `integer` | 毫秒 |
| `timeout_t` | `integer` | 超时（毫秒） |
| `Result` | `{ ok: bool, error?: ErrorCode }` | 通用操作结果 |
| `ErrorCode` | `string` | 见 service-api.md 错误码约定 |

## 2. 会话域（§1 SessionService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `ConnectTarget` | `{ type: serial\|network, port?, baud?, dataBits?, stopBits?, parity?, addr?, tcpPort? }` | 对齐 `session.schema.json` `connectTarget` |
| `ConnectParams` | `{ target: ConnectTarget, name: string, mode?: SessionMode, group?: string }` | 创建/探测会话参数 |
| `Session` | 见 `session.schema.json`（`{ id, name, mode, state, connectTarget, group, stats, ... }`） | 会话聚合根（A-201/A-202/A-203 返回） |
| `SessionSummary` | `{ id, name, mode, state, group, stats: { rxBytes, txBytes, rxSpeed, connectionDuration, bufferUsage } }` | 会话列表摘要（对齐 `session.schema.json`） |
| `SessionMode` | `enum: bytes\|terminal` | 会话模式（互斥） |
| `ProbeResult` | `{ ok: bool, criteria: ProbeCriteria, error?: ErrorCode }` | 探测结果（D-53，回填确认后连接） |
| `PortInfo` | `{ id, name, friendlyName, isBusy, vendorId?, productId?, systemLocation?, isLoopback? }` | 可用串口信息（A-214） |

## 3. 字节流域（§2 BufferService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `BufferView` | `{ connectionId, strategy, size, overflow, entries: ReceivedBytes[] }` | 缓冲视图（对齐 `buffer.schema.json`） |
| `BufferConfig` | `{ strategy: BufferStrategy, size: integer, overflow: OverflowPolicy }` | 缓冲配置 |
| `BufferStrategy` | `enum: ring\|append\|double` | 环形/追加/双缓冲 |
| `OverflowPolicy` | `enum: stop\|drop-oldest\|wrap` | 溢出策略（对齐 `buffer.schema.json` `overflowPolicy`） |
| `Match` | `{ keyword, start, end, snippet }` | 搜索命中 |
| `SearchOptions` | `{ offset?, limit?, caseSensitive?, highlight? }` | 搜索选项 |
| `LineControl` | `{ rts: bool, dtr: bool }` | RTS/DTR 电平 |
| `TagDefinition` | 见 `tag.schema.json` | 标签/调色板/高亮 |
| `TagId` | `string` | 标签标识 |
| `QuickCommand` | 见 `quick-command.schema.json` | 快捷命令 |
| `QuickCommandId` | `string` | 快捷命令标识 |
| `RecordingConfig` | `{ enabled: bool, filePath?: string }` | 录制配置（对齐 `buffer.schema.json` `recording`） |
| `RecordingResult` | `{ filePath: string, bytes: integer, durationMs: integer }` | 录制结果 |

## 4. 协议域（§3 ProtocolService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `Frame` | `{ bytes: Bytes, fields: FieldValue[], valid: bool }` | 解析帧 |
| `FieldId` | `string` | 字段标识 |
| `FieldValue` | `{ fieldId: FieldId, value: number\|string\|bytes[], timestamp }` | 字段解析值 |
| `FieldDef` | `{ id, name, type, length?, byteOrder?, offset?, scale?, unit? }` | 字段定义（A-418 `listFields` 返回，对齐 `protocol.schema.json`） |
| `ProtocolId` | `string` | 协议标识 |
| `ProtocolSchema` | 见 `protocol.schema.json` | 协议定义 |
| `ProtocolSummary` | `{ id, name, type, fieldCount, version }` | 协议摘要（A-409） |
| `ParseStats` | `{ totalFrames, validFrames, invalidFrames, lostFrames, resyncCount }` | 协议解析统计（A-419，高速丢帧/错帧/重同步） |
| `TemplateAction` | `enum: add\|update\|delete\|list` | 模板操作 |
| `TemplateData` | `{ id?, name, frames: Frame[] }` | 模板数据 |
| `LoopbackResult` | `{ ok: bool, matched: bool, actual: Bytes, expected: Bytes }` | 回环验证结果（A-416） |

## 5. 可视化域（§4 VisualService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `SceneId` | `string` | 场景标识 |
| `SceneElementId` | `string` | 场景元素标识 |
| `NodeId` | `string` | 节点标识（连线） |
| `ElementType` | `enum: 见 visual-scene.schema.json elements.item.type` | 元素类型（对齐 schema，含 GUI 全组件库） |
| `ElementProps` | `{ refreshRate?, range?, color?, threshold?, ... }` | 元素属性（对齐 `visual-scene.schema.json`） |
| `ViewAction` | `enum: add\|update\|delete\|applyTemplate` | 视图管理操作（`applyTemplate` 覆盖预置模板一键应用，04.3.1） |
| `ViewData` | `object` | 视图数据 |
| `CustomElement` | `object` | 自定义元素（管理动作含 import/export JSON 打包，04.6.3） |
| `RenderData` | `object` | 渲染数据（renderData 输出） |
| `FieldPool` | `{ sessionId, fields: FieldValue[] }` | 字段池（唯一数据源，事件广播） |

## 6. 终端域（§5 TerminalService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `TerminalLine` | `{ text: string, timestamp, ansi?: ansiToken[] }` | 终端行（含 ANSI 解析结果） |
| `HistoryQuery` | `{ limit?, sessionId?, filter? }` | 历史查询 |
| `IOTerminalPlaceholder` | `{ name: string, pattern?: string }` | 参数占位符 |

## 7. 命令域（§6 CommandService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `CommandGroupId` | `string` | 命令组标识 |
| `CommandItem` | `{ type: command\|delay\|wait_for, content?, delayMs?, timeout? }` | 命令项（对齐 `command-group.schema.json`） |
| `ExecStatus` | `{ state: pending\|running\|paused\|done\|error, stepIndex?, loopCount? }` | 命令执行状态 |
| `MacroId` | `string` | 宏标识 |
| `Macro` | `{ id, name, operations: Operation[] }` | 宏（录制操作序列） |
| `CommandGroupSummary` | `{ id, name, commandCount, state }` | 命令组摘要（A-710） |
| `MacroSummary` | `{ id, name, operationCount }` | 宏摘要（A-718 `listMacros`） |
| `ScriptAction` | `enum: import\|edit\|delete\|list` | 脚本管理操作（D-27） |
| `ScriptData` | `object` | 脚本数据 |

## 8. 设置域（§7 SettingsService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `SettingValue` | `string\|number\|boolean\|object` | 设置值 |
| `Scope` | `enum: g\|s\|t` | 作用域（全局/会话/临时，属 Domain 层） |
| `ThemeId` | `string` | 主题标识 |

## 9. 路由域（§8 RouteService）

| 类型 | 定义 | 说明 |
|---|---|---|
| `ViewId` | `string` | 视图标识（对齐 `route-state.schema.json`） |
| `ModuleId` | `string` | 模块标识 |

## 约束

- 以上类型定义与 `service-api.md` 签名一一对应；新增接口必须先在本文件登记类型。
- 结构体字段以对应 `*.schema.json` 为精确权威；本文件仅作类型清单与语义说明，冲突时以 schema 为准。
- 枚举值命名统一小写（如 `drop-oldest`），对齐 buffer/visual-scene schema。