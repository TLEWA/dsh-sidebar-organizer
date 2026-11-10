# AGENTS.md

本仓库是一个 DSH 插件。开工前先读仓库的 `README.md`；通用流程与检查项看中心仓的 [PROCESS.md](https://github.com/TLEWA/dsh-plugin-ci/blob/v1/PROCESS.md) 与 [docs/gates.md](https://github.com/TLEWA/dsh-plugin-ci/blob/v1/docs/gates.md)。本文件只强调本类仓库最容易出错的点。

## 插件的硬性约束

- `package.json` 必须有顶层 `engines.dsh`；写在 `dsh.engines.dsh` 会被忽略。
- `dsh.manifestVersion` 必须是 1，`dsh.bundle.patch` 必须指向真实存在的 `cordis.patch.yml`。
- `cordis.patch.yml` 里 `insert[].name` 必须等于包名；`id` 是用户可见的短名，不要随意改。
- `dsh.client.inject` 只允许 `@deepseek-ai/*`，裸模块名（如 `react`）不会被打包。
- 构建产物（`lib/`）要提交；改源码必须重新构建并一起提交，否则 `artifacts.fresh` 会红。
- `package.json` 的 `scripts.prepublishOnly` 必须调用 `dsh-ci-gate --prepublish`；它拦截本机 `npm publish`，不要删除或绕过。

## 本仓库专属

`lib/client.js` 由 `scripts/build.mjs` 把 `src/` 按固定 MODULES 顺序拼成经典脚本，
`lib/index.js` 是宿主源码。本仓已有 `node:test` 测试：`npm test`，覆盖系统修复、
host aliases、disable sync、损坏布局、备份恢复与写入串行化。

- 绝不手改 `lib/client.js`；改 `src/` 后 `npm run build`，提交构建产物。新增源文件必须插到
  `MODULES` 的正确依赖位置。
- 构建会归一 CRLF、替换 `__VERSION__` / `__BUILD__` 并写内容哈希；`npm run check` 只做语法检查，
  不能替代浏览器回归。
- 改 UI/交互除 `npm test` 外，还必须打开 `test/harness.html` 手工覆盖：七区域发现与顺序、持久化、
  v4 迁移、收纳、设置页、菜单拖动、导入导出、dispose。
- 布局存储是 v4（scopes + aliases）；迁移和稳定 id 是兼容性契约，不能静默重置用户布局。
- host 归一化必须保留 v4 per-scope aliases；任何 layout 读写都不得静默重置 aliases。
- CDP 前备份 `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`；旧版 host 会在加载时丢掉 aliases。
- 跨窗口同步走 `POST/GET /api/dsh-sidebar-organizer/layout`；宿主只允许 owner 写
  `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`，用临时文件 + rename 原子替换。
- 被整理的插槽只读：只写 inline order/display，不重建/不改宿主节点；注册必须静态、幂等，
  避免 observer 反馈环。
- 不得写 row-menu 的存储键；两个插件共享同一侧栏时必须能共存。
- `files` 只发布 `lib/` 与文档，不发布 `src/` / `scripts/`；`prepack` 会 build + check。

## 每次改动

1. 从最新 main 开 `feat/` 或 `fix/` 分支。
2. 改代码、双语文档与 CHANGELOG（同一个 PR）；手工回归的场景与结果写进 PR 描述。
3. 本地跑 gate，全绿再 push；不要复制 gate 脚本，CI 会通过 `.ci` 运行中心仓的版本。
4. 开 PR 并按模板勾选；`ci / ci-ok` 通过后由维护者合并。改 CI、AGENTS 或 PR 模板必须加 `ci-change`；
   `human-approved` 只能由人加，模型不得自行添加。

```bash
npx --yes --package=github:TLEWA/dsh-plugin-ci#v1 dsh-ci-gate
npm run build
npm test
npm run check
```

## 发布

只由维护者打 tag 触发 `release.yml`。模型不得执行 `npm publish`、不得改版本号（除非在 `release/` 分支上且被明确要求）。

<!-- dsh-review-policy:v1:start -->
## Code Review Rules

- 用中文报告可证明的严重缺陷，写清触发条件、实际影响和最小相关代码位置；避免风格建议及重复 CI 已完成的机械检查。未返回审阅结果不表示通过。
- 检查宿主兼容性与用户数据边界：插件不得意外改变非目标请求、消息、配置或持久化数据；判断影响时遵守本仓明确记录的兼容例外。
- 检查异常、取消、卸载与重复初始化路径：钩子、监听器和共享状态应正确清理；失败回退不得造成重复执行、数据丢失或泄漏敏感信息。
- 审阅只发表意见。不得自动修复、添加人工批准标签、合并、改版本或发布；保留现有 CI 与人工批准流程。
<!-- dsh-review-policy:v1:end -->

### 本仓审阅重点

- 布局迁移与读写必须保留 v4 scopes、稳定 id 和 aliases；只调整宿主节点 order/display，跨窗口持久化不得丢失布局或覆盖 row-menu 存储。
