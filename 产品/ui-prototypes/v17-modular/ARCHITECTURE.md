# PortPilot UI Prototype v16 - 模块化架构

## 架构设计原则

遵循 PortPilot 多智能体共创治理规范（11章）：
- **契约优先**：模块间通过定义好的函数接口交互
- **SSOT**：设计 token、状态定义、路由规则唯一来源
- **限界上下文**：按业务域拆分模块，边界清晰
- **变更门禁**：每个模块可独立评审、独立迭代

## 目录结构

```
portpilot-ui-prototype/
├── index.html                 # 入口文件（壳 + 资源加载）
├── css/
│   ├── tokens.css             # 设计 Token（颜色、字体、主题变量）
│   ├── base.css               # 基础样式（重置、滚动条、背景图）
│   ├── layout.css             # 布局样式（应用骨架、工具栏、状态栏）
│   └── modules/               # 模块级样式（按限界上下文）
│       ├── shared.css         # 通用组件（模态框、Toast、右键菜单）
│       ├── session.css        # 会话管理模块
│       ├── bytestream.css     # 字节流模块
│       ├── terminal.css       # 终端模块
│       ├── protocol.css       # 协议解析模块
│       ├── dashboard.css      # 仪表盘模块
│       ├── visualization.css  # 可视化模块
│       ├── command.css        # 命令自动化模块
│       └── settings.css       # 设置与日志模块
├── js/
│   ├── app.js                 # 应用核心（状态、路由、初始化）
│   └── modules/               # 模块级逻辑（按限界上下文）
│       ├── shared.js          # 通用工具函数
│       ├── session.js         # 会话管理
│       ├── bytestream.js      # 字节流
│       ├── terminal.js        # 终端
│       ├── protocol.js        # 协议解析
│       ├── dashboard.js       # 仪表盘
│       ├── visualization.js   # 可视化
│       ├── command.js         # 命令自动化
│       └── settings.js        # 设置与日志
└── pages/                     # 历史单文件版本（参考对比用）
    └── prototype-v16-enhanced.html
```

## UI 分层架构（z-index 体系）

| 层级 | z-index | 内容 |
|------|---------|------|
| 背景图层 | 0 | `#bgLayer` |
| 蒙版层 | 1 | `#maskLayer` |
| 应用容器 | 2 | `#app` |
| 工作区内容 | 3 | 主内容区 |
| 侧边栏/工具栏 | 4-5 | 左侧会话栏、顶部工具栏 |
| 状态栏 | 5 | 底部状态栏 |
| 右键菜单 | 100 | 上下文菜单 |
| 模态框遮罩 | 200 | 模态框背景遮罩 |
| 模态框主体 | 201 | 模态框内容 |

## 路由模型（两级路由）

```
一级路由：视图切换（三视图互斥）
  view-bytes     ←→  view-terminal  ←→  view-protocol

二级路由：模块切换（三模块互斥，覆盖在视图上）
  page-viz  ←→  page-cmd  ←→  page-settings
```

## 模块依赖图

```
                    ┌──────────┐
                    │  app.js  │  (状态/路由/初始化)
                    └────┬─────┘
                         │ 依赖
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌──────────┐
  │ session  │    │  shared  │    │ settings │
  └────┬─────┘    └──────────┘    └──────────┘
       │
  ┌────┴─────┬────────┬─────────┐
  ▼          ▼        ▼         ▼
bytes   terminal  protocol  dashboard
stream                      /
                        visualization
                              \
                             command
```

## 共创规范

1. **修改模块内样式**：直接改对应 `css/modules/xxx.css`
2. **修改模块逻辑**：直接改对应 `js/modules/xxx.js`
3. **新增主题色**：改 `css/tokens.css`（不要在模块文件里硬编码颜色）
4. **新增通用组件**：放 `css/modules/shared.css` + `js/modules/shared.js`
5. **修改路由/状态**：改 `js/app.js`，需评审通过
6. **修改布局结构**：改 `css/layout.css` + `index.html`，需评审通过

## 版本说明

- v16-enhanced：功能补全版（单文件，历史参考）
- v16-modular：模块化架构版（当前开发版，index.html 为入口）
