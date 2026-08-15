# 测试说明

本目录用于沉淀 PortPilot 的测试相关文档与测试报告。

## 目录结构

| 子目录/文件 | 内容 |
|------------|------|
| `reports/` | 人工验收测试报告，按「`<功能>-<yyyy-mm-dd>.md`」命名统一归档 |
| `test_recovery.txt` | 测试遗留件（占位符） |

## 测试报告规范

任何测试必须留下统一格式的测试报告，可追溯。详见根级准则《项目共创准则.md》「验收标准规范 · 测试报告统一规范」。

### 两类报告

1. **人工验收报告**（本目录 `reports/`）：覆盖真实场景、边界、权限等验收测试，人工执行并留档，是验收的权威证据（正文）。
2. **自动化测试报告**（CI 产出）：由**代码仓库（qtSerial）** 的 GitHub Actions 运行单元/集成测试，产出 JUnit/覆盖率报告，经 `dorny/test-reporter` 发布到 PR Checks，并按 workflow run ID 可追溯。

> **CI 归属约定**：本仓库为纯文档仓库，不创建/不存放测试 CI workflow。运行测试并产出可追溯报告的 CI workflow **统一放在代码仓库 `qtSerial`**（`.github/workflows/test.yml`），随代码提交/PR 触发，产出 JUnit/覆盖率报告并归档。验收时到 qtSerial 的 Actions 页面按 run ID 回溯。

### 验收关联

- 以 `reports/` 下的人工报告为权威证据；
- 在对应任务 Issue 评论中附：结论 + 指向仓库报告的链接 + CI run 链接；
- GitHub Projects 看板以「列 = 验收状态」呈现（待研发→研发中→待验收→已验收→已关闭），任务移至「已验收」前必须已附测试报告链接。

## 测试报告模板

新建验收报告时，复制 `reports/_TEMPLATE.md` 到 `reports/<功能>-<yyyy-mm-dd>.md` 后填写。