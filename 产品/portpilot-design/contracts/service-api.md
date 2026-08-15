# PortPilot Service 层用例接口契约（service-api.md）

> 本文件是 Service 层接口契约的 SSOT。UI 只依赖 Service 接口（见 13.7 依赖规则），不直接触碰 Core/Domain 内部。各实现方以自己的模块接口为准，但签名、错误码、事件名以此文件为准。本文件同时收录 `DevicePort` 接口（Core 层，DevicePort 抽象由 13.7.2 L2-001 落地）。
>
> 本契约与 14 章模块设计的"对外 API 规格"（A-xxx / P-xxx）一一对应，是并行实现与测试的共同依据。

## 约定

- 签名格式：`返回类型 方法名(参数: 类型)`；同步返回或 Promise/异步回调由宿主决定，接口名与语义以本契约为准。
- 错误：接口失败时抛出/返回错误码，不在接口内吞异常。错误码前缀见表尾。
- 事件：接口发射的事件名必须与 `events.md` 一致。
- 术语：使用 11.3 标准术语（会话、会话模式、字段池、波形图等），无旧叫法。

---

## 1. SessionService（会话模块 / 限界上下文 01）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-201 | `Session createSession(ConnectParams params)` | `SESS_PARAM_INVALID` | `session.created` |
| A-202 | `Session selectSession(SessionId id)` | `SESS_NOT_FOUND` | `session.selected` |
| A-203 | `Session duplicateSession(SessionId id)` | `SESS_NOT_FOUND` | `session.duplicated` |
| A-204 | `void renameSession(SessionId id, string name)` | `SESS_NOT_FOUND / SESS_NAME_INVALID` | `session.renamed` |
| A-205 | `void deleteSession(SessionId id)` | `SESS_NOT_FOUND / SESS_BUSY` | `session.deleted` |
| A-206 | `void connect(SessionId id)` | `SESS_STATE_INVALID / SESS_PORT_BUSY / SESS_PORT_OPEN_FAILED / SESS_ACCESS_DENIED` | `session.stateChanged(connecting)` |
| A-207 | `void disconnect(SessionId id)` | `SESS_STATE_INVALID` | `session.stateChanged(disconnecting)` |
| A-208 | `void setMode(SessionId id, SessionMode mode)` | `SESS_MODE_CONFLICT` | `session.modeChanged` |
| A-209 | `SessionSummary[] listSessions()` | — | — |
| A-210 | `void resetStats(SessionId id)` | `SESS_NOT_FOUND` | `session.statsReset` |
| A-211 | `void exportLog(SessionId id, string path)` | `SESS_NOT_FOUND / SESS_IO_FAILED` | `session.logExported` |
| A-212 | `ProbeResult probePort(ConnectParams params)` | `SESS_PARAM_INVALID / SESS_PROBE_FAILED` | `session.probeDone` |
| A-213 | `void persistSessions()` | `SESS_IO_FAILED` | `session.persisted` |
| A-214 | `PortInfo[] listAvailablePorts()` | `SESS_PORT_ENUM_FAILED` | `session.portsListed` |

`PortInfo`：`{ id, name, friendlyName, isBusy, vendorId, productId, systemLocation, isLoopback }`——枚举系统可用串口（含 `/dev/tty*`、`/dev/pts/*` 等非标准设备，对应需求 #34）。底层由 Core 层 `PortEnumerator` 实现（基于 `QSerialPortInfo::availablePorts` 等平台枚举，见 §9）做真实枚举；UI 仅经本用例获取，不直接调平台 API。

## 2. BufferService（字节流模块 / 02）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-301 | `void onData(ConnectionId connId, bytes[] data)` | `BUF_CONN_INVALID` | `buffer.dataReceived` |
| A-302 | `void send(ConnectionId connId, bytes[] data)` | `BUF_CONN_INVALID / BUF_SEND_FAILED` | `buffer.sent` |
| A-303 | `BufferView getBuffer(BufferConfig config)` | — | — |
| A-304 | `Match[] search(string keyword, SearchOptions options)` | `BUF_KEYWORD_INVALID` | `buffer.searchDone` |
| A-305 | `void setBufferStrategy(BufferStrategy strategy, size_t size, OverflowPolicy overflow)` | `BUF_PARAM_INVALID` | `buffer.strategyChanged` |
| A-306 | `void clearBuffer(ConnectionId connId)` | `BUF_CONN_INVALID` | `buffer.cleared` |
| A-307 | `void manageTag(TagId id, TagDefinition def)` | `BUF_TAG_INVALID` | `buffer.tagChanged` |
| A-308 | `void setLineControl(ConnectionId connId, LineControl control)` | `BUF_CONN_INVALID / BUF_CTRL_INVALID` | `buffer.lineControlChanged` |
| A-309 | `void runSendQuickCommand(ConnectionId connId, QuickCommand cmd)` | `BUF_CONN_INVALID / BUF_SEND_FAILED` | `buffer.sent` |
| A-310 | `void startRecording(ConnectionId connId, RecordingConfig cfg)` | `BUF_CONN_INVALID / BUF_RECORDING_INVALID` | `buffer.recordingStarted` |
| A-311 | `RecordingResult stopRecording(ConnectionId connId)` | `BUF_CONN_INVALID / BUF_NOT_RECORDING` | `buffer.recordingStopped` |
| A-312 | `void sendAndWait(ConnectionId connId, bytes[] data, timeout_t timeout)` | `BUF_CONN_INVALID / BUF_SEND_FAILED / BUF_RESPONSE_TIMEOUT` | `buffer.sent` / `buffer.responseReceived` |

策略枚举：`ring|append|double`；溢出：`stop|drop-oldest|wrap`（对齐 buffer.schema.json `overflowPolicy`）。录制（A-310/A-311）对齐 `buffer.schema.json` `recording` 字段，接收字节按 `recordings/<session>/<timestamp>.bin` 落盘并 SQLite 索引（见 13 章）。

## 3. ProtocolService（协议模块 / 03）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-401 | `Frame[] parseByteStream(bytes[] stream)` | `PROTO_FRAME_INVALID` | `protocol.frameParsed` |
| A-402 | `FieldValue extractField(Frame frame, ProtocolSchema schema)` | `PROTO_FIELD_INVALID` | `protocol.fieldExtracted` |
| A-403 | `ProtocolId defineProtocol(ProtocolSchema schema)` | `PROTO_PARAM_INVALID` | `protocol.defined` |
| A-404 | `void exportProtocol(ProtocolId id)` | `PROTO_NOT_FOUND` | `protocol.exported` |
| A-405 | `void toGlobal(ProtocolId id)` | `PROTO_NOT_FOUND` | `protocol.toGlobal` |
| A-406 | `void onFieldUpdated(FieldId fieldId, FieldValue value)` | — | `field.updated` |
| A-407 | `void updateProtocol(ProtocolId id, ProtocolSchema schema)` | `PROTO_NOT_FOUND / PROTO_PARAM_INVALID` | `protocol.updated` |
| A-408 | `void deleteProtocol(ProtocolId id)` | `PROTO_NOT_FOUND / PROTO_IN_USE` | `protocol.deleted` |
| A-409 | `ProtocolSummary[] listProtocols()` | — | — |
| A-410 | `ProtocolId importProtocol(string json)` | `PROTO_PARAM_INVALID` | `protocol.imported` |
| A-411 | `ProtocolId duplicateProtocol(ProtocolId id)` | `PROTO_NOT_FOUND` | `protocol.duplicated` |
| A-412 | `bytes[] encodeFrame(ProtocolSchema schema, FieldValue[] values)` | `PROTO_ENCODE_INVALID` | — |
| A-413 | `void manageTemplates(TemplateAction action, TemplateData data)` | `PROTO_TEMPLATE_INVALID` | `protocol.templateChanged` |
| A-414 | `void sendFrame(ConnectionId connId, ProtocolSchema schema, FieldValue[] values)` | `PROTO_CONN_INVALID / PROTO_ENCODE_INVALID / PROTO_SEND_FAILED` | `protocol.sent` |
| A-415 | `void sendFrames(ConnectionId connId, ProtocolSchema schema, FieldValue[][] frameValues)` | `PROTO_CONN_INVALID / PROTO_ENCODE_INVALID / PROTO_SEND_FAILED` | `protocol.sent` |
| A-416 | `LoopbackResult loopbackVerify(ConnectionId connId, ProtocolSchema schema, FieldValue[] values, timeout_t timeout)` | `PROTO_CONN_INVALID / PROTO_ENCODE_INVALID / PROTO_SEND_FAILED / PROTO_LOOPBACK_TIMEOUT / PROTO_LOOPBACK_MISMATCH` | `protocol.loopbackDone` |
| A-417 | `ProtocolSchema getProtocol(ProtocolId id)` | `PROTO_NOT_FOUND` | — |
| A-418 | `FieldDef[] listFields(ProtocolId id)` | `PROTO_NOT_FOUND` | `protocol.fieldsListed` |
| A-419 | `ParseStats getParseStats()` | — | — |

`ParseStats`：`{ totalFrames, validFrames, invalidFrames, lostFrames, resyncCount }`（高速串口丢帧/错帧/重同步统计，03.1 高速丢包处理，UI 展示）。

> **协议发送（A-414~A-416，回填 03.6 组帧编辑的"发送/批量组帧/回环验证"）**：组帧编码（A-412）后，发送/批量发送/回环验证须落到指定会话的设备（`ConnectionId`）。功能测试需"一端口发完整协议、一端口收完整协议"的收发闭环，故发送必须可指定目标会话、可回环比对响应。发送底层复用 `DevicePort.write`（§9）。

ProtocolEngine（Core 层）实现协议帧切分/字段提取，见 §9 同层。

## 4. VisualService（可视化模块 / 04）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-501 | `SceneElementId addElement(SceneId sceneId, ElementType type)` | `VIZ_TYPE_INVALID` | `visual.elementAdded` |
| A-502 | `void addDataSource(SceneId sceneId, ProtocolId protocolId)` | `VIZ_PROTO_INVALID` | `visual.sourceAdded` |
| A-503 | `void bindFieldToElement(SessionId sessionId, FieldId fieldId, SceneElementId elementId)` | `VIZ_BIND_INVALID` | `visual.fieldBound` |
| A-504 | `void connectNodes(SceneId sceneId, NodeId fromNode, NodeId toNode)` | `VIZ_CONNECT_INVALID` | `visual.nodesConnected` |
| A-505 | `JSON saveScene(SceneId sceneId)` | — | `visual.sceneSaved` |
| A-506 | `RenderData renderData(SceneId sceneId, FieldPool fieldPool)` | — | — |
| A-507 | `SceneId createScene(string name)` | `VIZ_PARAM_INVALID` | `visual.sceneCreated` |
| A-508 | `void deleteScene(SceneId sceneId)` | `VIZ_SCENE_NOT_FOUND` | `visual.sceneDeleted` |
| A-509 | `void updateScene(SceneId sceneId, string name)` | `VIZ_SCENE_NOT_FOUND / VIZ_PARAM_INVALID` | `visual.sceneRenamed` |
| A-510 | `void updateElement(SceneId sceneId, SceneElementId elementId, ElementProps props)` | `VIZ_ELEMENT_NOT_FOUND / VIZ_PARAM_INVALID` | `visual.elementUpdated` |
| A-511 | `void deleteElement(SceneId sceneId, SceneElementId elementId)` | `VIZ_ELEMENT_NOT_FOUND` | `visual.elementDeleted` |
| A-512 | `void removeDataSource(SceneId sceneId, ProtocolId protocolId)` | `VIZ_SOURCE_NOT_FOUND` | `visual.sourceRemoved` |
| A-513 | `void deleteConnection(SceneId sceneId, NodeId fromNode, NodeId toNode)` | `VIZ_CONNECT_INVALID` | `visual.connectionDeleted` |
| A-514 | `void manageViews(SceneId sceneId, ViewAction action, ViewData data)` | `VIZ_VIEW_INVALID` | `visual.viewChanged` |
| A-515 | `void manageCustomElement(SceneId sceneId, CustomElement element)` | `VIZ_CUSTOM_INVALID` | `visual.customElementChanged` |

`ElementType`：对齐 `visual-scene.schema.json` `elements.item.type` 全枚举（`number|gauge|waveform|bar|switch|attitude|text`）。D-52 为 **TUI 收敛**（TUI 仅支持 `waveform|bar`），GUI 宿主仍使用全组件库；A-501 入参 `ElementType` 以 schema 全枚举为准，宿主按自身能力渲染。场景 JSON 符合 `visual-scene.schema.json`。

## 5. TerminalService（终端模块 / 05）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-601 | `void focusInput()` | — | `terminal.focusChanged` |
| A-602 | `void submitLine(string line)` | `TERM_LINE_INVALID` | `terminal.lineSubmitted` |
| A-603 | `void sendToDevice(string line)` | `TERM_CONN_INVALID` | `terminal.sent` |
| A-604 | `void toggleEcho(bool on)` | — | `terminal.echoChanged` |
| A-605 | `void clearScreen()` | — | — |
| A-606 | `void reset()` | — | `terminal.reset` |
| A-607 | `void runQuickCommand(QuickCommandId id)` | `TERM_CMD_NOT_FOUND` | `terminal.quickCmdRun` |
| A-608 | `bool dangerCmdConfirm(string cmd)` | `TERM_DANGER_CONFIRM` | `terminal.dangerConfirm` |
| A-609 | `void manageQuickCommand(QuickCommandId id, QuickCommand cmd)` | `TERM_CMD_INVALID` | `terminal.quickCmdChanged` |
| A-610 | `TerminalLine[] getHistory(HistoryQuery query)` | — | — |
| A-611 | `void runPlaceholder(IOTerminalPlaceholder placeholder, string value)` | `TERM_PLACEHOLDER_INVALID` | `terminal.sent` |

## 6. CommandService（命令自动化模块 / 06）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-701 | `CommandGroupId createCommandGroup(string name, CommandItem[] commands)` | `CMD_PARAM_INVALID` | `cmd.groupCreated` |
| A-702 | `void play(CommandGroupId groupId)` | `CMD_STATE_INVALID / CMD_CONN_INVALID` | `cmd.stateChanged(running)` |
| A-703 | `void pause()` | `CMD_STATE_INVALID` | `cmd.stateChanged(paused)` |
| A-704 | `void step()` | `CMD_STATE_INVALID` | `cmd.stepDone` |
| A-705 | `void stop()` | `CMD_STATE_INVALID` | `cmd.stateChanged(done)` |
| A-706 | `Macro recordMacro(string name)` | `CMD_MACRO_INVALID` | `cmd.macroRecorded` |
| A-707 | `ExecStatus getStatus()` | — | — |
| A-708 | `void updateCommandGroup(CommandGroupId id, string name, CommandItem[] commands)` | `CMD_NOT_FOUND / CMD_PARAM_INVALID` | `cmd.groupUpdated` |
| A-709 | `void deleteCommandGroup(CommandGroupId id)` | `CMD_NOT_FOUND / CMD_STATE_INVALID` | `cmd.groupDeleted` |
| A-710 | `CommandGroupSummary[] listCommandGroups()` | — | — |
| A-711 | `void setLoop(bool on, ms_t loopInterval)` | `CMD_PARAM_INVALID` | `cmd.loopChanged` |
| A-712 | `void reset(CommandGroupId id)` | `CMD_NOT_FOUND` | `cmd.stateChanged(pending)` |
| A-713 | `void playMacro(MacroId id)` | `CMD_MACRO_NOT_FOUND` | `cmd.stateChanged(running)` |
| A-714 | `void deleteMacro(MacroId id)` | `CMD_MACRO_NOT_FOUND` | `cmd.macroDeleted` |
| A-715 | `void manageScripts(ScriptAction action, ScriptData data)` | `CMD_SCRIPT_INVALID` | `cmd.scriptChanged` |
| A-716 | `void startMacroRecording()` | `CMD_MACRO_INVALID` | `cmd.macroRecordingStarted` |
| A-717 | `Macro stopMacroRecording(string name)` | `CMD_MACRO_INVALID` | `cmd.macroRecorded` |
| A-718 | `MacroSummary[] listMacros()` | — | — |

> A-706 `recordMacro(name)` 为旧宏录制入口（录制完成即保存，D-29）；A-716/A-717 为完整录制流程（开始→停止保存）。两套并存，实现可统一为 A-716/A-717，`recordMacro` 兼容保留。`MacroSummary`：`{ id, name, operationCount }`。

Python SDK（D-28/D-30），经 CommandService 转发，SDK 层不含设备 I/O：

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| P-701 | `void connect(SessionId sessionId)` | `CMD_SDK_CONN` | `session.stateChanged(connecting)` |
| P-702 | `void send(bytes data)` | `CMD_SDK_SEND` | `buffer.sent` |
| P-703 | `bytes read()` | `CMD_SDK_READ` | — |
| P-704 | `void run_command_group(string name)` | `CMD_NOT_FOUND` | `cmd.stateChanged(running)` |
| P-705 | `void on_data(callback cb)` | — | `buffer.dataReceived → cb` |
| P-706 | `void wait_for(predicate pred, timeout_t timeout)` | `CMD_SDK_TIMEOUT` | — |
| P-707 | `void sleep(ms_t ms)` | — | — |
| P-708 | `FieldValue get_field(string name)` | `CMD_FIELD_NOT_FOUND` | — |
| P-709 | `void set_field(string name, FieldValue value)` | `CMD_FIELD_INVALID` | `field.updated` |
| P-710 | `bytes build_frame(FieldValue[] fields, ProtocolSchema schema)` | `CMD_FRAME_INVALID` | — |
| P-711 | `void log(string msg)` | — | `cmd.sdkLog` |
| P-712 | `void on_connect(callback cb)` | — | `session.stateChanged(online) → cb` |
| P-713 | `void on_disconnect(callback cb)` | — | `session.stateChanged(offline) → cb` |

> P-709~P-713 为 06.5.2 脚本扩展接口（D-30「SDK 接口清单已列全」）：`set_field` 写字段池（与可视化联动）、`build_frame` 协议组帧（对应 A-412）、`log` 执行日志、`on_connect/on_disconnect` 连接状态事件。SDK 层不含设备 I/O，均经 CommandService 转发。

## 7. SettingsService（设置模块 / 07）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-801 | `SettingValue get(string key, Scope scope)` | `CFG_KEY_NOT_FOUND` | — |
| A-802 | `void set(string key, SettingValue value, Scope scope)` | `CFG_PARAM_INVALID / CFG_ONLINE_LOCKED` | `cfg.changed` |
| A-803 | `void apply(string key)` | `CFG_NOT_FOUND` | `cfg.applied` |
| A-804 | `void save(string key)` | `CFG_IO_FAILED` | `cfg.saved` |
| A-805 | `void resetToDefault(string key)` | `CFG_KEY_NOT_FOUND` | `cfg.reset` |
| A-806 | `void setTheme(ThemeId themeId)` | `CFG_THEME_INVALID` | `cfg.themeChanged` |

Scope 属 Domain 层纯业务模型（13.3.4 裁定 SSOT，g/s/t 三级），持久化在 Core FileRepository。

## 8. RouteService（交互路由模块 / 08）

| 编号 | 签名 | 错误码 | 发射事件 |
|---|---|---|---|
| A-901 | `void setView(SessionId id, ViewId view)` | `ROUTE_VIEW_INVALID` | `route.viewChanged` |
| A-902 | `void openModule(SessionId id, ModuleId module)` | `ROUTE_MODULE_INVALID` | `route.moduleOpened` |
| A-903 | `void selectSession(SessionId id)` | `ROUTE_SESSION_INVALID` | `route.sessionSelected` |
| A-904 | `void backToLastView()` | `ROUTE_NO_BACK` | `route.backRestored` |

路由状态符合 `route-state.schema.json`。

---

## 9. DevicePort / DevicePortEnumerator 接口（Core 层，L2-001）

> 跨平台设备抽象接口，由 Domain 定义、Core 实现（SerialWorker / NetworkTransport / PortEnumerator）。测试可用 mock 替换（15.5）。UI/Service 不直接调用，经会话 connect/disconnect 间接使用；串口枚举经 §1 A-214 用例。

```text
interface DevicePort {
  open(config: ConnectTarget) -> Result      // 打开连接
  close() -> Result                          // 关闭连接
  write(data: Bytes) -> Result               // 发送
  read() -> Bytes                            // 读取（或回调 onData）
  onData(callback)                           // 数据到达回调，转 buffer.dataReceived
  onDisconnect(callback, reason)             // 异常断开回调（设备拔出/对端关闭），转 session.stateChanged(offline)
  onError(callback, ErrorCode)               // 错误上报（打开失败/收发错误），转错误码
  isOpen() -> bool
  // 探测（D-53 低优先级，架构预留）
  probe(params, onCriteria) -> ProbeResult   // 离线可检测，结果回填确认后连接
}

// 系统级设备发现（连接前枚举可用串口），语义独立于单个连接实例 DevicePort
interface DevicePortEnumerator {
  listAvailablePorts() -> PortInfo[]         // 枚举系统可用串口，含 pty 等非标准设备
}
```

实现：串口用 `SerialWorker`，网络用 `NetworkTransport`，枚举用 `PortEnumerator`（见 13.3 Core 层组件）。DevicePortEnumerator 的 `listAvailablePorts` 落地调用 `QSerialPortInfo::availablePorts` 等平台枚举并映射为 `PortInfo[]`。

## 错误码约定

- 命名：`模块前缀_语义`，全大写。前缀：`SESS`（会话）、`BUF`（字节流）、`PROTO`（协议）、`VIZ`（可视化）、`TERM`（终端）、`CMD`（命令）、`CFG`（设置）、`ROUTE`（路由）。
- 新增错误码（本轮接口完整性评审补齐）：
  - 会话域：`SESS_PORT_ENUM_FAILED`（串口枚举失败，A-214）、`SESS_PORT_BUSY`（端口被占用，A-206）、`SESS_PORT_OPEN_FAILED`（端口打开失败，A-206）、`SESS_ACCESS_DENIED`（权限拒绝，A-206）、`SESS_PROBE_FAILED`（探测失败，A-212）。
  - 字节流域：`BUF_RECORDING_INVALID`（录制配置非法，A-310）、`BUF_NOT_RECORDING`（当前未在录制，A-311）、`BUF_RESPONSE_TIMEOUT`（等待应答超时，A-312）。
  - 命令域：`CMD_MACRO_INVALID`（宏录制状态非法，A-716/A-717）。
  - Python SDK 域：`CMD_SDK_CONN`（连接失败）、`CMD_SDK_SEND`（发送失败）、`CMD_SDK_READ`（读取失败）、`CMD_SDK_TIMEOUT`（等待超时）、`CMD_FIELD_NOT_FOUND`（字段不存在，P-708）、`CMD_FIELD_INVALID`（字段值非法，P-709）、`CMD_FRAME_INVALID`（组帧失败，P-710）。
- 通用前置错误：`ERR_PRECONDITION`（前置不满足时统一返回）。
- 错误码是契约的一部分，实现必须返回本表定义的码，测试据此断言（15 章）。

## 约束

- 接口签名变更必须同步本契约，且为 SSOT 更新（同步 14 章 API 规格）。
- 接口不暴露内部实现细节（最小充分原则）。
- 所有跨模块调用遵循分层依赖单向（UI→Service→Domain→Core），禁止反向。
- 事件名与 `events.md` 一致；错误码与本节表一致；签名与 14 章一致。