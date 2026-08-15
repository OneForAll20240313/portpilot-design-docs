# PortPilot 事件定义契约（events.md）

> 本文件是事件契约的 SSOT。所有跨模块事件必须在此定义，模块间只通过这里的事件通信，不直接依赖对方内部实现。事件采用发布/订阅模型，由 `Core EventLoop` 统一派发（D-47）。

## 事件命名与结构

- 事件名采用 `域名.动作` 形式，如 `session.stateChanged`。
- 每个事件负载为一个 JSON 对象。
- 订阅方通过 `on(事件名, 回调)` 订阅；`Core EventLoop` 负责跨线程派发。
- 本清单与 14 章模块设计的"对外 API 规格"（编号 A-xxx / P-xxx 的"发射事件"列）一一对应，是实现与测试的 SSOT 依据。

## 事件清单（按域分组）

### 1. 会话域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `session.created` | `{ id, name }` | 会话创建 | A-201 |
| `session.selected` | `{ id }` | 会话选中（切换） | A-202 |
| `session.duplicated` | `{ id, newId, name }` | 会话复制（D-41 只复制连接+缓冲参数） | A-203 |
| `session.renamed` | `{ id, name }` | 会话重命名 | A-204 |
| `session.deleted` | `{ id }` | 会话删除 | A-205 |
| `session.stateChanged` | `{ id, state, prevState }` | 状态机四态迁移（D-38：offline/connecting/online/disconnecting） | A-206/A-207 |
| `session.modeChanged` | `{ id, mode }` | 会话模式切换（bytes/terminal 互斥） | A-208 |
| `session.statsUpdated` | `{ id, rxBytes, txBytes, rxSpeed, connectionDuration, bufferUsage }` | 收发统计更新（含连接时长与缓冲占用） | A-206/A-207（连接在线期间由 DevicePort 数据回调驱动） |
| `session.statsReset` | `{ id }` | 收发统计清零 | A-210 |
| `session.logExported` | `{ id, path }` | 会话日志导出 | A-211 |
| `session.probeDone` | `{ params, result }` | 端口探测完成 | A-212 |
| `session.persisted` | `{}` | 会话持久化保存 | A-213 |

### 2. 字节流域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `buffer.dataReceived` | `{ connectionId, bytes, timestamp }` | 数据帧到达（承接 DevicePort 收字节，14.3 接收入口） | A-301 |
| `buffer.sent` | `{ connectionId, bytes }` | 字节发送成功 | A-302/A-309 |
| `buffer.searchDone` | `{ keyword, matches }` | 搜索完成 | A-304 |
| `buffer.strategyChanged` | `{ strategy, size, overflow }` | 缓冲策略变更 | A-305 |
| `buffer.overflow` | `{ connectionId, strategy, dropped }` | 缓冲溢出（环形丢弃最旧，overflow=drop-oldest 时） | — |
| `buffer.cleared` | `{ connectionId }` | 接收缓冲清空 | A-306 |
| `buffer.tagChanged` | `{ tagId, def }` | 标签/调色板/高亮开关变更 | A-307 |
| `buffer.lineControlChanged` | `{ connectionId, rts, dtr }` | RTS/DTR 电平控制变更 | A-308 |

### 3. 协议域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `protocol.frameParsed` | `{ protocolId, frame }` | 解析出完整帧 | A-401 |
| `protocol.fieldExtracted` | `{ protocolId, frameId, fieldId, value }` | 字段提取成功 | A-402 |
| `protocol.defined` | `{ protocolId, name }` | 协议定义创建 | A-403 |
| `protocol.exported` | `{ protocolId }` | 协议导出 | A-404 |
| `protocol.toGlobal` | `{ protocolId }` | 协议转为全局模板（D-44） | A-405 |
| `protocol.invalidFrame` | `{ protocolId, reason }` | 非法帧丢弃并记日志 | — |
| `field.updated` | `{ protocolId, fieldId, value, timestamp }` | 字段写入字段池（环形缓冲 500 条），可视化/命令消费 | A-406 |
| `protocol.updated` | `{ protocolId, name }` | 协议定义更新 | A-407 |
| `protocol.deleted` | `{ protocolId }` | 协议定义删除 | A-408 |
| `protocol.imported` | `{ protocolId }` | 协议导入 | A-410 |
| `protocol.duplicated` | `{ protocolId, newId }` | 协议复制 | A-411 |
| `protocol.templateChanged` | `{ action, templateId }` | 协议模板增删改 | A-413 |
| `protocol.sent` | `{ connectionId, bytes }` | 协议帧发送成功（组帧后写设备，A-412→A-414/A-415） | A-414/A-415 |
| `protocol.loopbackDone` | `{ connectionId, ok, matched }` | 回环验证完成（发送→接收→响应比对） | A-416 |

### 4. 可视化域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `visual.elementAdded` | `{ sceneId, elementId, type }` | 场景元素添加 | A-501 |
| `visual.sourceAdded` | `{ sceneId, protocolId }` | 数据源添加 | A-502 |
| `visual.fieldBound` | `{ sceneId, elementId, fieldRef }` | 字段绑定到元素 | A-503 |
| `visual.nodesConnected` | `{ sceneId, fromNode, toNode }` | 节点连线 | A-504 |
| `visual.sceneSaved` | `{ sceneId }` | 场景保存为 JSON（D-07） | A-505 |
| `visual.sceneCreated` | `{ sceneId, name }` | 场景创建 | A-507 |
| `visual.sceneDeleted` | `{ sceneId }` | 场景删除 | A-508 |
| `visual.sceneRenamed` | `{ sceneId, name }` | 场景重命名 | A-509 |
| `visual.elementUpdated` | `{ sceneId, elementId, props }` | 元素属性（刷新频率/量程/颜色/阈值）更新 | A-510 |
| `visual.elementDeleted` | `{ sceneId, elementId }` | 场景元素删除 | A-511 |
| `visual.sourceRemoved` | `{ sceneId, protocolId }` | 数据源移除 | A-512 |
| `visual.connectionDeleted` | `{ sceneId, fromNode, toNode }` | 节点连线删除 | A-513 |
| `visual.viewChanged` | `{ sceneId, viewId, action }` | 视图增删/切换 | A-514 |
| `visual.customElementChanged` | `{ sceneId, elementId }` | 自定义元素变更 | A-515 |

### 5. 终端域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `terminal.focusChanged` | `{ focus: input|area }` | 输入焦点切换（决定换行归属） | A-601 |
| `terminal.lineSubmitted` | `{ line }` | 行提交（命令结束符或 `\r\n` 发送） | A-602 |
| `terminal.sent` | `{ connectionId, content }` | 直通输入发送 | A-603/A-611 |
| `terminal.echoChanged` | `{ on }` | 回显开关变更 | A-604 |
| `terminal.reset` | `{}` | 终端重置 | A-606 |
| `terminal.quickCmdRun` | `{ id, label }` | 快捷命令执行（9 个） | A-607 |
| `terminal.dangerConfirm` | `{ cmd, confirmed }` | 危险命令二次确认（D-20 白名单） | A-608 |
| `terminal.quickCmdChanged` | `{ id, action }` | 快捷命令增删改 | A-609 |

### 6. 命令域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `cmd.groupCreated` | `{ groupId, name }` | 命令组创建 | A-701 |
| `cmd.stateChanged` | `{ groupId, state }` | 执行状态五态（D-25：pending/running/paused/done/error） | A-702~A-705/A-712/A-713 |
| `cmd.stepDone` | `{ groupId, index }` | 单步执行完成 | A-704 |
| `cmd.macroRecorded` | `{ name, macro }` | 宏录制完成（D-29） | A-706 |
| `cmd.groupUpdated` | `{ groupId, name }` | 命令组更新 | A-708 |
| `cmd.groupDeleted` | `{ groupId }` | 命令组删除 | A-709 |
| `cmd.loopChanged` | `{ on, interval }` | 循环播放开关/间隔变更 | A-711 |
| `cmd.macroDeleted` | `{ macroId }` | 宏删除 | A-714 |
| `cmd.scriptChanged` | `{ action, scriptId }` | 脚本导入/编辑/删除 | A-715 |

### 7. 设置域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `cfg.changed` | `{ key, value, scope }` | 配置变更（scope：g/s/t） | A-802 |
| `cfg.applied` | `{ key }` | 配置应用 | A-803 |
| `cfg.saved` | `{ key }` | 配置持久化 | A-804 |
| `cfg.reset` | `{ key }` | 恢复默认 | A-805 |
| `cfg.themeChanged` | `{ themeId }` | 主题切换 | A-806 |

### 8. 交互路由域

| 事件 | 负载 | 说明 | 对应 API |
|---|---|---|---|
| `route.viewChanged` | `{ currentView }` | 会话视图切换（三视图互斥） | A-901 |
| `route.moduleOpened` | `{ currentModule }` | 模块打开（三模块互斥） | A-902 |
| `route.sessionSelected` | `{ currentSessionId }` | 会话选择（模块内切换规则） | A-903 |
| `route.backRestored` | `{ lastView }` | lastView 返回档位还原 | A-904 |

## 订阅接口（示意）

```text
on('session.stateChanged', (e) => { ... })       // 会话树/UI 订阅
on('field.updated', (e) => { ... })              // 可视化/命令 get_field 消费
on('buffer.dataReceived', (e) => { ... })        // UI 渲染 / 协议取帧
on('route.viewChanged', (e) => { ... })          // 宿主视图渲染
```

## 约束

- 事件负载必须符合上表结构，新增字段须同步更新本契约。
- 事件不自带业务逻辑，只承载数据。
- 事件名与 14 章 API 规格的"发射事件"列必须一致；若修改事件名，须同步 14 章、15 章与各模块。
- 跨模块事件必须经 `Core EventLoop` 派发，禁止直接函数回调跨越限界上下文（D-47）。