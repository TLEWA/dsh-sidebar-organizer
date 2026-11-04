# Changelog

版本格式遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。
本文件的中文条目为默认语言；英文条目见英文段落（同一版本内）。

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
