# Changelog

版本格式遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。
本文件的中文条目为默认语言；英文条目见英文段落（同一版本内）。

## 0.4.2 — 2026-11-02

- 拖动到「更多」按钮上时新增收纳动画：按钮呼吸高亮、图标下沉，拖影微微缩小
  变淡；松手后拖影飞向按钮并缩小消失，随后该行被收纳，按钮播放一次「吞入」
  回弹。只剩最后一行可见时不再静默失败，改为按钮左右轻抖提示不可收纳。
- 动画只使用 `transform` / `opacity`（拖影飞入用 WAAPI，其余为 CSS），拖动热路
  径不新增布局读取；同一时刻只允许一个飞入动画，连续快速收纳不会叠加拖影。
- 尊重 `prefers-reduced-motion: reduce`：关闭呼吸、回弹与抖动，飞入改为立即
  收纳。

### English

- Added the tuck-away animation on the “More” anchor: the button breathes, its
  glyph dips, and the carried ghost shrinks slightly while armed; on release the
  ghost flies into the anchor and fades, the row is tucked away, and the button
  plays a short “swallow” bounce. When only one row is visible the anchor shakes
  instead of silently refusing to hide it.
- Only `transform` / `opacity` animate (the flight uses WAAPI, the rest is CSS),
  the drag hot path gains no layout reads, and a single flight runs at a time so
  rapid drops cannot pile ghosts up.
- Honors `prefers-reduced-motion: reduce`: no breathing, bounce or shake, and the
  row is tucked away immediately.

## 0.4.1 — 2026-11-02

- 修复反复拖动时排序“抽搐”：落点改为按当前视觉顺序（`layout.order` +
  内联 `style.order`）计算，并把目标位置锚定到具体某一行的 key，而不是页面里
  的 DOM 序号；长按成立时会先强制落一次布局，避免用上一帧的旧几何做判定。
- 「更多」的投放判定收窄：只有指针真正落在「更多」按钮矩形内、且位于最后一
  行下方时才收纳，拖到列表末尾不再被误判成收纳。

### English

- Fixed jittery ordering after repeated drags: the drop index is now computed
  from the visual order (`layout.order` plus inline `style.order`) and anchored
  to a row key instead of the DOM index, and a layout pass is forced when the
  long-press succeeds so the frozen geometry is current.
- Tightened the “More” drop zone: a row is tucked away only when the pointer is
  inside the anchor's own rectangle and below the last row, so dropping at the
  end of the list no longer hides it by mistake.

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
