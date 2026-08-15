# PortPilot 设计文档仓库

PortPilot 串口调试工具的产品设计、架构设计与研发文档库，按标准软件开发流程分阶段组织。

> **⚠️ 所有共创智能体（agent）必读**：请先阅读并遵守仓库根级强制准则 [《项目共创准则.md》](项目共创准则.md)（AGENTS.md），涵盖需求、验收、研发规范、仓库治理、沙箱机制、开发环境、编译约束。本文件为导航，准则为约束。

## 目录结构

| 阶段目录 | 内容 | 说明 |
|---------|------|------|
| `需求/` | 产品定义文档 | 产品定义 v3/v4/v5 及根文档、编写规划 plan.md |
| `产品/` | 产品设计稿与原型 | 16 章设计稿、UI 原型历史版本、产品文档、页面设计规范 |
| `架构/` | 架构设计与重构方案 | 架构评审、研发流程与质量门禁、重构计划 |
| `研发/` | 研发阶段文档 | 缺陷/问题报告等研发过程文档 |
| `测试/` | 测试阶段文档 | 测试遗留件与说明 |
| `交付/` | 交付阶段文档 | 发布说明、变更日志 |

## 明细

### 需求
- `product-definition/` — 产品定义文档（根版 + v3/v4/v5 历史版本），定义产品定位、目标用户、核心价值与功能规范
- `product-definition/plan.md` — 产品定义文档编写规划（风格、章节结构、设计系统）

### 产品
- `portpilot-design/` — 16 章产品设计稿（含 `_shared/css/design.css` 共享样式与 `contracts/` 契约），是产品设计的权威版本
- `ui-prototypes/` — UI 原型历史版本（v11–v15 及基础版）
- `product-docs/` — 产品文档 v2/v3、使用手册、页面设计规范
- `product-def/` — 产品定义精简版（含 `_shared/` 共享资源）

### 架构
- `engineering-process/` — 研发流程与质量门禁
- `architecture-review/` — 架构评审文档
- `refactor-plans/` — 重构计划（`serial-refactor-plan/`、`serial-qml-refactor/`）

### 研发
- `github-issue-2071-related.md` — 工具缺陷报告

### 测试
- `test_recovery.txt` — 测试遗留件（占位符）

### 交付
- 发布说明、变更日志（无二进制/发行包）

## 说明
- 本仓库为纯文档仓库，不存放代码工程、构建产物与发行包。
- 涉及代码工程（如 qtSerial）请访问对应源码仓库。
- 品牌线说明：当前产品为 **PortPilot**（根版 `product-definition.html`，v2）。`product-definition-v3/v4/v5` 为前代 **SuperConnect** 命名线的历史归档版本，非 PortPilot 的演进版本，仅作过程留档，不作为当前需求依据。