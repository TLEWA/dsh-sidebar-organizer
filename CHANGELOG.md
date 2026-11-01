# Changelog

版本格式遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。
本文件的中文条目为默认语言；英文条目见英文段落（同一版本内）。

## 0.4.0 — 2026-11-02

- 源码拆分为 `src/` 下的模块（constants / styles / storage / icons / slot /
  runtime / menu / plugin），新增 `scripts/build.mjs` 在构建期拼接为
  `lib/client.js`（DSH 客户端以经典脚本加载，运行时无法 `import`）。
- 版本号改为构建期从 `package.json` 注入，避免多处手写漂移。
- 新增 `README.en.md`、`NOTICE.md`、`NOTICE.en.md`、`CITATION.cff`：
  README/NOTICE 中英文分文件、顶部链接切换；补齐 AI 使用、代码来源、
  商标与引用声明。
- `package.json` 增加 `repository`/`homepage`/`bugs`/`keywords`，`private`
  设为 `false`，补充构建与检查脚本，准备发布 npm。
- 行为无变化，仍为 0.3.6 的功能集。

### English

- Split sources into modules under `src/` and added `scripts/build.mjs`, which
  concatenates them into `lib/client.js` at build time (the DSH client loads
  plugins as classic scripts, so there is no runtime `import`).
- The version is injected from `package.json` during the build.
- Added `README.en.md`, `NOTICE.md`, `NOTICE.en.md`, and `CITATION.cff` with
  language switching, AI-usage/code-origin disclosure, trademark notes, and
  citation metadata.
- `package.json`: added repository/homepage/bugs/keywords, set `private: false`,
  added build/check scripts, preparing for npm publication.
- No behavioural changes; feature set is the same as 0.3.6.

## 0.3.6 — 2026-11-02

- 点击「更多」菜单中「已收纳」的条目只打开对应面板，不再顺带把它放回侧栏；
  恢复显示只通过「拖回左侧」触发。

## 0.3.5 — 2026-11-02

- 指针捕获从 `pointerdown` 推迟到长按成立之后，修复「已收纳」条目无法单击打开。

## 0.3.4 — 2026-11-02

- 图标 SVG 内嵌 id 统一加前缀，修复「上下文洞察」等带 `mask` 的面板收纳后图标空白。
- 「已收纳」分组内支持长按拖动排序。

## 0.3.3 — 2026-11-02

- 修复 0.3.2 回归：React 18 不接受 DOM 节点作为 children，改为 SVG 标记 +
  `dangerouslySetInnerHTML`，并加 `MenuBoundary` 降级兜底。

## 0.3.2 — 2026-11-02

- 「已收纳」行改用 `MenuItemButton` 的 `icon` 槽位，与原生菜单行排版一致。

## 0.3.1 — 2026-11-02

- 拖动期性能：按下时冻结几何快照、`requestAnimationFrame` 合并写入、
  拖动中暂停布局 pass。
- 「已收纳」行沿用面板本地化名称与图标；移除菜单提示行。

## 0.3.0 — 2026-11-02

- 「更多」收纳：拖到「更多」= 收纳，菜单内长按拖出 = 恢复。
- `Alt+↑/↓` 键盘排序；拖动期间抑制 `:hover` 与 tooltip。

## 0.2.1 — 2026-11-02

- 改用属性/结构选择器定位面板行，修复 CSS Modules 哈希类名导致的静默失效。

## 0.2.0 — 2026-11-02

- 重写为只读 DOM 版本：`style.order` 排序、`localStorage` 持久化、看门狗、
  逃生开关；移除会卡死页面的插槽重注册（0.1.0 事故）。

## 0.1.0 — 2026-11-02

- 初版：通过影子注册重排 `sidebar.panellist`，因反馈环导致页面卡死，已废弃。
