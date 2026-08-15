# PortPilot 多 Agent 协同框架

> 本文件定义 PortPilot 项目**多个共创智能体（agent）如何协同工作**的机制：agent 身份如何确认、进度如何被监控、任务如何分工与认领、冲突如何避免。它是《项目共创准则.md（AGENTS.md）》的协同执行细则，与准则配套使用。
>
> 适用对象：进度监控 agent（PM）、代码编写 agent（Dev）、以及任何在本项目并发工作的 agent。

---

## 一、设计原则

1. **看板即唯一事实源（Kanban as Single Source of Truth）**：所有任务的**存在、认领、状态、归属、验收**都以 GitHub Projects 看板为准。任何 agent 不得凭记忆或本地推测判断"有哪些活、谁在做、做到哪步"，一律以看板实际数据为准。
2. **显式角色（Explicit Roles）**：每个 agent 会话启动即声明角色，角色决定它能做什么、不能做什么（权限边界）。
3. **认领加锁（Claim-with-Lock）**：任务一旦被某 agent 认领（`assignee=自己`），对其他 agent 即"加锁"，避免多头并行抢占同一任务。
4. **状态机合法流转（Legitimate State Flow）**：看板状态列只能按定义的方向流转，禁止跳列，保证进度可追溯、可审计。
5. **证据可回溯（Traceable Evidence）**：每个任务的状态推进必须附可观测证据（PR、CI run、测试报告），无证据不推进。

---

## 二、协同模型总览

```
┌──────────────────────────────────────────────────────┐
│            GitHub Projects 看板（唯一事实源）           │
│   待研发 → 研发中 → 待验收 → 已验收 → 已关闭            │
│   （assignee / milestone / 状态字段 在此维护）           │
└──────────────────────────────────────────────────────┘
         ▲ 认领/更新/汇报                ▲ 扫描/调度/校验
         │                               │
┌────────┴─────────┐          ┌──────────┴─────────┐
│  代码编写 agent   │◄────────►│   进度监控 agent    │
│  (Dev, 可多个)    │  阻塞/完成 │   (PM, 仅一个)      │
└──────────────────┘  通报     └────────────────────┘
```

- **Dev（代码编写）**：只做「认领 → 实现 → 测试 → PR → 移列」，与"做什么"无关的看板治理动作（建任务、拆任务、调里程碑）一律不做。
- **PM（进度监控）**：只做「扫描 → 调度 → 校验 → 报告」，不直接写功能代码，专注于让整个流水线有序前进。

---

## 三、Agent 角色与身份确认

### 3.1 角色定义

| 角色 | 代号 | 数量 | 核心职责 | 允许的动作 | 禁止的动作 |
|------|------|------|---------|-----------|-----------|
| 进度监控 agent | PM | 1 | 盯全局进度、调度任务、校验状态流转、产出进度报告 | 扫描看板、创建/拆分任务、设置里程碑、校验并纠正状态列、汇总报告 | 认领并实现功能代码 |
| 代码编写 agent | Dev | ≥1 | 认领需求、实现功能、跑测试、提交 PR | 认领任务、实现代码、编译测试、提交 PR、将本人任务移列 | 创建/拆分任务、调整里程碑、治理其它任务 |

### 3.2 身份确认机制

每个 agent 会话启动时，**必须**按以下顺序确认身份与权限边界，确认完成前不得执行任何看板写操作：

1. **读 AGENTS.md**：进入任何会话，先读仓库根《项目共创准则.md》与本文档，明确自身角色。
2. **角色注入**：角色由外部启动参数强注入，`AGENT_ROLE=pm|dev`。**未注入角色时一律视为只读巡检**（只能扫描看板、读文档，禁止任何认领/写状态等动作），避免 agent 自行扩展权限。agent 会话启动时必须自检：若 `AGENT_ROLE` 未设置或无法确认，则降级为只读，不得执行写操作。
3. **看板 assignee 校验**：agent 只能操作 `assignee` 为自己、或 `assignee` 为空（无人认领）的任务。操作他人已认领任务 = 越权，应被拒绝并报告 PM。
4. **能力边界不可越**：PM 不做功能实现，Dev 不做任务治理。越界动作应被 PM 或评审 subagent 拦截。
5. **角色自检断言**：每次执行写操作（认领/移列/改里程碑）前，agent 必须断言自身角色与目标权限匹配；断言失败即中止并报告，不静默继续。

### 3.3 身份标识落地

- 看板 assignee 字段即 agent 的"工牌"。认领动作 = 把 `assignee` 设为自己 + 状态置为「研发中」，二者须在同一原子操作内完成，避免半认领。
- **认领原子操作落地方式**：由于 gh CLI 对 Issue assignee 与项目 status 是两个不同接口，无法单次原子化，采用"先写后读校验"补偿模式：
  ```bash
  # 1. 设 assignee（Issue 层）
  gh issue edit $NUM --add-assignee @me -R OneForAll20240313/PortPilot
  # 2. 移动项目状态列（项目层）
  gh project item-edit --id "$ITEM_ID" --project-id "$P" --field-id "$FID" --single-select-option-id "$OPT_ID"
  # 3. 回读校验：确认 assignee.login==自己 且 status.name=="研发中"
  GH_ASSIGNEE=$(gh issue view $NUM -R OneForAll20240313/PortPilot --json assignees --jq '.assignees[0].login')
  GH_STATUS=$(gh project item-list $PROJ --owner OneForAll20240313 --jq ".items[] | select(.content.number==$NUM) | .status.name")
  if [ "$GH_ASSIGNEE" != "自己" ] || [ "$GH_STATUS" != "研发中" ]; then
    echo "认领原子操作失败，回退并报告 PM"
    # 回退处理
    gh issue edit $NUM --remove-assignee @me -R OneForAll20240313/PortPilot 2>/dev/null || true
    exit 1
  fi
  ```
- 每个 agent 在认领前，先通过 `gh issue view` 查询该 Issue 的当前 `assignees`，为空才认领。

---

## 四、任务分工与认领（并发控制核心）

### 4.1 Dev 工作循环（认领 → 实现 → 交付）

```
loop:
  1. 扫描看板【待研发】列
  2. 挑选一个 assignee 为空的任务（按里程碑/优先级排序）
  3. 认领（原子锁）：设 assignee=自己 + 状态→【研发中】
  4. git pull --rebase 拉取最新代码
  5. 实现功能（严格按契约 service-api.md / schema）
  6. 本地编译通过 + 运行单元测试通过
  7. 启动 subagent 评审（覆盖准则「验收标准规范·多方位评审」7 维）
  8. 建 `feat/<模块>`/`fix/<模块>` 分支 → commit → push → 开 PR → 等待 CI 通过
     （merge 走 squash；`trae/<session>` 等自动化分支一律不得合入 main，见准则「仓库治理·防污染红线」）
  9. 将任务状态→【待验收】，在 Issue 评论附：结论 + 测试报告链接 + CI run 链接
  10. 回到 1，认领下一个任务
```

### 4.2 认领即加锁

- `assignee=自己` 一旦写入，该任务对其它 Dev 即"上锁"。其它 Dev 扫描到已认领任务直接跳过。
- 半认领（只设 assignee 未移列，或反之）视为非法，PM 扫描时自动纠正回「待研发」并释放 assignee。

### 4.3 状态机合法流转

| 当前状态 | 允许流转到 | 触发条件 |
|---------|-----------|---------|
| 待研发 | 研发中 | Dev 认领（assignee 已设） |
| 研发中 | 待验收 | PR 合并 + CI 通过 + 测试报告已附 |
| 研发中 | 待研发 | 认领后放弃/回退（PM 释放） |
| 待验收 | 已验收 | PM 执行验收五要素校验通过（证据链完整） |
| 已验收 | 已关闭 | 无遗留问题，正式关闭 |
| 已关闭 | — | 终态，不再流转 |

> 禁止跳列（如 待研发→已验收、研发中→已关闭）。非法流转由 PM 扫描自动纠正。
>
> **验收归属**：「待验收 → 已验收」由 **PM**（或由 PM 指定的独立验收者）执行验收五要素校验后移动；Dev 无权自行将本人任务移入「已验收」。验收五要素见准则第二章第 5 条（符合产品定义 / 功能可用好用 / 证据链完整 / 标准清晰可测 / 留档可追溯）。

### 4.4 冲突处理

- **代码冲突**：`git pull --rebase` 变基解决；冲突无法自动合并时，报告 PM 协调，禁止强推覆盖。
- **看板冲突**：同一任务被两个 agent 认领时，以 GitHub 上实际 `assignee` 为准（谁先写入谁持有），后认领者自动放弃。
- **同一文件并行修改竞态**：两个 Dev 同时修改同一文件并 push 到不同分支时，main 只能合并先通过 PR 的分支，后合并者触发冲突 → 由后合并者 `git pull --rebase` 解决并补齐改动，不得强推。系统性规避：认领前检查目标任务是否涉及他人已认领任务的文件清单（如契约文件 service-api.md / schema 由 PM 统一维护，Dev 只读引用，不改写）。

---

## 五、进度监控 agent（PM）运行机制

### 5.1 工作循环

```
loop:
  1. 扫描看板全部列，统计各列卡片数
  2. 识别【待研发】中 assignee 为空的任务 → 确认可认领供给
  3. 识别【研发中】中 超期/停滞 的任务 → 标记阻塞，@相关触发跟进
  4. 校验状态流转合法性 → 非法流转自动纠正（回退+释放 assignee）
  5. 汇总各里程碑完成度（已关闭/总数）
  6. 产出进度报告 → 写入看板 Issue 评论 + 仓库 `协同/进度/<date>.md`
```

### 5.2 进度报告内容

- 各里程碑完成度（已关闭 / 总数 / 百分比）
- 各状态列卡片数（待研发 / 研发中 / 待验收 / 已验收 / 已关闭）
- 阻塞清单（超期研发中、无验收证据的待验收）
- 下一步建议（可认领任务列表、需协调事项）

> **进度报告留档规范**：`协同/进度/<date>.md` 报告属项目文档，遵循准则「五、沙箱机制规范」——先写入 `.session_backup` 留档，再按文档仓库提交流程（Conventional Commits，`docs:` 前缀）提交；`协同/进度/` 目录纳入文档仓库版本管理，不纳入 `.gitignore`。

### 5.3 落地工具

- 用 `gh` CLI + GraphQL 查询项目 6（组织 `OneForAll20240313`），读取状态字段、assignee、milestone、subIssue 归属。
- 提供可复用的扫描脚本（见附录 A），PM 直接调用生成报告。

---

## 六、落地清单

| 事项 | 落点 | 状态 |
|------|------|------|
| 多 Agent 协同规范 | 本文档 `协同/agent-collaboration.md` | 本次产出 |
| 准则增补「多 Agent 协同」章节 | `项目共创准则.md` 新增第八章 | 待落地 |
| 仓库导航 | 根 `README.md` 增加协同目录说明 | 待落地 |
| gh 扫描脚本 | 附录 A（本文档内） | 本次产出 |

---

## 附录 A：PM 看板扫描脚本

> 以下脚本骨架已在本环境实测可运行（`gh 2.45.0`）。关键字段映射（已实测确认）：
> - **状态列**：`fieldValueByName(name:"Status")` → `ProjectV2ItemFieldSingleSelectValue.name`，实测项目 6 状态列名为「待研发/研发中/待验收/已验收/已关闭」。
> - **assignee**：走 **Issue 的 `assignees` 字段**（`content { ... on Issue { assignees { nodes { login } } } }`），不是项目字段（`ProjectV2ItemFieldAssigneeValue` 类型不存在）。
> - **里程碑**：走 Issue 的 `milestone.title`。

```bash
#!/usr/bin/env bash
# 用法: GH_TOKEN=xxx ./scan_board.sh
# 扫描组织项目 6：各状态列分布 + 里程碑完成度 + 可认领清单
set -euo pipefail
ORG=OneForAll20240313; PROJ=6
gh api graphql \
  -f query='query { organization(login:"'$ORG'"){ projectV2(number:'$PROJ'){
    title
    items(first:100){ totalCount nodes {
      content { ... on Issue {
        number title
        assignees(first:5){ totalCount nodes{ login } }
        milestone{ title }
      } }
      status: fieldValueByName(name:"Status"){
        ... on ProjectV2ItemFieldSingleSelectValue { name }
      }
    } }
  }}}' \
  --jq '.data.organization.projectV2'
```

> 说明：脚本输出为 JSON，PM 可结合 `jq` 二次统计（按 `status.name` 分组计数、按 `milestone.title` 计算已关闭/总数、筛选 `assignees.totalCount==0` 且 `status.name=="待研发"` 生成可认领清单）。