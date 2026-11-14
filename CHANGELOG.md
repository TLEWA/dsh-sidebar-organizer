# Changelog

版本格式遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。
本文件的中文条目为默认语言；英文条目见英文段落（同一版本内）。

## [Unreleased]

- 会话头部的「更多操作」按钮重新可以拖动：0.2.2-rc.2 把它从工具条槽位里挪到槽位旁边后，
  插件重新把它当成条带的一列写入顺序，刷新或重启后位置照你的安排保留。它自身永远不会被
  收纳（唯一回收入口要一直在条带上），拖它自己也只在条带内换位、不再收进菜单。
- 修复把行拖进「更多操作」时被塞进子菜单的嵌套：0.2.2 起右键菜单与头部弹窗共用同一套上下文
  菜单原语，二级菜单（「在应用中打开」等）也是独立菜单，插件此前会把收纳行注入其中一个。
  现在只认仍处于展开状态的「更多操作」触发按钮打开的那张一级菜单，显式跳过子菜单面板，
  右键菜单也不再改写这张弹窗的行。
- 新增 `test/o12-header-more-row.test.mjs`，覆盖「更多」成为条带一行（同级、包在 span 里、
  渲染在槽位内部）以及非 `fixedMore` 区域仍不把「更多」当成行。

### English

- The session header's "More actions" button is draggable again: 0.2.2-rc.2 moved it
  out of the utilities slot and next to it, and the plugin treats it as one of the
  strip's columns again, so its position survives reloads. It is never tucked (the
  only way back to the shelf has to stay on the strip), and dragging More onto itself
  now reorders it instead of hiding it.
- Fix the wrong nesting when a row was dragged into "More actions": since 0.2.2 the
  right-click menu and the header sheet share one contextual-menu primitive, and
  submenus ("open with ...") are menus of their own, so the tucked rows could be
  injected into one. The shelf now only accepts the sheet its still-expanded trigger
  opened, skips submenu panes explicitly, and the right-click layout no longer
  rewrites the sheet's rows.
- Adds `test/o12-header-more-row.test.mjs` covering More as a strip row (sibling,
  span-wrapped and rendered inside the slot) and outlets without `fixedMore` still
  keeping More out of the rows.

## [0.11.1] - 2026-11-12

- 适配 DSH 0.2.2-rc.2 的侧栏结构：每个面板从直接挂在 `nav` 下的按钮变成
  `nav > div.panelEntry > button`；侧栏区域同时识别 `sidebar.panellist` 与
  `sidebar.panel.icon` 两种图标槽名，并优先以面板列表所在的 `nav` 作为排序容器，
  恢复 rc.2 下的排序、收纳与「更多」；rc.1 行为不变，未固定面板的已保存槽位也不会丢。
  已在 rc.2 源码构建的临时 Web 宿主上验证排序、拖拽、持久化、恢复默认与重新固定；
  rc.2 官方安装包尚未发布，发布后仍需补一次安装包回归。

### English

- Adapt to the DSH 0.2.2-rc.2 sidebar structure: each panel is now
  `nav > div.panelEntry > button` instead of a button directly under `nav`. The sidebar scope
  recognises both the `sidebar.panellist` and `sidebar.panel.icon` icon slot names and resolves
  the enclosing `nav` panel list as its ordering container first, restoring ordering, tucking
  and "More" on rc.2. rc.1 behaviour is unchanged, and saved slots for unpinned panels are
  retained. Ordering, drag, persistence, reset and re-pinning were verified on a temporary web
  host built from rc.2 source; the official rc.2 package is not released yet, so a regression
  with the installed package is still pending.

## [0.11.0] - 2026-11-11

- 停止同步后不再补发落单的上传：启动时那次「宿主没有副本」的判断如果晚于停用返回，它的后续不会再排一次
  上传定时器（此前会在停用 350ms 后仍向宿主 POST 一次布局）。
- 跨窗口同步不再用旧副本覆盖刚拖好的布局：读取宿主布局的请求还没回来时如果本地又改了布局，
  这次响应会被判为「本地更新」并丢弃，改动由本地自己的上传带走。
- 停用插件、关闭同步开关或热重载后，已经在飞行的同步请求不再生效：晚到的响应不再写回布局与备份，失败分支
  也不再重排重试定时器，禁用状态不会在后台偷偷同步。
- 跨仓索引里 `dsh-utf8-output` 的说明改为 `GBK/CP936/GB18030`，与插件实际支持的编码一致。

## 0.10.1 — 2026-11-11

- 接入 Codex PR 公共审阅规则与本仓重点，保留现有 CI、人工批准和发布行为。

- 系统修复不再冒充用户编辑：id 迁移、投影回写与顺序补登记只写本地存储，不再抬高同步时间戳，
  也不会把陈旧布局推上宿主覆盖另一窗口较新的编辑；只有用户操作与「恢复默认」才上传。
- 跨窗口同步保留 v4 别名表：宿主存取布局时不再丢掉 `aliases`，拉到宿主布局后行改名映射仍然有效。
- 逃生开关真正关掉同步：调用 `disable()` 会立刻停止跨窗口拉取/上传，禁用状态下重新加载也不会同步。
- 宿主的损坏 `layout.json` 不再被当成「没有布局」：读取或写入时先把它改名为
  `layout.json.corrupt-<时间戳>` 保留现场，并返回 5xx（`layout-corrupt`），避免下一次上传
  静默覆盖唯一副本。
- 本地布局主键损坏时先从 `v3-backup` 快照恢复，恢复不了才重置；坏值另存为
  `*.corrupt-<时间戳>` 并告警，空布局写入也不再覆盖仍含布局的备份。
- 宿主的并发上传按 `updatedAt` 串行落盘：同一瞬间的多个 POST 不再都读到旧副本，较小
  `updatedAt` 的后写会被判为 `stale`，不会覆盖较新布局。
- row-menu 菜单里的分隔线不再跟着条目走：第一次排版前先把屏幕上此刻的分隔线冻结成间隙下标
  （原生线隐藏、按位置注入插件自绘的线，面板补上 flex 列；嵌在某一行自己包装元素里的原生线也一并
  纳入，不再只认窗格直系子节点），此后分隔线是位置而不是行的附属物；
  菜单变短时超出末行的间隙也不再画出游离线（存储值保留，行回来时线也回来）。注入线是插件自绘的
  `div.dsrm-sep`，不是宿主分隔线的克隆：宿主的 `分隔线 + 分隔线 { display: none }` 兄弟规则会把
  相邻克隆里的后一条藏掉，屏幕上只剩一条，而存储里明明有三条。
- 右键菜单的蓝色落点线恢复：菜单表面的玻璃层（铺满整张菜单的 `_material`）曾被当成一行参与
  遮挡判定，任何接缝都判为被占用，落点线因此永不显示；现在按几何跳过铺满表面的节点，
  宿主右键菜单与 row-menu 菜单的落点线都回来了。
- 拖动时的蓝色落点线改到拖动框下面，并透过这层玻璃显示：落点线与拖动预览必须共用页面最高的 z-index
  （右键栏浮层本身就是 2147483647，谁调低谁被菜单盖住），所以先挂落点线、再把拖动预览追加为最后一个
  节点。预览本身改成半透明玻璃（`backdrop-filter: blur(0.5px) saturate(1.15) brightness(0.78)`，
  底色 50%），被它盖住的落点线因此变成一条压暗、略微柔化的蓝线：既不会横穿正在拖的那一行，也不会被
  硬生生截断。只有纯图标的扁平预览（`dso-ghost-flat`）保持全透明、不加滤镜。
- 菜单里本来就有的分隔线可以直接右键删掉，而且点到哪条就删哪条：线只有 0.5px 高、上下各 3px
  外边距，右键几乎总会落在面板内边距上；旧版在那里找不到行，把事件吞掉却什么也不做，于是那条横线
  怎么点都消不掉。第一版改成「按接缝解析」仍会出错——宿主有时把分隔线包进**下一行自己的包装元素**里，
  于是「点在线上」被当成「点在那行上」，判定成它下面那条接缝（gap+1），结果删不掉旧线反而新加一条。
  现在分隔线永远优先于行：指针 ±4px 内最近的那条可见线就是目标（注入线读它自己的间隙下标，原生的线
  用点击时现场测量的行中点反推），只有不在任何线上时才按行/接缝处理；出厂分隔线的集合也在点击时用
  实时几何重算，不再用菜单打开那帧的过期快照；高度为 0（被隐藏）的线不参与命中，不会把点击判给
  看不见的线（宿主右键菜单与 row-menu 菜单同规则）。

### English

- **System repairs no longer masquerade as user edits**: id migration, projection write-back and
  appended-order registration touch local storage only — they neither raise the sync timestamp nor
  push a stale layout over a newer edit from another window; only user actions and "reset" upload.
- **Cross-window sync keeps the v4 alias table**: the host no longer drops `aliases` when it reads or
  writes a layout, so a row renamed by the host still maps to its saved id after the layout is adopted.
- **The escape hatch really stops syncing**: `disable()` now stops cross-window pull/push immediately,
  and a reload while disabled no longer syncs either.
- **A corrupt host `layout.json` is no longer treated as "no layout yet"**: reads and writes first keep
  the file as `layout.json.corrupt-<timestamp>` and answer 5xx (`layout-corrupt`), so the next push
  cannot silently overwrite the only copy.
- **A corrupt local layout key is restored from its backup first**: when the primary key no longer
  parses, the `v3-backup` snapshot is loaded before falling back to a reset; unusable raw values are
  kept under `*.corrupt-<timestamp>` with a warning, and an empty write no longer replaces a backup
  that still holds a layout.
- **Concurrent host pushes are serialized by `updatedAt`**: simultaneous POSTs no longer all read
  the same old copy, so a later write with a smaller `updatedAt` is answered as `stale` and cannot
  overwrite a newer layout.

## 0.10.0 — 2026-11-08

这一版把「行的身份」从文案里解耦：宿主给某一行加的实时计数、状态后缀、翻译改动，不再让已保存的
排序与收纳失效；落点线也改成只认宿主实际画出来的盒子，并加入一套可以自己跑的结构审计。

- **行 id 不再依赖文案原文**：行 id 优先取元素自带的稳定属性（`data-panel` / `data-view` /
  `data-action` / `data-testid` 等），取不到时用规范化后的标签指纹——冒号后的状态段被剥掉、
  数字归一化成 `n`。于是「IP 防护：0 个黑洞」换成「IP 防护：待探测」、会话数从 3 变 42，
  已保存的顺序与收纳照旧生效。
- **升级自动接管旧布局**：旧版本按原始标签写下的 id，在加载时一次性交给新的指纹 id：行沿用原来的
  槽位，顺序不重排，也不需要你重新拖一遍；之后行被改名，别名表仍能把它认回原来的 id。
- **存储格式升级到 v4**：每个区域多一张别名表（`aliases`），导出文件带上 `stateVersion`；
  旧版本导出的 v3 配置仍可导入，别名会按导入的顺序重新推导。
- **落点线只认宿主画出来的盒子**：线不会再横穿宿主绘制、但本插件不可移动的控件（例如会话头部的
  分段控件）；遇到这种「洞」时，线停在洞旁边的间隙里，松手仍按线所指的位置落地。
- **拖到最右端跟手**：把行拖到工具条末端之后继续往右，指示线跟着指针走到最右，而不是卡在最后一个
  可见行的内边缘。
- **菜单落线**：整张菜单共用一条线，始终落在两个一级行之间的间隙、跨整张列表宽度；从「更多操作」
  把条目拖到一级时，线不会穿过一级行。
- **兼容 `display:contents` 包裹**：会话头部的槽位出口就是这种结构——包裹层自己没有盒子，现在会
  正确地站到子元素上取盒，落线与审计都因此准确。
- **排障接口**：新增 `audit()`（按区域报告「插件以为的行」与「宿主实际画的控件」是否对得上，
  列出没有行认领的控件、宿主不再绘制的行，以及容器是怎么被找到的）与 `identity()`（纯 id
  推导规则），在控制台里就能自检；内部判断落点也复用同一套盒子模型。
- **构建修复**：此前打包只替换了 `__BUILD__`，版本常量被原样留在产物里；现在
  `window.__DSO_BUILD__` 报告的是真实版本 + 构建哈希。
- **质量**：断言从 280 条增加到 324 条，全部通过（新增最右端扫掠、宿主控件「洞」、
  `display:contents` 包裹、结构审计、旧布局迁移与改名别名等用例）。

### English

- **Row ids no longer come from label text**: an id prefers the element's own stable attributes
  (`data-panel` / `data-view` / `data-action` / `data-testid` …) and otherwise falls back to a
  canonical label fingerprint — the status segment after a colon is dropped and digits collapse to
  `n`. So when "IP guard: 0 black holes" becomes "IP guard: probing" or a session count moves from
  3 to 42, the saved order and tucked rows keep working.
- **Upgrades adopt the old layout**: ids that older builds derived from the raw label are handed to
  the new fingerprint ids once, at load time; every row keeps the slot it had, nothing is reshuffled,
  and you never have to drag anything again. If a row is later renamed, the alias table still hands
  it its old id back.
- **Storage format is v4**: each scope gains an alias table (`aliases`) and exports carry
  `stateVersion`; a v3 file exported by an older build still imports, with aliases re-derived from
  the imported order.
- **The drop line only trusts boxes the host paints**: it no longer cuts through controls the host
  renders but this plugin cannot move (the session header's segmented control, for example); over
  such a hole the line waits in the gap beside it, and releasing still lands where the line points.
- **The far end follows the hand**: dragging a row past the end of the strip keeps the indicator
  under the pointer all the way to the right, instead of pinning it to the inner edge of the last
  visible row.
- **Menu line**: one line serves the whole menu — always in the gap between two first-level rows,
  spanning the full width of the list — and pulling an entry out of "More actions" no longer draws
  it through a first-level row.
- **`display:contents` wrappers work**: the session header's slot outlet is exactly this shape; a
  wrapper with no box of its own now stands on its children for measuring, which keeps both the drop
  line and the audit accurate.
- **Diagnostics**: `audit()` reports per scope whether "the rows the plugin believes in" match "the
  controls the host actually paints" — listing boxes no row owns, rows the host no longer paints, and
  how the container was found — while `identity()` exposes the pure id rules, so both can be checked
  from the console. The same box model now drives drop targeting.
- **Build fix**: packaging used to substitute only `__BUILD__`, leaving the version constant as a
  literal in the bundle; `window.__DSO_BUILD__` now reports the real version plus build hash.
- **Quality**: assertions grew from 280 to 324, all passing (new cases cover the far-end sweep, holes
  the host paints, `display:contents` wrappers, the structure audit, and legacy-layout adoption and
  rename aliases).

## 0.9.7 — 2026-11-07

把 dsh-sidebar-row-menu 的会话右键菜单真正接过来：可以在这个菜单里增删分隔线、把「··· 更多操作」二级
菜单里的条目提到一级，并在你编辑过一次之后由本插件保存顺序；同时给了一个一键还原的出口。另外修好了
工具条拖动时落点判断的几个老问题。

- **接管 row-menu 的会话右键菜单**：在这个菜单里增删分隔线、拖动排序、或把「更多操作」的条目提到
  一级之后，菜单顺序改由本插件保存；右上栏工具条随后的改动不会再回头把它重排。没有动过的菜单仍然
  照旧跟随右上栏顺序。
- **右键增删分隔线**：在 row-menu 的正文一级菜单里右键任一行，即可在该行下方插入或移除一条分隔线
  （与宿主菜单同一条落位规则，最后一行下方不可插入）；自定义分隔线画出来时原生分隔线隐藏，不会出现
  两套线；在空白处或分隔线上右键会被吞掉，不会漏到宿主菜单。
- **把「更多操作」里的条目拖到一级**：从二级菜单把条目拖到一级，会在落点生成一个同名行，点击等同于
  点二级菜单里的那一项；把它拖回「更多操作」即撤销。
- **一键还原本插件对这个菜单的接管**：配置页新增「仅还原会话菜单」——只把会话右键菜单恢复成跟随
  右上栏工具顺序，工作区菜单不受影响；旁边的「重置全部右键菜单」连工作区一起清空排序、分隔线与收纳。
- **工具条落点修复**：指示线按视觉顺序落位（工具条用 CSS order 重排、DOM 顺序与之不同时，线不会
  再被钉在较早的间隙里）；把图标拖到工具条左侧或右侧之外，仍然表示「放到这一端」；读取容器几何时
  兼容已经测量好的 DOMRect（此前会在 pointermove 里抛异常，吞掉整次落点更新）；落线不再压在图标上；
  松手按线所指向的那一行插入，修好了「预览能拖过去、松手却没动」（隐藏的 0×0 槽位让索引偏了一格）；
  提交失败会抖动提示，不再静默。
- **排障**：页面暴露 `window.__DSO_BUILD__`（版本 + 构建哈希），可以确认宿主实际加载的是哪一版。
- **质量**：断言从 264 条增加到 280 条，全部通过；并用真实指针事件验证了工具条从最左拖到最右的
  落点与最终顺序。

### English

- **Takes over row-menu's session context menu**: after you add or remove a divider, reorder a row, or
  pull an entry out of "More actions" onto the first level, this plugin saves the menu order; later
  changes to the header toolbar no longer reshuffle it behind your back. A menu you never touched
  still follows the header order as before.
- **Right-click to toggle a divider**: right-click any first-level row of row-menu's body menu to add
  or remove the divider underneath it (same gap rule as the host menu; the last row has no gap). Native
  separators are hidden while custom ones are painted, so the two sets never stack, and a right-click
  on empty space or on a divider is swallowed instead of falling through to the host menu.
- **Drag an entry out of "More actions"**: dragging a submenu entry onto the first level creates a row
  of the same name that runs the same host action; dragging it back into "More actions" undoes it.
- **One-click restore**: the settings page gains "Restore session menu only", which puts just the
  session context menu back on the header toolbar order (workspace menus are untouched); the adjacent
  "Reset all context menus" also clears order, dividers and tucked rows in the workspace menus.
- **Header strip drop targeting**: the indicator now follows visual order (the strip reorders with CSS
  `order`, so a DOM-order scan used to leave the line pinned in an earlier gap); dragging past either
  end of the strip still means "this end"; container geometry accepts an already-measured DOMRect
  (reading it as an element used to throw inside pointermove and swallow the whole update); the line no
  longer cuts through an icon; and the release inserts in front of the row the line pointed at, fixing
  "the preview moves but releasing does nothing" (hidden 0×0 slot rows shifted the index by one).
  A rejected drop now shakes instead of failing silently.
- **Diagnostics**: the page exposes `window.__DSO_BUILD__` (version plus build hash) so you can tell
  which build the host actually loaded.
- **Quality**: assertions grew from 264 to 280, all passing, and real pointer events verify a drag from
  the far left of the strip to the far right, including the final order.

## 0.9.6 — 2026-11-06

一次以稳定性、性能与代码清理为主的版本：完整审查了运行时、设置页与宿主端代码，修掉布局更新被丢弃、
取消手势仍然写盘、禁用后残留回调等问题，并删除了一批死代码。交互与视觉与 0.9.5 一致。

- **布局更新不再会被永久丢弃**：某个区域这一轮发现 0 行时，上一轮记下的容器与行不会被清空，导致打开过
  一次设置后每个 DOM 变更都触发全量重排；现在「没找到」与「找到 0 行」都会清空。重排看门狗超过阈值时
  也不再直接放弃，而是等 400ms 后重置计数再试一次。
- **取消手势不再写布局**：触摸被系统中断（pointercancel）不再走「松手提交」路径，不会收纳或重排；
  拖影动画被取消（Esc、失焦、插件停止）时也不再执行原地的提交回调。
- **禁用与热重载清理**：插件被禁用后不再继续响应 refresh / 重排；`stop()` 会清掉「更多」定时器、
  复位重排调度、移除注入到宿主菜单里的按钮；跨窗口同步的 visibilitychange / focus 监听有了对称的
  `stopHostSync()`，禁用后不再残留回调。
- **用户把行拖到最后不会被当成坏数据回滚**：0.5.4 数据的一次性修复只对「非用户写入」生效，不再把
  用户自己的排序判成错位并回滚。
- **设置页与右键菜单**：设置里的「更多」芯片与「已定制」判断会过滤已消失的行；右键菜单的待定类型只
  消费一次，不会跨菜单串味；菜单里尺寸为 0×0 的行不再把落区撑成全屏、也不会被排到最前面；行-menu
  注入的「更多」行会复制 `aria-disabled`，禁用项不再可点。
- **交互细节**：录制拖动热键时按 Esc 可以取消（插件详情页里的内联设置不再一直吞键盘）；`Alt+↑/↓`
  长按只移动一格；设置页可以把行拖到列表末尾、拖拽经过时高亮不再闪烁、查找索引从 O(n²) 降到 O(n)；
  两个窗口同时打开时，开关状态会即时同步。
- **性能**：DOM 监听只在确有布局变化或菜单打开时同步菜单，不再每个 mutation 都跑三次全文档查询；
  拖拽中的滚动用 rAF 合并；row-menu 面板先统一测量再写样式，避免逐个 reflow；宿主动作清单做了缓存，
  不再每次重排都解析一遍 JSON。
- **代码清理**：删掉恒为 true 的 `reorderable` 判断与 7 处过滤、只 remove 从未 add 的 `dso-pressing`、
  无人读取的字段、恒假分支与死常量，合并了 `collectUnits` / `headerHiddenRows` 等重复实现。
  宿主端会先看 Content-Length 拒绝超大请求，布局文件损坏时写警告日志而不是被静默覆盖。

### English

- **A layout update can no longer be dropped for good**: when a scope found zero rows this round, the
  container and rows remembered from the previous round were kept, so after opening the settings page
  once every DOM mutation triggered a full pass; both "not found" and "found zero rows" now clear the
  record. The pass watchdog also retries after 400ms instead of giving up permanently.
- **Cancelled gestures no longer write the layout**: a system-cancelled touch (pointercancel) no longer
  takes the "release to commit" path, so it cannot tuck or reorder; a cancelled ghost animation
  (Esc, blur, plugin stop) no longer runs the commit callback either.
- **Disable and hot-reload cleanup**: a disabled plugin no longer keeps reacting to refresh / passes;
  `stop()` clears the tuck timer, resets the pass schedule and removes the buttons injected into the
  host menu; the cross-window visibilitychange / focus listeners now have a matching `stopHostSync()`.
- **Dragging a row to the end is no longer treated as corrupt data**: the one-shot 0.5.4 repair only
  runs for non-user writes, so it can no longer roll back the user's own ordering.
- **Settings page and context menus**: the "More" chip and the "customized" check ignore ids that no
  longer exist; a pending context-menu kind is consumed once and cannot leak across menus; rows measured
  at 0×0 no longer inflate the drop area to the whole viewport or get sorted to the front; the "More"
  rows injected into row-menu copy `aria-disabled`, so disabled entries are no longer clickable.
- **Interaction details**: pressing Esc while recording a drag hotkey cancels it (the inline settings
  page no longer swallows the keyboard); `Alt+↑/↓` moves one step per keypress; the settings list can
  drop at the very end, drag-over no longer flickers, and its index lookup is O(n) instead of O(n²);
  two open windows now share toggle state immediately.
- **Performance**: the DOM observer only syncs menus when the layout changed or a menu is open, instead
  of running three document-wide queries per mutation; scrolling while dragging is coalesced with rAF;
  row-menu panes are measured first and styled in one go; the host action list is cached instead of
  re-parsed on every pass.
- **Cleanup**: removed the always-true `reorderable` checks (and seven filters), the never-added
  `dso-pressing` class, unread fields, dead constants and an always-false branch; merged duplicated
  helpers (`collectUnits`, `headerHiddenRows`). The host half rejects oversized bodies by
  Content-Length and logs a warning for a corrupt layout file instead of silently overwriting it.

## 0.9.5 — 2026-11-06

- **联动 dsh-sidebar-row-menu**：会话正文右键菜单（row-menu 自绘）的一级行，以及「打开方式」「更多操作」
  两个二级菜单里的行，现在都能长按拖动排序。会话 / 工作区右键菜单里 row-menu 追加的「打开方式」
  子菜单与正文菜单共用同一套应用顺序。全程不写 dsh.sidebar-row-menu.* 的任何存储键。
- **默认不接管顺序**：一级菜单在没有自定义顺序时仍然完全跟随本插件的会话头部工具条顺序（row-menu
  单向读取它），只有用户真的拖动过一级行，本插件才写自己的顺序；此后按用户安排显示，重置后恢复联动。
- **「更多操作」写回本插件的头部菜单顺序**：在 row-menu 的「更多操作」二级菜单里排序，会写入
  dsh.sidebar-organizer.host-menu-order.v1（row-menu 的 orderMoreItems 读同一个键），所以会话头部
  原生「更多操作」弹窗的顺序也会同步变化；「打开方式」的顺序单独保存在本插件的 row-menu-layout.v1
  里。row-menu 菜单的 DOM、键盘顺序不移动，只改视觉顺序。
- **「更多」收纳面板内部可以拖了**：面板挂在菜单右侧之外，原来的命中检测只认菜单与锚点矩形，
  在面板里按住拖动是 no-op。现在面板整体参与命中，面板内的行按 hidden 存储顺序重排后写回；
  页面或流式输出滚动不再关闭面板（只关闭菜单自身的滚动）。
- **z-index 修复**：row-menu 的菜单层是 2147483647，原拖影 2147483000 会被菜单盖住；拖影提到
  2147483647，同值时后插入 body 的拖影显示在菜单之上。
- 离线用例 264 条（全绿）。

### English

- **dsh-sidebar-row-menu integration**: rows in the plugin-drawn conversation-body context menu, plus
  rows in its "Open with" and "More actions" submenus, can now be reordered with a long-press drag.
  The "Open with" submenu that row-menu adds to the session / workspace context menus shares the same
  app order as the body menu. No dsh.sidebar-row-menu.* storage key is ever written.
- **The default order is untouched**: with no custom order, the first level still follows this plugin's
  session-header order (row-menu reads it one-way). Only an actual drag on a first-level row saves an
  order here; after that the menu keeps what the user arranged, and Reset restores the linkage.
- **"More actions" writes this plugin's header-menu order**: reordering inside row-menu's "More actions"
  submenu writes dsh.sidebar-organizer.host-menu-order.v1 (the same key row-menu's orderMoreItems reads),
  so the native session-header More popover follows too. The "Open with" order is stored separately in
  this plugin's row-menu-layout.v1. Row-menu's DOM and keyboard order are never moved; only the visual
  order changes.
- **The tucked "More" panel can be reordered from the inside**: the panel sits outside the menu, and the
  old hit test only knew the menu and anchor rectangles, so dragging inside it was a no-op. The panel now
  takes part in hit testing; its rows are reordered by the stored hidden order and written back. Page
  and streaming scrolls no longer close the panel (only scrolling the menu itself does).
- **z-index fix**: row-menu's menu layer is 2147483647 while the drag ghost was 2147483000, so the menu
  covered the ghost. The ghost now uses 2147483647; being appended to body later, it wins the tie and
  stays above the menu.
- 264 offline assertions (all green).

## 0.9.4 — 2026-11-06

- **长按二级菜单不会再拖动一级行**：宿主把 `打开方式` 这类子菜单渲染在行按钮**内部**（面板是
  按钮的兄弟），按在子菜单上因此会被当成按在行上。现在按 `role=menuitem` 判断「按的是不是这一行
  自己的按钮」，子菜单里的按压交还宿主；行按钮（含右侧箭头）照旧可拖。
- **收纳项恢复了图标**：以前只克隆行里的第一个 `<svg>`，用 `<img>` 渲染图标的行（如
  「用 Visual Studio Code 打开」）在面板里就是空的，有的行还会把箭头一并复制。现在整块复制
  `[data-slot="contextMenu.icon"]`，`img` 与 `svg` 都保留在 14×14 的槽里；没有图标的行留同宽占位，
  文字仍然对齐。
- **从「更多」拖回的行不再隐形**：`applyContextLayout` 曾把 `rememberContextElement` 的返回值当
  「原始 display」，而它对已记录的元素返回 null，于是当前值 `none` 被当成原始值写回——顺序回来了、
  盒子却没了；把最后一项拖出去时「更多」也就空了。现在从 `state.contextStyled` 读记忆下来的值。
- **二级菜单的观感与 dsh-sidebar-row-menu 一致**：面板改用宿主菜单材质（`--dsw-menu-surface-fill` +
  `backdrop-filter`、圆角 16、padding 4、无阴影），行按宿主菜单项规格（34px、6px 8px、gap 6、
  13px/20px），图标槽 14px；「更多」锚点同步到同一行高。
- **分隔线落在右键点中的那一行下面**：gap 一直按「绘制顺序」解释，但 `toggleContextDivider` 拿 DOM
  顺序算下标——拖过一次菜单后两者分叉，分隔线就会掉到下一行。现在 gap 由 `layout.order`（剔除
  `hidden`）解析；`commitContextReorder` 也改以绘制序为基准，避免一次拖动抹掉整张自定义排序；
  尾部悬空的分隔线按可见行数剪枝。
- 离线用例 264 条（全绿）。

### English

- **Long-pressing a submenu no longer drags its parent row**: the host renders a
  submenu (e.g. Open with) *inside* its row button — the panel is a sibling of the
  button — so a press there looked like a press on the row. The press is now matched by
  `role=menuitem` against the row's own button and handed back to the host; the row
  button itself (chevron included) still drags.
- **Tucked entries have their icons back**: only the first `<svg>` used to be cloned, so
  rows whose icon is an `<img>` (e.g. "Open with Visual Studio Code") were blank in the
  panel and some rows copied the chevron too. The whole
  `[data-slot="contextMenu.icon"]` block is copied now, keeping `img` and `svg` in a
  14×14 slot; rows without an icon get an equal-width placeholder so labels stay aligned.
- **Rows dragged back out of "More" are visible again**: `applyContextLayout` used the
  return value of `rememberContextElement` as the "original display", but that returns
  null for an already-remembered element, so the current `none` was written back as the
  original — the order returned, the box did not, and tucking the last item emptied
  "More". The remembered value is read from `state.contextStyled` now.
- **The submenu looks like dsh-sidebar-row-menu**: the panel uses the host menu
  material (`--dsw-menu-surface-fill` + `backdrop-filter`, radius 16, padding 4, no
  shadow); rows follow the host menu-item metrics (34px, 6px 8px, gap 6, 13px/20px),
  icon slot 14px, and the "More" anchor matches that row height.
- **A divider lands below the row the right-click hit**: gaps are interpreted in painted
  order, but `toggleContextDivider` computed the index from DOM order — once a menu had
  been dragged the two diverged and the divider slipped one row down. Gaps are resolved
  from `layout.order` (minus `hidden`) now; `commitContextReorder` anchors on the
  painted order too, so one drag can no longer wipe a custom sort; a trailing gap is
  pruned against the visible row count.
- 264 offline assertions (all green).

## 0.9.3 — 2026-11-06

- **打开菜单的性能回归修掉了**：补开合动画时曾对菜单的每个子节点读 `getComputedStyle`，
  菜单刚挂载时这会触发整页强制样式重算——一次同步从 1.7ms 涨到 12.3ms，体感就是右键变慢。
  现在只读宿主自己写在 surface 上的 `--dsh-menu-enter` / `--dsh-menu-dismiss`，镜像段
  10.7ms → 0.2ms，开菜单耗时与禁用插件时同量级。镜像也改由 `data-menu-phase` 驱动
  （MutationObserver + `attributeFilter`，与宿主同一帧），不再靠 `animationstart` 追一帧。
- **入场淡入回来了，且不再闪**：镜像只打在宿主已经不动画的节点上（跳过菜单的直接子节点），
  宿主的入场动画不会被我们压掉，「移除类 → 宿主动画重播 → 再请求加类」的 260ms 循环不成立；
  出 ease-in 80ms、入 ease-out 40ms，与宿主的曲线一致。
- **「更多」的缩小反馈恢复**：0.9.2 为了消除抽搐把锚点的 `scale(0.94)` 与呼吸动画整块删掉了，
  这是删功能不是修 bug。现在命中区改测不缩放的 wrapper、`markDropMore` 幂等，缩放和呼吸
  只随手势切换一次，晃手不再反复放大缩小。
- 离线用例 257 条（全绿）。

### English

- **The opening slowdown is gone**: mirroring the open/close fade used to read
  `getComputedStyle` for every child of the menu, which forces a page-wide style recalc
  while the menu is still mounting — 1.7ms → 12.3ms per sync, felt as a slow right-click.
  The plugin now reads only `--dsh-menu-enter` / `--dsh-menu-dismiss` as published by the
  host: the mirror segment drops 10.7ms → 0.2ms and opening costs the same as with the
  plugin disabled. The mirror is driven by `data-menu-phase` (MutationObserver +
  `attributeFilter`, same frame as the host) instead of chasing `animationstart`.
- **The opening fade is back, without the flicker**: mirrors only touch nodes the host no
  longer animates (menu direct children are skipped), so the host's in-animation is never
  overridden and the "remove class → host restarts → class requested again" 260ms loop
  cannot form; ease-in 80ms out, ease-out 40ms in, matching the host's curves.
- **The "More" shrink feedback is restored**: 0.9.2 removed the anchor's `scale(0.94)` and
  breathing animation to stop the shaking — that deleted the effect instead of fixing it.
  Hit-testing now measures the unscaled wrapper and `markDropMore` is idempotent, so the
  scale flips once per gesture and hovering no longer pumps.
- 257 offline assertions (all green).

## 0.9.2 — 2026-11-06

- **菜单关闭时的整张淡出回来了**：0.9.1 为了跨块排序把宿主的 `_viewport_` / `_footer_`
  改成 `display: contents`，而这两个块正是宿主挂关闭动画（`_dsh-context-menu-out`，
  opacity 1 → 0）的地方；没有盒子的元素不绘制 opacity，于是行瞬间消失、只剩底板在淡出。
  现在监听宿主的动画起点，按它自己的时长与缓动在每一行（以及分隔线、`··· 更多`）上重播
  同一段淡出；入场淡入同样补齐，菜单开合重新是「一张菜单」在淡。
- **拖动时「更多」不再抽搐**：通用高亮类带的 `scale(0.94)` 会让指针停在锚点边缘时
  「命中 → 缩小 → 出框 → 复原 → 再命中」反复抖动。锚点现在不再缩放，进入后另有 6px
  粘滞余量，晃手也不会掉出收纳状态。
- 离线用例 253 条（全绿），新增两条：扁平化菜单的淡出 / 淡入会被重播到行上。

### English

- **The whole menu fades out again**: 0.9.1 flattens the host's `_viewport_` / `_footer_`
  to `display: contents` for cross-block ordering — and those are exactly the blocks the
  host animates on close (`_dsh-context-menu-out`, opacity 1 → 0). A box-less element
  paints no opacity, so the rows vanished and only the backdrop faded. The plugin now
  listens for the host animation, copies its duration and easing, and replays the same
  fade on every row (plus dividers and `··· More`); the opening fade is mirrored too.
- **No more shaking when hovering "More"**: the shared highlight class carried
  `scale(0.94)`, so a pointer resting on the anchor's edge looped through
  hit → shrink → out of bounds → restore → hit. The anchor no longer scales and keeps a
  6px sticky margin once entered.
- 253 offline assertions (all green), two new ones for the replayed fade out / fade in.

## 0.9.1 — 2026-11-06

- **「更多」落到整张菜单的最末端**：0.9.0 把锚点塞在 `_viewport_` 末尾，而宿主的
  `归档会话` 在 `_footer_`、插件按钮直挂门户根节点，所以锚点一直夹在中间。现在锚点挂在
  菜单根节点上、`order = 9999`，无论菜单底部还有谁，`··· 更多 ›` 都是最后一行。
- **整张菜单都能拖**：`归档会话` 这类菜单底部动作、以及插件直接挂在根节点上的按钮
  （如 `记忆参与 · 功能全开`）现在都能长按拖动，与主体条目一起排序、一起收进「更多」，
  也能从「更多」里拖回菜单任意位置。实现方式是在首次定制时把宿主的 `_viewport_` 与
  `_footer_` 内联 `display` 改为 `contents`，让所有行成为菜单这个 flex 容器的直接子级；
  未定制或重置时把宿主自己的值原样写回。
- 注入的分隔线也随之统一挂在菜单根节点上，间隙编号仍按「看得见的行」计数，
  `order = 2g - 1` 与行的 `order = 2i` 交错约定不变。
- 离线用例 251 条（全绿），新增：菜单底部动作与插件根级按钮可拖动、跨容器的顺序能落库、
  定制时两个宿主编排块被扁平化、重置后排版完整还原。

### English

- **"More" now sits at the very end of the menu**: 0.9.0 appended the anchor inside
  `_viewport_`, but the host keeps `Archive` in `_footer_` and plugin buttons on the
  portal root, so the anchor stayed wedged in the middle. It now lives on the menu
  root with `order = 9999`, so `··· More ›` is the last row no matter what follows.
- **The whole menu drags**: bottom actions such as `Archive` and buttons plugins add
  to the portal root (e.g. memory participation) can now be long-pressed and dragged
  like any other item — reordered, tucked into "More", and dragged back out. On first
  customization the plugin sets the host's `_viewport_` and `_footer_` inline
  `display` to `contents`, so every row becomes a direct child of the menu's flex
  container; without customization (or after a reset) the host's own values return.
- Injected dividers move to the menu root too; gap indices still count visible rows,
  with the same `order = 2g - 1` / `2i` interleaving.
- 251 offline assertions (all green), new ones covering dragging the footer action and
  the portal-level button, persisting a cross-block order, flattening the two host
  blocks, and restoring the layout on reset.

## 0.9.0 — 2026-11-06

- **右键菜单的「更多」收纳**：菜单打开时长按拖动条目，拖到列表最底部会出现
  `··· 更多 ›` 这一行（只在拖动期间出现），松手在这里就把条目从菜单里收走，
  放进它自己的二级菜单。
- **二级菜单**：悬停（或点击）`··· 更多 ›` 展开已收纳条目，位置优先在菜单右侧，
  右边放不下且左侧更宽时翻到左侧，纵向限制在视口内；点击其中一条等同点击原来那条
  菜单项，动作用图标和文字照着宿主的样子重排，不再需要拉开菜单找。
- **拖回原位**：长按二级菜单里的条目拖回菜单，落到某条上方就插回那个位置，拖到菜单
  底部则排到末尾；菜单里只剩一个可见条目时不再允许收纳，避免整张菜单变成只剩
  「更多」。
- 收纳列表按菜单（会话 / 工作区）分别保存在原来那条记录里（新增 `hidden` 数组，
  旧存档自动补空），与顺序、分隔线互不干扰。
- 拖动命中按**菜单当前实时位置**判断：宿主或别的插件在菜单打开后追加条目时，落点
  不会整体偏移一行。
- 离线用例 246 条（全绿），新增 12 条：锚点只在拖动时出现、锚点不参与行标记、
  拖入即隐藏、二级菜单的内容与展开方向、点击转发到宿主菜单项、从二级菜单拖回菜单。

### English

- **"More" tucking for context menus**: while a menu is open, drag an item toward the
  bottom of the list and a `··· More ›` row appears (only during a drag); release on it
  and the item leaves the menu and moves into its own submenu.
- **Submenu**: hovering (or clicking) `··· More ›` lists the tucked items, placed to the
  right of the menu when there is room, flipped to the left when that side is wider, and
  clamped vertically to the viewport. Clicking one of them clicks the original host menu
  item, with the icon and label laid out the way the host does it.
- **Drag back**: long-press a tucked item and drag it into the menu to insert it above a
  row, or onto the bottom to append it. Tucking is refused when only one visible item is
  left, so a menu can never collapse into nothing but "More".
- The tucked list is stored per menu (session / workspace) inside the existing record as
  a new `hidden` array; older saves get an empty one, and order and dividers stay
  untouched.
- Hit-testing uses the menu's **live geometry**, so a row appended by the host or another
  plugin after the menu opened no longer shifts the drop targets by a row.
- Offline assertions grew to 246 (all green) with 12 new ones: the anchor appears only
  while dragging, it never carries a row tag, dropping tucks, submenu contents and
  direction, click forwarding, and dragging back out.

## 0.8.4 — 2026-11-06

- 右键菜单最下面那几个动作也能增删分隔线了：菜单底部（`归档会话`）与插件直接挂在
  门户根节点上的按钮（如 `记忆参与 · 功能全开`）现在都参与“该条下方”的间隙计算，
  只有整个菜单的最后一个动作是空操作。它们仍然不可拖动，顺序也不会被写进存储。
- 位于 footer 的分隔线会渲染在 footer 自己的纵向排序里，视觉上仍落在
  `永久删除会话` 与 `归档会话` 之间、或 `归档会话` 与下面那个按钮之间。
- 离线用例 225 条（全绿），新增“footer 动作拥有它下方的空隙”“最后一个动作没有可以
  分割的东西”等回归；会话菜单夹具补了一个直挂根节点的按钮。

### English

- The bottom actions of a context menu can toggle dividers too: the footer row
  (`Archive`) and buttons plugins append straight to the portal root (e.g.
  `Memory participation`) now take part in the "gap below this action" numbering;
  only the very last action of the whole menu is a no-op. They still cannot be
  dragged and their slots are never persisted.
- A divider that belongs to the footer block renders in the footer's own vertical
  order, so it still lands between `Delete permanently` and `Archive`, or between
  `Archive` and the button below it.
- Offline assertions grew to 225 (all green), adding "the footer action owns the
  gap below it" and "the last action has nothing to divide"; the session-menu
  fixture gained a button appended to the portal root.

## 0.8.3 — 2026-11-06

- 修复「重置后只删了一条分隔线，刷新窗口行顺序就乱」：首次定制时按**测量出来的位置**保存顺序，
  而插件行（如「用 Visual Studio Code 打开」）常比菜单晚一帧挂载，量到的 `top` 是 0，
  于是被当成第一行写进存储，刷新后就固定在那里。现在首次定制按**文档顺序**保存，
  测量异常不会再被持久化；同时忽略未完成布局（高度为 0）的行对原生分隔线归属的判断。
- 菜单还在挂载时不再回写剪裁后的分隔线（500ms 内只影响本次绘制），避免插件行晚到时把
  用户存下的分隔线剪掉。
- `contextMenu.set()` 立即重绘当前打开的菜单；设置页「恢复本组」对已打开的菜单同样即时生效。
- 离线用例增至 224 条（全绿），新增“测量为 0 的行必须保持文档顺序”回归。

### English

- Fixed "reset, delete one divider, refresh — the order is scrambled": the first
  customization saved the order from measured positions, but plugin rows (e.g. "Open with
  Visual Studio Code") mount a beat after the menu and measure `top: 0`, so they were
  written first and stuck there after a reload. The first customization now saves the
  **document order**; a bogus measurement can no longer be persisted. Rows without a
  layout (height 0) are also ignored when attributing the host's own separators.
- A menu that is still mounting no longer writes pruned dividers back (for the first
  500ms pruning affects only the current paint), so a late plugin row cannot delete a
  saved divider.
- `contextMenu.set()` repaints the open menu immediately, and the settings card's reset
  now also applies to a menu that is already open.
- Offline assertions grew to 224 (all green), including "a row measured at zero keeps its
  document slot in the saved order".

## 0.8.2 — 2026-11-06

- 修复右键菜单分隔线的增删与位置：菜单打开后再定制时，宿主自带的原生分隔线没有被隐藏
  （`rememberContextElement` 对已记录节点提前返回），它们以 `order: auto` 留在 flex 流里、
  漂到列表顶部，看起来就是“线位置不对、加了删不掉”。现在首次定制会立刻接管并隐藏它们。
- 修复行标签漂移：子菜单（如「打开方式」）面板里的 menuitem 会抢走所在行的标签，导致内容
  哈希变化、行 id 不稳定；现在每个 flex 条目只取最外层的 menuitem，标签也识别
  `.submenu-label`。
- 修复“菜单刚展开就立刻右键”：此时行还没挂全，按半成品基线落库会丢行、丢原生分组。
  这次右键现在先记账，等下一帧菜单完整后再执行；菜单内任意右键也不会再关闭菜单。
- 分隔线仍按位置保存（不随条目移动），落到底部/越界时自动删除并回写。
- 离线用例增至 223 条（全绿），新增“定制后宿主分隔线必须隐藏”“隐藏子菜单不得多出行或
  抢标签”等回归。

### English

- Fixed divider add/remove and placement: when a menu was customized while open, the
  host's own separators were never hidden (`rememberContextElement` returns early for
  already-tracked nodes), so they stayed in the flex flow with `order: auto` and drifted
  to the top of the list — the reported "wrong position / cannot remove". The first
  customization now takes them over and hides them immediately.
- Fixed row-label drift: entries of a submenu panel (e.g. "Open with") stole the label of
  the row owning them, changing the content hash and destabilizing row ids. Each flex item
  now keeps only its outermost menuitem, and labels also match `.submenu-label`.
- Fixed "right-click immediately after the menu opens": rows were not all mounted yet, so
  materializing the baseline lost a row and the shipped grouping. That right-click is now
  parked and replayed on the next frame, after the menu is complete; right-clicks inside
  the menu no longer close it either.
- Dividers are still positional (they do not follow items) and one that lands below the
  last item is dropped and written back.
- Offline assertions grew to 223 (all green), including regressions for "customizing hides
  the host's own separators" and "a hidden submenu adds no rows and steals no label".

## 0.8.1 — 2026-11-06

- 新增会话栏 / 工作区栏右键菜单的整理能力（仅 DSH 0.2.2 及以上；0.2.1 上自动关闭，
  设置页也不显示这张卡片）：打开菜单后长按任意条目即可拖动排序，松手菜单保持展开。
- 菜单打开时右键某个非底部条目，可切换它下方的分隔线（再右键一次取消）；分隔线按位置
  保存，条目移动时它留在原地，落到菜单最下方会自动删除。右键菜单的右键切换不会关闭菜单，
  也不会触发条目本身的动作。
- 设置页新增「右键菜单」卡片（位于「跨窗口共用布局」下方）：一个开关 + 恢复本组。
  会话与工作区各存一份顺序和分隔线，存 `localStorage` 的
  `dsh.sidebar-organizer.context-menu.v1`，不随跨窗口布局同步，也不影响七区域布局。
- 兼容 dsh-session-menu 等第三方菜单项：图标行外层的 `role="separator"` 包装不再被误当成
  真分隔线；显示为 `display:contents` 的组件贡献行按其真正的 flex 子元素排序。
- 控制台新增 `window.__dshSidebarOrganizer.contextMenu`
  （`supported / enabled / setEnabled / reset / read / set`），并补了 22 条离线用例
  （221 PASS）。

### English

- New: session-row and workspace-row right-click menus can be organized (DSH 0.2.2+
  only; on 0.2.1 the feature turns itself off and its settings card is hidden).
  Open the menu and long-press an item to drag it into a new order; the menu stays
  open after the drop.
- While the menu is open, right-click a non-bottom item to toggle a divider below
  it (right-click again to remove). Dividers are stored by position, so they stay
  put when items move, and one that ends up below the last item is dropped. The
  right-click that toggles a divider neither closes the menu nor runs the item.
- The settings page gains a "Context menus" card below "Shared layout across
  windows": one switch plus a per-group reset. Session and workspace keep separate
  orders and dividers in `localStorage`
  (`dsh.sidebar-organizer.context-menu.v1`), outside cross-window layout sync and
  independent of the seven-scope layout.
- Works with third-party items such as dsh-session-menu: a wrapper carrying
  `role="separator"` around an icon row is no longer mistaken for a real divider,
  and `display:contents` component contributions are ordered through their actual
  flex child.
- New console handle `window.__dshSidebarOrganizer.contextMenu`
  (`supported / enabled / setEnabled / reset / read / set`), plus 22 offline
  assertions (221 PASS).

## 0.8.0 — 2026-11-06

- 新增「拖动热键」：默认不绑定，绑定时可携带 Ctrl/Alt/Shift/Win 组合。未绑定时长按拖动
  与旧版完全一致。
- 两种放行方式可分别或同时开启：「长按」要求按住热键才能开始拖动，松开热键会立即中止
  进行中的拖动；「开关」按一下热键开启拖动、再按一下关闭。
- 设置页新增热键卡片（位于「跨窗口共用布局」下方）：点击后按下组合键完成绑定，点击空白
  处取消，点「清除」回到未绑定；录制期间的按键只用于绑定，不触发宿主快捷键，也不会误起
  拖动。未绑定热键时两个模式开关置灰。
- 热键仅在输入框/文本域之外生效（带 Ctrl/Alt/Meta 的组合键例外），避免打字时误触发。
- 热键与模式保存在本窗口的 `localStorage`，不随「跨窗口共用布局」同步；导出配置暂不包含
  热键。

### English

- New drag hotkey: unbound by default; bindings may include Ctrl/Alt/Shift/Win. While
  unbound, long-press dragging behaves exactly as before.
- Two independent gates: Hold requires the key to be held before a drag can start and
  aborts an in-flight drag when released; Toggle flips dragging on with one press and
  off with the next. Both can be enabled at once.
- The settings page gains a hotkey card below "Shared layout across windows": click,
  press the combination, click elsewhere to cancel, or Clear to unbind. Keys pressed
  while recording belong to the binding only — host shortcuts and drags stay inert.
  Both mode switches are disabled until a key is bound.
- The gate ignores bare keys typed into inputs/textareas (Ctrl/Alt/Meta chords still
  work) so ordinary typing cannot arm dragging.
- The hotkey and its modes live in this window's `localStorage` and are not part of
  cross-window layout sync or the exported config.

## 0.7.5 — 2026-11-05

- 设置页导航新增自定义图标：DSH 0.2.2+ 通过 `settings.section.icon` 槽位为「布局整理」
  注册拖拽面板图标（面板 + 左侧三点抓手，随文字颜色与主题切换）；0.2.1 上自动跳过，
  继续使用宿主默认图标。
- 版本判断忽略预发布后缀（`0.2.2-rc.1` 视为 0.2.2）；图标槽位注册失败只告警，不影响
  设置页本身。

### English

- Custom settings nav icon: on DSH 0.2.2+ the "布局整理" section registers a
  drag-panel glyph through the `settings.section.icon` slot (panel plus a
  three-dot handle, inheriting the text color in both themes). DSH 0.2.1 skips
  the registration and keeps the host's default icon.
- The version gate ignores prerelease tags (`0.2.2-rc.1` counts as 0.2.2); a
  failed slot registration only warns and leaves the settings page intact.

## 0.7.4 — 2026-11-05

- 适配 DSH 0.2.2-rc.1：会话头部「更多操作」新增首项「复制会话为 Markdown」后，旧版按
  菜单位置生成的 `dso-host-0` 等 id 会整体平移，已拉出的「下载 Session 日志 / 反馈」快捷
  按钮可能变成别的动作。现在快捷动作改用按标签内容计算的稳定 id（`dso-host-h<8hex>`）；
  打开菜单时按「标签 + 图标 → 标签 → 唯一图标」把旧布局里的位置 id 迁移到新 id，未匹配
  的旧 id 原样保留，不会重定向到另一动作。
- 0.2.2 在窄浏览器窗口把设置导航改为横排。设置区域不再固定纵轴，而是读取容器实际的
  `flex`/`grid` 排布方向，拖拽插入线、Alt+方向键与快照轴保持一致。
- 修复全新会话里头部只剩宿主「更多操作」按钮时，头部区域因没有可排序列而不被记录、
  菜单项无法拉出的问题；现在空头部也保留「更多操作」锚点。
- 「恢复默认 / 恢复本区域」现在会移除已拉出的头部快捷按钮并重新发现头部行，避免旧按钮
  被当成本地行写回布局。
- `package.json` 增加顶层 `engines.dsh`，让宿主真正执行兼容性门槛（此前只写在 `dsh.engines`
  下，宿主的检查读不到）。
- 回归夹具更新为 0.2.2 结构，并新增旧位置 id 迁移、后续插入不重编号、横向设置导航、
  统一右键菜单不抢占头部菜单的用例；全部断言通过。

### English

- DSH 0.2.2-rc.1 support: its shipped header More menu now starts with "Copy as
  Markdown", which shifted every positional `dso-host-N` id and could turn an
  adopted download/feedback shortcut into a different action. Shortcuts now use a
  content-stable id (`dso-host-h<8hex>`); opening the menu reconciles legacy ids by
  label + icon, then label, then a unique icon. Unmatched ids are left untouched
  instead of being redirected.
- 0.2.2 lays the settings nav out horizontally in short browser windows. The
  settings scope now reads the rendered `flex`/`grid` direction for its drag axis,
  so the insertion line, Alt+arrow keys, and snapshots agree.
- A fresh session whose header exposes only the shipped More button used to lose
  the header scope entirely (no sortable rows), so its menu items could not be
  adopted. The empty header now keeps the More anchor.
- Reset / reset-region now removes adopted header shortcuts and rediscovers the
  header rows, so stale buttons cannot be written back as local rows.
- `package.json` gains a top-level `engines.dsh`; the host's compatibility gate did
  not read the previous nested `dsh.engines.dsh`.
- The harness fixture models 0.2.2 and adds regressions for legacy id migration,
  later insertions, horizontal settings nav, and unified context menus; all
  assertions pass.

## 0.7.3 — 2026-11-04

- 仅文档：README 的版本说明改为不随版本漂移的写法，安装示例指向 `v0.7.3`，中英文路线图补齐
  0.7.2 一行并删去无障碍目标。无代码变更。

### English

- Docs only: the README version blurb no longer hard-codes a version, the install
  example points at `v0.7.3`, and both roadmaps gain the 0.7.2 row while dropping the
  accessibility goal. No code changes.

## 0.7.2 — 2026-11-04

- 修正：桌面端窗口里拖好的顺序，在浏览器打开的 Web 界面（`http://127.0.0.1:<端口>`）里
  看不到，两个界面各显示各的。原因是布局只写在 `window.localStorage`，而桌面窗口的
  origin 是 `dsh-app://app`、Web 界面是 `http://127.0.0.1:<端口>`，端口每次重启还会变，
  浏览器按 origin 隔离，同一台机器上的两份存储本来就互不相通。
- 现在布局同时存到宿主侧 `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`：桌面端
  与任意端口的 Web 界面读写同一份，重启桌面端、换端口都不影响；`localStorage` 保留为
  本地缓存，宿主不可用时（旧版宿主、静态页、离线）照旧按本地布局工作。
- 合并规则是「更新时间戳较新者胜」：拖动后 350ms 内上传一次，窗口重新可见或获得焦点时
  拉取一次；拉到的顺序会立即重排当前页面，不会反过来再上传。
- 新开窗口且宿主还没有存档时保留本地顺序，不会用一个空布局抹掉桌面里已经拖好的配置；
  只有「恢复默认」才显式清空宿主存档。
- 只有真正动过顺序的窗口才会成为发布源：启动时的默认登记、投影 pass 写回的布局都只留在
  本地，不会把默认顺序上传后盖掉另一个窗口里拖好的配置；升级前就存在本地、且与宿主注册
  顺序不同的布局会被认作旧版手工配置，首次启动时接管宿主存档。
- 新增：设置页「布局整理」顶部有「跨窗口共用布局」开关。关掉后每个窗口只用自己的本地
  布局，不再上传或拉取宿主存档（即 0.7.1 的行为），桌面端与 Web 界面各排各的；重新打开
  会立即拉取宿主那份并继续共用。

### English

- Fix: the order dragged in the desktop window was not visible in the Web UI opened in a
  browser (`http://127.0.0.1:<port>`) — each showed its own layout. The layout lived only
  in `window.localStorage`, and the desktop window (`dsh-app://app`) and the Web UI are
  different origins (the port changes on every restart), so the two stores never met.
- The layout is now also stored host-side at
  `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`: the desktop window and a Web UI
  on any port read and write the same copy; `localStorage` stays as a local cache for
  older hosts, static pages and offline use.
- Merging is last-write-wins by timestamp: a change is pushed 350 ms after the last edit and
  pulled when a window becomes visible or focused; an adopted layout is re-applied locally
  without echoing back an upload.
- A fresh window keeps its local order when the host has no copy yet (so an empty layout
  cannot wipe an existing one); only "reset to default" clears the host copy.
- Only windows that really rearranged something publish: the boot-time registration and the
  projection pass writeback stay local, so a default order can never overwrite an arranged
  one in another window; a pre-upgrade local layout that differs from the host registration
  order is treated as hand-made and takes over the host copy on first boot.
- New: a "Shared layout" switch at the top of the settings page. Turned off, every window
  keeps only its own local layout and stops reading or writing the host copy (the 0.7.1
  behaviour), so the desktop window and the Web UI can be arranged independently; turning
  it back on pulls the host copy immediately.

## 0.7.1 — 2026-11-04

- 修正：「更多操作」菜单内拖动宿主菜单项（下载 Session 日志 / 反馈）重排后松手不生效。
  宿主菜单项不属于收纳列表，提交时误走了收纳排序通道，必然失败；现在宿主菜单项有
  自己的顺序存储（按标签保存，因为宿主每次打开菜单都会重新分配内部 id），菜单关闭
  重开或刷新页面后顺序保持，且只与同类宿主菜单项互排，不影响已收纳项的顺序。
- 修正：在「更多操作」菜单内完成重排后菜单会被立即关闭。现在菜单内重排保持展开，
  只有把行拖出菜单、或拖回「更多操作」执行收纳时菜单才关闭。
- 修正：纯图标行（会话头部图标等）的拖影带有黑色圆角方块。原判据是「源行背景透明
  才使用扁平拖影」，但指针悬停在图标上时宿主会给出半透明浅色底，判据失效后又套上
  了深色卡片底；现在改为按行内有无文字判断，图标行拖影一律透明底、无阴影。

### English

- Fix: reordering the shipped menu items ("Download session log" / "Feedback")
  inside "More actions" did not stick on release. Those rows are not part of the
  tucked list, so the commit went through the tucked-order path and always
  failed; they now have their own label-keyed order (the host reassigns internal
  ids every time the menu opens), persisted across menu reopen and reload and
  kept separate from tucked rows.
- Fix: finishing a reorder inside "More actions" closed the menu immediately.
  It now stays open for in-menu reordering and only closes when a row is dragged
  out of the menu or onto "More actions" to be tucked away.
- Fix: glyph-only rows (session-header icons and the like) dragged with a black
  rounded tile behind them. The flat ghost was selected only when the source
  background was fully transparent, but hovering an icon makes the host paint a
  translucent tint, so the check failed and the dark card surface came back. The
  decision now keys on whether the row has text, and icon-only rows always get a
  transparent, shadowless ghost.

## 0.7.0 — 2026-11-04

- 新增「会话头部工具条」区域：对话页右上角那排图标（提醒、底部面板、上下文诊断、
  解除卡顿、查找等）现在也支持长按拖动排序、收进「更多操作」与从「更多操作」拖回。
- 条带里的宿主控件保持原样：「更多操作」按钮本身不参与排序、也不可收纳，始终停在
  它自己的位置；「用文件资源管理器打开 / 更多打开方式」这类分屏组合控件同样整体
  保留，不会被拆成可拖动行。
- 收纳落点就是官方内置的「更多操作」菜单（下载 Session 日志 / 反馈所在的那个）：
  已收纳条目以菜单行的形式注入原生两项上方，不额外添加标题；菜单打开期间保持同步，
  点击条目会触发对应组件，拖出即恢复原位。该菜单由官方插件硬编码、不暴露插槽，
  因此改用 DOM 注入并随菜单开合清理。
- 官方菜单里的「下载 Session 日志」「反馈」也可以拖到条带上，生成同名图标按钮，
  点击等同于点击该菜单项；拖回「更多操作」即撤下该按钮。
- 与其他区域一致的独立拖动开关、按区域恢复、配置导入/导出；存储格式不变，旧的 v3
  布局会自动补上该区域，无需迁移。0.7.0 起设置里的「布局整理」页面也包含该区域的
  卡片。
- 修正：从菜单拖出条目后宿主菜单会停留在屏幕上——关闭动作改走一个不受拖拽后点击
  守卫影响的通道；同时修正拖动预览与实际落点偶尔不一致的问题（保存顺序里存在宿主
  当前未渲染的条目时，落点索引会整体偏移，表现为预览线画得出、松手却不动）。
- 修正拖影白边：会话头部的图标按钮靠外层容器提供「无边框、无内边距、居中」的样式，
  拖影克隆到 `<body>` 后这层样式失配，浏览器给按钮补上默认的 2px 浅色描边。现在把
  源行实际生效的边框、内边距、显示方式与对齐一并冻结到拖影上。

### English

- New "session header" scope: the icon strip at the top right of a conversation
  (reminder, bottom panel, context diagnostics, unstick, find, …) now supports
  long-press reordering, tucking into "More actions", and dragging back out.
- Host chrome inside the strip stays untouched: the "More actions" button itself
  is neither sortable nor tuckable and keeps its own place, and split controls
  such as "Open in file explorer / More ways to open" stay whole instead of
  being split into draggable rows.
- Tucked rows land in the shipped "More actions" menu (the one with "Download
  session log" and "Feedback"): they are injected as menu rows above the native
  items without adding a heading, stay in sync while the menu is open, activate
  the component when clicked, and return to their place when dragged out. That
  menu is hardcoded by an official plugin and exposes no slot, so the rows are
  injected as DOM and torn down with the menu.
- The shipped "Download session log" and "Feedback" items can be dragged onto
  the strip as icon buttons that perform the same action as the menu item; drop
  one back on "More actions" to take it away again.
- The scope has its own drag switch, region reset, and configuration
  import/export like every other scope; the v3 storage format is unchanged (old
  layouts simply gain the new scope), and the "Layout organizer" settings page
  lists it from 0.7.0 on.
- Fix: dragging a row out of the "More actions" menu left the host menu open;
  closing it now bypasses the post-drag click guard. Drag preview and drop
  position no longer disagree either: a saved order can list a row the host does
  not paint right now, and its slot used to shift every drop index.
- Fix the ghost's light frame: the session-header icon buttons get "no border,
  no padding, centered" from a wrapper selector that no longer matches once the
  clone sits on `<body>`, so the browser supplied its default `2px outset` button
  border. The clone now freezes the source row's resolved border, padding,
  display and alignment.

## Unreleased

- 发布自动化：推送 `v*` 标签后，GitHub Actions 会从该标签构建客户端 bundle、
  校验提交的 `lib/` 与 `src/` 一致、打出 `.tgz` 并附加到 Release，同时生成
  `SHA256SUMS` 和包含 DSH 安装指引的发布说明。新增 CI 在 push / PR 时执行同样的
  构建与一致性校验。

### English

- Release automation: pushing a `v*` tag now makes GitHub Actions build the client
  bundle, verify that the committed `lib/` matches `src/`, pack the `.tgz`, attach it
  to the Release, and generate `SHA256SUMS` plus install instructions for DSH. A new
  CI workflow runs the same build and consistency checks on pushes and pull requests.

## 0.6.1 — 2026-11-04

- 修复从「更多」菜单拖动已收纳条目时拖影是直角方块：已收纳行由一层普通的
  `.dso-menu-item` 容器包住宿主圆角按钮，此前插件只读取容器自身的圆角（0），
  并把 `border-radius: 0 !important` 冻结到拖影上。现在会继续查找容器内真正
  带圆角的行按钮，取它的圆角；只有确实没有圆角时才回退到默认值。

### English

- Fix the square drag ghost when dragging a collected row out of the "More" menu:
  collected rows are a plain `.dso-menu-item` wrapper around the host's rounded
  menu button. The organizer used to freeze only the wrapper's own radius (0) as
  `border-radius: 0 !important` on the ghost. It now resolves the radius from the
  rounded row button inside the wrapper and falls back to the default only when
  no rounded element exists.

## 0.6.0 — 2026-11-02

首个正式版：把 0.5.x 预览版验证过的六区域整理、设置页与配置导入/导出收拢为稳定发布，
并完成下列收尾修复。npm 上的 `latest` 由 0.4.3 直接更新到 0.6.0；0.5.x 预览版此前只在
GitHub 发布。

- 修复窗口变窄（例如打开右侧栏）后已收纳的对话视图「跑出来」：宿主会根据标签栏
  宽度把放不下的视图折叠进「更多」菜单，被收纳的视图于是以宿主普通条目的形式出现
  在「已收纳」上方；同时「已收纳」区又因为对应标签已不在 DOM 中而整块消失，只剩
  「恢复默认排序」。现在折叠进菜单的已收纳视图仍列在「已收纳」下方，宿主对应的
  重复条目会被隐藏，点击后照常打开该视图。
- 修复刷新后侧栏的自定义顺序丢失（同一份配置里的收纳状态却仍然有效）：启动时
  插件会分多次发现宿主行，第一次只看到部分行时，旧逻辑会把尚未出现的行从保存
  顺序里剪掉并立即写回；这些行稍后挂载时就成了「新条目」，被按宿主位置插回，
  自定义顺序因此被冲掉。现在尚未发现的行会和已收纳行一样保留在保存顺序中。
- 新增配置导入 / 导出：设置页标题栏可把六区域的排序、收纳状态与拖动开关导出为
  JSON 文件，也能导入同格式文件整体替换当前配置。版本不兼容、缺少布局块或 JSON
  损坏时整份拒绝，不会只应用一半；导入后的顺序也不会被旧版尾行修复再次改写。
- 修复拖动对话标签（「对话 / 轨迹」）时页面右侧多出一条滚动条：宿主的标签样式
  给克隆行带上了 `position: relative`，拖影于是落进 body 常规流、把文档撑高。
  现在拖影强制 `position: fixed !important`，不再参与页面布局。
- 修复标签插入线偏下、不居中：宿主标签在底部预留 9px 给当前项的下划线，插入线
  原来按整个行盒居中，视觉上比文字低。现在按行的内容区居中，与标签文字对齐。
- 修复把右侧栏组件拖进「更多」时松手会误触发一次点击：投放走 180ms 收纳动画，
  点击护栏（500ms）原本要等动画结束才生效，而浏览器在 pointerup 当刻就派发了
  click，于是被激活的是刚拖走的那一行。现在 pointerup 里先同步装上护栏再提交
  投放，拖进「更多」只收纳、不激活。
- 修复设置导航里的「布局整理」入口无法拖动：它原先和 better-sidebar 的设置入口
  一样被固定。现在本插件自己的入口可以拖动排序，但仍不能收起；better-sidebar 的
  入口保持完全固定，避免拖走后找不到它自己的恢复入口。
- 设置导航有收纳项时，导航底部新增「更多」按钮：列出已收纳的设置项，点击直接
  打开对应设置页；也可以把其他设置行继续拖进去。收纳第一项仍需在配置页操作。

### English

First stable release: promotes the six-scope organizer, settings page, and
configuration import/export validated in the 0.5.x previews, and includes the
cleanup fixes below. npm's `latest` tag moves from 0.4.3 straight to 0.6.0; the
0.5.x previews were published on GitHub only.

- Fix tucked conversation views leaking back into view when the pane gets narrow
  (for example after opening the right sidebar): the host folds views that no
  longer fit into the header "More" menu, so a tucked view reappeared there as an
  ordinary host row above "已收纳", while the tucked block itself disappeared
  (its tab was no longer in the DOM) and only "Reset layout" remained. Folded
  tucked views now stay listed under the tucked caption, the duplicate host rows
  are hidden, and clicking one still opens that view.
- Fix a custom sidebar order being lost after a reload while the same layout's
  tucked state survived: at startup the plugin discovers host rows in several
  passes. On the first pass it saw only some rows and pruned the rest from the
  saved order, writing that partial order back. The missing rows then mounted,
  looked brand new, and were inserted at their host positions, wiping out the
  custom order. Undiscovered rows now stay in the saved order, just like tucked
  rows.
- Add configuration import/export: the settings header exports the order, tucked
  rows, and drag switches of all six sections as a JSON file, and imports the
  same format as a full replacement. A version mismatch, a missing layout block,
  or broken JSON is rejected whole instead of half-applied, and the legacy
  trailing-row repair cannot rewrite the imported order.
- Fix a stray page scrollbar while dragging the conversation tabs: the host tab
  class sets `position: relative`, so the cloned ghost fell into normal flow at
  the bottom of the page and grew the document. The ghost is now pinned with
  `position: fixed !important` and no longer affects layout.
- Fix the tab insertion line sitting too low: the host tab reserves 9px at the
  bottom for the active underline, so centering on the padding box put the line
  below the labels. It now centers on the row's content box, aligned with the
  tab text.
- Fix a component in the right sidebar being activated when it is dropped onto
  "More": the drop runs a 180 ms absorb animation and the 500 ms click guard
  was only armed when that animation ended, while the browser dispatches the
  click immediately on pointerup, so the row that had just been dragged away
  received it. The guard is now armed synchronously in pointerup before the
  drop commits, so dropping onto "More" only tucks the row.
- Fix the "Layout organizer" entry in settings navigation being undraggable: it
  was pinned together with better-sidebar's settings entry. Our own entry can now
  be reordered, though it still cannot be tucked; better-sidebar's entry stays
  fully fixed so its own recovery path cannot be dragged away.
- When settings navigation has tucked rows, a "More" button now appears at the
  bottom of the list: it lists the tucked settings and opens the matching section
  on click, and accepts further drops. Tucking the first row still happens from
  the settings page.

## 0.5.7-preview.1 — 2026-11-02

- 修复从「已收纳」区域把条目拖出来的问题：拖拽源行（弹出菜单里的那一行）
  之前被设成完全透明，原位只剩拖影，看起来像条目凭空消失。现在它与侧栏行
  一致，保留在原位并淡化到 35%，菜单不会跳动，落点判定不变。

### English

- Fix dragging a tucked item out of the "More" popup: the source row used to be
  set to `opacity: 0`, so the popup showed no placeholder at the original spot
  and only the ghost remained. It now stays in place at 35% opacity, matching
  sidebar rows; the popup keeps its layout and drop targets are unchanged.

## 0.5.6-preview.1 — 2026-11-02

- 修复安装后右侧栏起始页（「开始」）的入口被整体向下挤压：宿主的
  `.guide::after` 占位伪元素（`flex: 0 10%`）原本固定在末尾，而本插件给行写入
  的 `order` 让它插到了标题图标与第一张卡片之间，窗口越高空隙越大。现在用
  样式把它固定在所有行之后，恢复安装前的排布。

### English

- Fix the right sidebar's start page being pushed down after installing the
  organizer: the host's `.guide::after` spacer (`flex: 0 10%`) is meant to sit
  last, but the `order` values written on our rows made it land between the
  compass and the first card, so the blank band grew with the pane height. A
  style rule now pins the spacer past every ordered row, restoring the original
  layout.

## 0.5.5-preview.1 — 2026-11-02

首个 0.5.x 预览版，仅以 GitHub Pre-release 发布，未发布到 npm。包含
0.5.0–0.5.5 的全部改动：整理范围扩展到六处位置，新增「布局整理」设置页与
分区拖动开关，并修复右侧栏入口回位、横向标签插入线、短按缩放等问题。各版本
的细节见下方条目。

### English

First 0.5.x preview, published only as a GitHub pre-release (not on npm). It
includes every change from 0.5.0 through 0.5.5: the organizer covers six
locations, adds the "Layout organizer" settings page with per-section drag
switches, and fixes right-guide entry placement, horizontal tab insertion
lines, and the short-press scale. Details stay in the per-version entries below.

## 0.5.5 — 2026-11-02

- 修复 0.5.4 已写入的旧布局：新插件入口曾被追加到右侧栏末尾，现在会按宿主
  顺序做一次性回正，同时保留用户之后主动调整的位置。
- 横向标签的拖动指示线改为按完整视觉列表计算间隙中点，不再贴在最后一项的
  右侧边缘，看起来落在标签文字中间。
- 移除 pointerdown 时的按压缩放，短按不再触发 0.94 缩小；只有进入长按拖动
  才出现拖动状态。

### English

- Repair layouts already persisted by 0.5.4: a newly discovered right-guide entry
  that had been appended to the end is moved back to its host position once,
  while later deliberate moves are preserved.
- Horizontal tab drop lines now use the full visual list and land in the middle
  of the real gap, instead of clinging to the last remaining row's edge.
- Removed the pointerdown press scale, so a normal short click no longer shrinks
  the row; only an actual long-press drag enters the dragging state.

## 0.5.4 — 2026-11-02

- 拖动「已收纳」菜单行时隐藏源行，只留下拖动预览，不再出现预览框与原行重叠、
  文字重影的问题。
- 每个区域新增独立的「拖动」开关（设置 → 布局整理 / 插件详情页）：关闭后该区域
  不再响应长按拖动或菜单行拖拽，布局与排序保持不变。
- 新安装的插件向右侧栏插入入口时，不再被追加到列表末尾，而是保留宿主原本的
  插入位置；右侧栏中不归本插件管理的动态控件也固定排在入口卡片之后。
- 拖动开关与布局分开保存，「恢复默认排序」不会悄悄重新打开已关闭的区域。

### English

- While dragging a row in the "Hidden" menu, the source row is now invisible so
  the preview no longer overlaps and doubles its own label.
- Each section has its own "Drag" switch in Settings → Layout organizer (and the
  plugin detail page). Turning it off disables long-press and menu-row dragging
  in that section without changing its saved layout.
- A newly installed plugin's right-guide entry now keeps the host's insertion
  position instead of being appended below the whole list; dynamic right-guide
  chrome that this plugin does not own stays after the entry cards.
- Drag switches are stored separately from layout, so "Reset layout" never
  silently re-enables a section the user turned off.

## 0.5.3 — 2026-11-02

- 将「拖入更多」的收纳动画回滚到 0.4.x：三关键帧飞入 + 一次性接收脉冲，
  且动画结束后才隐藏源行，不再先隐藏导致列表跳动。
- 悬浮「更多」时只保留虚线框与呼吸描边，不再提前播放接收脉冲。
- 虚线框始终画在真正的触发按钮上，不再落到无圆角的 Tooltip/flex 包裹层，
  修复「更多」虚线框变成直角大框的问题。
- 修正横向标签的插入指示线：落在两行之间的空隙中央，而不是贴着下一行
  边缘，避免标签间距较大时看起来整体偏移。
- 窗口失焦时取消拖拽，避免指示线残留在界面上。

### English

- Restored the 0.4.x absorb animation: three-keyframe flight plus a one-shot
  receive pulse, and hide the source row only after the flight finishes.
- Hovering More arms only the dashed ring and breathing outline; the receive
  pulse no longer plays before release.
- The dashed ring is always applied to the real trigger button instead of a
  square-cornered Tooltip/flex wrapper.
- Horizontal insertion lines now sit in the middle of the gap between rows
  instead of hugging the next row's edge, so wide tab gaps no longer look
  offset.
- Cancel a drag when the window loses focus, preventing a stuck indicator.

## 0.5.2 — 2026-11-02

- 修复区域恢复：每个「更多」菜单只恢复自己所属区域（侧栏/对话区/右侧栏），
  不再一次改掉全部六处；恢复时同步刷新 DOM，已收纳的行会立即重新出现。
- 修复清理旧布局：`forgetLayout()` 同时删除 legacy 键，重置后旧平面布局不会
  在下次读取时复活。
- 修复 footer/composer 行识别：只有真正的「更多」溢出按钮才被当作收纳锚点；
  设置齿轮、模型选择器等自带菜单的行不再被误判为 More，footer 与 composer
  重新可以拖动。
- composer 只收集 slot outlet 自己的子项；`ContextMeter` 等宿主 chrome 只 pin
  到末尾，不参与排序、不写标记，修复输入框上方错位。
- 右侧栏只接受带 `[data-sidebar-right-guide-entry]` 的 guide 卡片，忽略动态
  chrome；better-sidebar 的设置入口固定不可拖动/收纳，避免破坏其恢复路径。
- harness 增至 45 项断言，覆盖区域恢复、composer tail、right chrome、
  better-sidebar 固定项和菜单触发器行。

### English

- Region-scoped reset: each More menu now resets only its own region
  (sidebar / conversation / right sidebar) instead of all six scopes, and
  refreshes synchronously so tucked rows reappear immediately.
- Reset now also removes the legacy layout key, so an old flat layout cannot
  be migrated back on the next read.
- Footer/composer rows: only the actual overflow button counts as the More
  anchor. Menu-opening rows such as the settings gear or model picker are no
  longer mistaken for More, restoring dragging in those scopes.
- The composer scope collects only the slot outlet's own children; host chrome
  such as `ContextMeter` is pinned to the end without marks or drag handling,
  fixing the misalignment above the composer.
- The right scope accepts only guide cards carrying
  `[data-sidebar-right-guide-entry]`; dynamic chrome is ignored, and
  better-sidebar's settings entry is pinned so its recovery path stays intact.
- Harness now has 45 assertions covering region reset, composer tails, right
  chrome, better-sidebar pinning, and menu-trigger rows.

## 0.5.1 — 2026-11-02

- 修正六区域拖拽落点：快照按屏幕上的**视觉顺序**排序，不再按宿主 DOM 顺序。
  在已经自定义排序后，拖到两行之间会准确插到指针位置，而不是被注册顺序带偏。
- 拖影净化：克隆体移除宿主的 `style`、`aria-current`、`data-dso-*` 状态，
  并以被拖动行自身的矩形定位，修复真实 DSH 中拖影错位/重影的观感。
- 左侧边栏只从 `[data-slot="sidebar.panellist"]` 所在的按钮定位面板列表，
  只收列表的直接子行，避免把工作区/会话导航误标成可拖动行。
- 「更多」收纳高亮改挂在真正的按钮上，虚线轮廓贴合按钮圆角；外扩热区仍保持 0。
- harness 增加视觉顺序落点、侧栏隔离、拖影净化和视觉顺序回归断言。

### English

- Fixed drop indexing in all six scopes: the drag snapshot is sorted by on-screen
  visual order, not host DOM order, so drops land between the rows the user sees
  even after a custom order has been applied.
- Sanitized the drag ghost (host `style`, `aria-current`, `data-dso-*` marks) and
  positioned it from the dragged row's own rect, fixing misaligned/duplicated
  ghosts in the real DSH UI.
- The sidebar scope now anchors on the button containing
  `[data-slot="sidebar.panellist"]` and only collects direct child rows, so
  workspace/session navigation can never be tagged as draggable panels.
- The More tuck highlight is applied to the actual button, so its dashed outline
  follows the button's rounded corners; the drop hot zone still has zero padding.
- Harness coverage for visual-order drops, sidebar isolation, ghost sanitizing,
  and the visual-order regression.

## 0.5.0 — 2026-11-02

- 整理范围从左侧边栏扩展到六处：左侧边栏、侧栏底部、对话标签、输入框工具条、
  右侧栏「开始」页、设置导航。每处独立排序、独立收纳；横向区域显示竖线、纵向
  区域显示横线，长按手势与键盘排序共用一套运行时。
- 三处「更多」菜单分别只列本区域收纳项：侧栏底部与左侧边栏共用左侧菜单，
  对话标签与输入框工具条共用对话区菜单，右侧栏使用自己的「更多工具」。
  菜单项点击由运行时定位原按钮并触发，不再依赖宿主 `onOpen` 的 id 语义。
- 新增配置界面：DSH 设置 →「布局整理」，以及本插件详情页。六张位置卡片支持
  HTML5 拖拽、上移/下移、收起/恢复、恢复本组；本插件设置入口固定不可收起。
- 存储升级为 v3 `{version:3, scopes:{…}}`；旧 v2 平面布局与
  `dsh.modmenu.layout.v1` 自动迁移到 `sidebar` 区域。旧控制台 `hide(id)` /
  `reveal(id)` 仍按 `sidebar` 语义兼容。
- 安全设计更新：被整理的插槽保持只读；三处「更多」、设置页、插件详情页各只做
  一次固定注册；继续使用 DOM `order` / `display`、rAF 合并、90 次/3 秒看门狗、
  仅观察 `childList`。
- 离线 harness 扩展为六区域夹具，覆盖 v2→v3 迁移、`resetScope()`、区域菜单清单、
  设置页固定项、菜单内拖动与 `dispose()` 还原。

### English

- The organizer now covers six locations: left sidebar, sidebar footer,
  conversation tabs, composer dock, right sidebar "Start" page, and settings
  navigation. Each scope keeps its own order and tucked set; horizontal scopes
  show a vertical drop line and vertical scopes a horizontal one, sharing the
  same long-press and keyboard runtime.
- Each of the three More menus lists only its own tucked items: sidebar footer
  shares the left sidebar menu, tabs and composer share the conversation menu,
  and the right sidebar uses its own "More tools". Menu items are activated by
  the runtime locating the original button, not by host `onOpen` id semantics.
- New settings UI: DSH Settings → "Layout organizer", plus this plugin's detail
  page. Six location cards support native HTML5 drag, up/down, tuck/restore, and
  reset-section. The plugin's own settings entry is pinned.
- Storage is now v3 `{version:3, scopes:{…}}`; the old v2 flat layout and
  `dsh.modmenu.layout.v1` migrate into `sidebar`. Console `hide(id)` /
  `reveal(id)` keep their old `sidebar` semantics.
- Safety updated: organized slots remain read-only; the three More menus,
  settings page, and plugin-detail page each get one fixed registration; DOM
  `order`/`display`, rAF coalescing, the 90-per-3s watchdog, and `childList`-only
  observation remain.
- The offline harness now uses six-scope fixtures and covers v2→v3 migration,
  `resetScope()`, per-region menu lists, the pinned settings row, in-menu drag,
  and `dispose()` restoration.

## 0.4.3 — 2026-11-02

- 修正收纳动画的「悬停」反馈：此前只有「更多」按钮里的图标缩放，右侧文字不动，
  看起来像图标单独塌陷。现在整个按钮（图标 + 文字）作为一体缩放，与松手时的
  缩放节奏一致；`prefers-reduced-motion` 下不缩放。

### English

- Fixed the armed-state feedback on the “More” anchor: previously only the glyph
  shrank while the label stayed put, which read as a broken dip. The whole button
  (icon and label) now scales together, matching the release animation; scaling is
  disabled under `prefers-reduced-motion`.

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
