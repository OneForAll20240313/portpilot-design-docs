# PortPilot UI 模块契约

## 模块间依赖规则（遵循治理规范 M3 限界上下文）

### 允许的依赖方向

```
session ← bytestream
session ← terminal
session ← protocol
protocol ← visualization
session ← command
(all) ← settings
```

### 禁止

- ❌ 反向依赖（session 不能依赖 protocol）
- ❌ 循环依赖
- ❌ 直接操作其他模块的内部 DOM
- ✅ 通过公开函数接口交互

## 公开接口契约

### session 模块
- `selectSession(id)` - 选择会话
- `setSessionState(id, state)` - 设置会话状态（online/offline/connecting/disconnecting）
- `toggleConnect()` - 切换连接状态
- `renameSession(node)` - 重命名会话
- `createSession()` / `duplicateSession()` / `deleteSession()`

### bytestream 模块
- `syncHexAscii(scrollHex)` - 同步十六进制与ASCII视图
- `toggleHex()` - 切换十六进制显示
- `bytesSearch(keyword)` - 搜索字节流

### terminal 模块
- `sendTermCmd()` - 发送终端命令
- `toggleTerminalWrap()` - 切换自动换行

### protocol 模块
- `protoSwitchTab(tab, btn)` - 切换协议标签页
- `protoSimulateParse()` - 模拟解析
- `protoFilterTree(keyword)` - 搜索过滤协议树

### visualization 模块
- `vizSetTimeRange(range, btn)` - 设置时间范围
- `vizToggleLink(checkbox)` - 切换联动
- `vizAddFilter()` / `vizRemoveFilter()` / `vizClearFilters()` - 筛选管理

### command 模块
- `cmdPlay()` / `cmdPause()` / `cmdStop()` / `cmdStep()` - 执行控制
- `cmdAddRow()` / `cmdDeleteRow()` / `cmdMoveRow()` - 命令行管理
- `cmdCreateGroup()` / `cmdRenameGroup()` / `cmdDeleteGroup()` - 命令组管理

### settings 模块
- `setSettingsTab(btn, tab)` - 切换设置分类
- `setTheme(cls)` - 切换主题
- `applyCustomColor(color)` - 自定义主色
- `applyBg()` / `clearBg()` - 背景图管理
- `logSearch(keyword)` - 日志搜索
- `settingsSave()` / `settingsResetAll()` - 设置保存/重置

### shared (app.js 内)
- `showToast(msg, type)` - 提示消息
- `openModal(id)` / `closeModal(id)` - 模态框
- `showCtxMenu(x, y, items)` / `hideCtxMenu()` - 右键菜单
- `switchView(view, btn)` - 视图切换
- `openModule(moduleId)` / `closeModule()` - 模块切换
