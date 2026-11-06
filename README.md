# dsh-sidebar-organizer

**简体中文** · [English](README.en.md)

给 DSH（DeepSeek Harness）里七处会重复出现的按钮/卡片加上**自定义排序**与**收纳**能力：左侧边栏、侧栏底部、对话标签、输入框工具条、会话头部工具条、右侧栏、设置导航。

> 最新版要点：桌面端窗口与浏览器里的 Web 界面共用同一份布局（配置页可关闭），七区域整理、收纳与配置导入/导出齐全；0.8.1 起还能整理会话栏 / 工作区栏的右键菜单并增删其中的分隔线（DSH 0.2.2+），0.8.2 修好了它在菜单保持打开时增删分隔线、刷新后不记忆的问题，0.8.3 修好了“重置后删一条分隔线、刷新即乱序”的顺序落库问题，0.8.4 让菜单底部与插件直挂按钮也能增删分隔线，0.9.0 起还能把条目收进菜单底部的「··· 更多 ›」二级菜单，0.9.1 把这一行压到整张菜单的最末端、并让菜单最下面那几项（含插件直挂按钮）也能拖动排序与收纳，0.9.4 修好了长按二级菜单误拖一级行、收纳项没有图标、从「更多」拖回后隐形，以及分隔线按 DOM 顺序落位导致的错行。完整版本历史与各版本下载见 [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases)。

## 现在能做什么

整理范围覆盖七处位置：

| 位置 | 内容 | 拖动方向 |
| --- | --- | --- |
| 左侧边栏 | 插件、市场、技能管理、定时任务…… | 上下 |
| 侧栏底部 | 反馈、设置等底部入口 | 左右 |
| 对话标签 | 对话、轨迹等标签 | 左右 |
| 输入框工具条 | 统计、上下文、活动、用量等 | 左右 |
| 会话头部工具条 | 提醒、底部面板、上下文诊断、查找等图标 | 左右 |
| 右侧栏「开始」页 | 文件、浏览器、终端、「更多工具」 | 上下 |
| 设置导航 | 账户、通用、模型、插件…… | 上下 |

- **长按拖动排序**：按住目标约 0.26 秒，行/卡片浮起（跟随指针的 ghost + 落点指示线），拖到目标位置松手。横向区域显示竖线，纵向区域显示横线。顺序即时生效并保存。
- **收进对应「更多」**：把行拖到本区域的「更多」按钮上松手，即从原位消失，收进该区域「更多」菜单的「已收纳」分组。侧栏底部与左侧边栏共用左侧「更多」；对话标签与输入框工具条共用对话区「更多」；右侧栏使用自己的「更多工具」；会话头部工具条收进官方那个「更多操作」菜单（下载 Session 日志 / 反馈所在的那个），被收纳的图标直接排在该菜单原生两项上方；那个「...」按钮本身是宿主控件，不参与排序也不可收纳，同一条带里的分屏组合控件（文件资源管理器 / 更多打开方式）同样保持整体。设置导航的「更多」由本插件在出现收纳项时补上：第一项需在配置页收起，之后导航底部会出现「更多」，可继续把其他设置行拖进去，也可以点击其中条目直接打开对应设置。
- **从「更多」拖回来**：打开对应菜单，长按被收纳项并拖回该区域的目标位置松手；拖动时源行会隐藏，只留下浮动预览，避免预览框与原行重叠。
- **菜单内排序**：在「已收纳」分组里长按拖动，调整被收纳项之间的顺序。
- **把官方菜单项拖成按钮**：会话头部工具条里，把「更多操作」菜单自带的「下载 Session 日志」「反馈」拖到条带上，会生成同名图标按钮，点击等同于点该菜单项；把按钮拖回「更多操作」即撤下。
- **键盘排序**：聚焦某行后 `Alt+↑` / `Alt+↓`（横向区域同样按顺序移动）。
- **拖动热键**：默认不绑定。配置页的「拖动热键」可录制一组键盘组合（支持 Ctrl/Alt/Shift/Win）；随后可单独或同时开启「长按」「开关」两种放行方式。「长按」只在按住热键时允许拖动，松开立即中止；「开关」按一下开启拖动、再按一下关闭。热键只在输入框/文本域之外生效，打字不会误触发；未绑定或两种模式都关闭时，拖动行为与旧版一致。
- **右键菜单排序与分隔线**（DSH 0.2.2+）：会话行、工作区行弹出的右键菜单里，长按条目即可拖动排序；菜单打开时右键某个非底部条目，会在它下方增删一条分隔线（再右键一次取消）。分隔线按位置保存，条目移动时它不跟着走；落到菜单最下方会自动删除。把条目拖到列表最底部，会出现一行 `··· 更多 ›`，松手在这里就把它收进该行的二级菜单（悬停展开，点击等同点原菜单项）；长按二级菜单里的条目可以拖回菜单任意位置。这一行永远在整张菜单的最末端——`归档会话` 与插件追加的按钮之下；菜单底部动作和插件直挂按钮本身也都能长按拖动、一起排序。菜单里只剩一个可见条目时不再允许收纳。设置页有独立的「右键菜单」开关，0.2.1 上该功能自动关闭、卡片也不显示。
- **配置页**：DSH 设置 →「布局整理」，或本插件的详情页。七张位置卡片，可拖动整行、上移/下移、收起/恢复、恢复本组；每张卡片有独立的「拖动」开关，关闭后该区域不再响应长按拖动（布局和收纳保持不变）。本插件自己的设置入口可以拖动排序但不能收起；better-sidebar 的设置入口完全固定，既不能拖动也不能收起。
- **导入 / 导出配置**：配置页标题栏的「导出配置」把七区域的排序、收纳状态和拖动开关写成 JSON 文件；「导入配置」读取同格式文件并整体替换当前配置。版本不兼容或文件损坏时整份拒绝，不会只应用一半。
- **跨窗口共用布局**：桌面端窗口与浏览器打开的 Web 界面（`http://127.0.0.1:<端口>`）共用同一份顺序，重启 DSH、换端口都不受影响；配置页顶部的「跨窗口共用布局」开关可关闭，关掉后各窗口只用自己的本地布局。
- **按区域恢复**：每处「更多」菜单的「恢复默认排序」只恢复该区域，恢复时已收纳的行会立即展开；「恢复默认排序」不会改动各区域的拖动开关。
- 刷新页面、重启 DSH 后布局保持。
- 拖动过程中，指针下方的行不会触发 `:hover` 或 tooltip（拖动期间临时 `pointer-events: none`，命中判定全部走几何矩形）。
- **没有**自己的右键菜单、悬浮启动器、搜索或分组——本版本只是在宿主已有的会话 / 工作区右键菜单里做排序与分隔线，不新增菜单入口；「拖动热键」只负责放行拖动，不是命令快捷键。

## 安装

### 从 GitHub Release 安装（推荐）

打开 [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases/latest)，在最新发布里复制
`dsh-sidebar-organizer-<版本>.tgz` 的链接，粘贴到 DSH 的「插件」页 →「添加插件」；
也可以下载后选择本地文件。发布页同时提供 `SHA256SUMS` 便于校验。

每个 `v*` 标签由 GitHub Actions 自动构建并附加到 Release。

也可以直接粘贴 Git 地址（使用仓库里已构建好的 `lib/`，无需在本机构建）：

```
git+https://github.com/TLEWA/dsh-sidebar-organizer.git#v0.8.4
```

### 从 npm 安装

```bash
dsh plugin install dsh-sidebar-organizer
```

或在 DSH 的插件管理器里搜索 `dsh-sidebar-organizer`。

### 从源码安装

本仓库本身就是一个 DSH 插件包（bundle）。克隆后，用插件管理器指向仓库目录安装：

```
plugin_manager  action: install_bundle  target: <仓库的绝对路径>
```

安装后刷新 Web 界面（`Ctrl+R`）。以 `link:` 方式装进 profile 时，改 `src/` 并执行 `npm run build` 后刷新页面即可生效，不必重装。

> 0.3.6 及更早版本名为 `dsh-modmenu`。改名后旧的布局存储键
> `dsh.modmenu.layout.v1` 会自动迁移到 `dsh.sidebar-organizer.layout.v1`，
> 控制台句柄 `window.__dshModmenu` 也保留为 `window.__dshSidebarOrganizer` 的别名。

## 安全设计

0.1.0 曾在每次插槽变更通知里重新注册整列面板，形成
`注册 → 通知 → 再注册` 的反馈环，把页面拖死。0.2.0 起彻底换掉机制：

1. **被整理的插槽只读**：不注册、不 shadow 任何 `sidebar.panellist`、`sidebar.footer.action`、
   `conversation.view`、`conversation.composer.dock`、`settings.section` 条目；只用
   `entriesOfSlot` 获取 id 与标签。设置导航是例外：本插件会注册自己的「布局整理」设置页，
   该行可以拖动排序，但不能收起。
2. **排序 / 隐藏只写 DOM 内联样式**：按区域给行写 `style.order`，横向容器与纵向容器都适用；
   收纳用 `style.display:none` + `data-dso-hidden`。
3. **固定、幂等的插槽注册**：三处「更多」菜单各注册一个静态行 `panel-organizer`；
   `settings.section` 与 `plugins.detail.section` 各注册一次设置页。全部只注册一次，
   不订阅、不重注册。
4. **幂等 + 限流**：每次布局 pass 都是「值不同才写」，并用 `requestAnimationFrame`
   合并到每帧最多一次。
5. **看门狗**：3 秒内超过 90 次 pass 即判定异常并停止观察与监听。
6. **只观察 `childList`**：自身写入的 `style` / `data-*` 不会反过来触发观察器。
7. **逃生开关**（浏览器控制台）：

   ```js
   window.__dshSidebarOrganizer.reset();                    // 忘掉全部布局
   window.__dshSidebarOrganizer.resetScope("footer");       // 只恢复某一区域
   window.__dshSidebarOrganizer.hide("footer", "feedback"); // 手动收起
   window.__dshSidebarOrganizer.reveal("footer", "feedback");// 手动恢复
   window.__dshSidebarOrganizer.setDragEnabled("footer", false); // 关闭某区域拖动
   window.__dshSidebarOrganizer.disable();                  // 置开关并停用，刷新后也不启动
   window.__dshSidebarOrganizer.status();                   // 查看七区域状态
   ```

   `hide(id)` / `reveal(id)` 只传一个参数时仍按旧版语义作用于 `sidebar`。
   `disable()` 之后要恢复，执行
   `localStorage.removeItem("dsh.sidebar-organizer.disabled")` 再刷新。
8. **宿主侧同步只走本机**：宿主半用 `connection.fetch.register` 注册一条
   `GET/POST /api/dsh-sidebar-organizer/layout` 路由，只接受本机 `owner` 身份的请求
   （webServer 侧按会话 cookie 判定，非 owner 直接 403），不发出任何外部网络请求；
   数据只写 `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json` 一个文件，写入用
   临时文件 + `rename` 原子替换，失败时客户端退回本地 `localStorage`。
9. 就算本插件完全不工作，七处位置也只是保持 DSH 默认顺序，不会有其他副作用。

## 实现说明

- 七个区域的定义、行/卡片发现与 id 映射都在 `src/scopes.js`：
  - 左侧边栏按 `button[aria-label]` 与 `sidebar.panellist` 投影标签配对；
  - 侧栏底部、输入框工具条读取 `[data-slot="…"]` 的直接子元素；
  - 对话标签读取 `[data-conversation-tabs]` 的直接 tab，并识别旁边的「更多」；
  - 右侧栏读取 `[data-sidebar-right-guide]` 的直接卡片，按 `data-sidebar-right-guide-entry` 区分；
  - 设置导航读取 `[data-shortcut-modal="settings"] nav` 中按钮最多的容器。
- 找不到对应容器或行时该区域直接跳过，不影响其他区域。
- 保存的布局（v3）：

  ```json
  {
    "version": 3,
    "scopes": {
      "sidebar": { "order": ["plugins", "…"], "hidden": ["tasks"] },
      "footer": { "order": ["feedback"], "hidden": [] }
    }
  }
  ```

  v2 的 `{version:2, order, hidden}` 与更早的 `dsh.modmenu.layout.v1` 会自动迁移到
  `sidebar` 区域；其余区域首次使用时按 DOM 默认顺序登记。宿主或新插件后来插入的
  行会按它当前的 DOM 邻居插入，不会一律追加到末尾。
- 各区域的拖动开关保存在单独的 `dsh.sidebar-organizer.drag.v1`
  （`{ "sidebar": true, "footer": false, … }`），与布局互不影响。
- 导出文件是 `{ format, version, exportedAt, scopes, drag }` 的快照；导入只接受
  `version === 3` 且含 `scopes` 对象的文件，写入前会走与本地存储相同的规范化，
  并为七个区域标记一次性修复已完成，避免旧版尾行修复改写导入的顺序。
- 跨窗口同步（0.7.2 起）：`src/sync.js` 把布局推给宿主半的路由
  `POST/GET api/dsh-sidebar-organizer/layout`，宿主存在
  `$DSH_HOME/storages/dsh-sidebar-organizer/layout.json`。合并按时间戳新者优先：
  本地写完后 350ms 去抖上传，窗口重新可见 / 获得焦点时拉取；拉取到的布局会立即应用
  到当前页面并标记各区域已修复，但不会再回传一次。宿主没有存档时，新窗口保留本地
  顺序，避免空布局覆盖已有配置；`localStorage` 仍是本地缓存与降级路径。
  上传只由用户操作触发：启动时的默认顺序登记与投影 pass 写回都只留在本地，
  `dsh.sidebar-organizer.customized.v1` 记录「这个 origin 真正被调整过」；升级前就在
  本地、且与宿主注册顺序不同的布局会被认作手工配置，首次启动时接管宿主存档。
- 关掉共用：设置页顶部有「跨窗口共用布局」开关（`dsh.sidebar-organizer.cross-window.v1`，
  默认开）。关掉后本窗口不再上传或拉取宿主存档，只用自己的 `localStorage`，等同于 0.7.1
  的行为；重新打开会立即拉取宿主那份，宿主没有存档时保留本地布局。
- 拖拽层：document 捕获阶段 `pointerdown` → 260ms 长按计时（指针移动超过 8px 取消）→
  激活后克隆行做 ghost、按区域轴向插入落点指示线；落点按其余行的中点判定；拖到本区域
  「更多」按钮矩形内即收纳；松手后 500ms 内吞掉紧随的 click，避免误触打开。
- 右键菜单（0.8.1 起，仅 DSH 0.2.2+）：宿主把会话 / 工作区的右键菜单渲染成共享的
  `[role="menu"][data-context-menu]`，主体条目在 `_viewport_` 里、`归档会话` 在 `_footer_` 里、
  插件追加的按钮直接挂在门户根节点上。插件在 document 捕获阶段记录打开菜单的是哪一行，
  菜单出现后给每个菜单项写入 `style.order`（拖动重排）并按位置注入分隔线：为躲开宿主
  「首条 / 相邻分隔线隐藏」的 CSS，注入线写内联 `display:block`；条目一律写 `order = 2i`，
  分隔线写 `order = 2g - 1`，二者交替就不会挤在同一位置。菜单是临时门户，关闭 / 重渲染后按
  `MutationObserver` 重新同步。顺序与分隔线存在 `dsh.sidebar-organizer.context-menu.v1`
  （`{ version, enabled, menus: { session, workspace } }`，每个菜单各自一份 `order` /
  `dividers` / `hidden` / `customized`），与七区域布局、拖动开关、跨窗口布局同步都互不影响；
  分隔线只记间隙下标，所以条目拖动时它留在原地，末尾下标（`gap >= 行数`）在落库前被剪掉。
- 右键菜单的跨块排序（0.9.1）：宿主把 `归档会话` 放在 `_footer_`、把插件按钮挂在门户根节点，
  单靠 `style.order` 无法跨容器排序。首次定制时插件把 `_viewport_` 与 `_footer_` 的 inline
  `display` 改为 `contents`（记在 `state.contextShell`），于是所有行都成了菜单这个 flex 容器的
  直接子级，可以一起编号；未定制 / 重置时原样写回宿主的值。
- 右键菜单的「更多」（0.9.0）：拖动期间补一个自己的锚点行，挂在**菜单根节点**
  （`div[data-dso-ctx-more]` 里放一个 `role=menuitem` 的按钮，不进 `model.rows`、不打
  `data-dso-ctx-id`、`order = 9999`），因此永远排在 `_viewport_` / `_footer_` / 插件按钮之后，
  是整张菜单的最后一行。被收纳的 id 记在 `hidden` 里、行写 `display:none`，可见行按可见
  序号编号 `order`，因此分隔线间隙仍指向「看得见的行」；注入的分隔线也随之挂在菜单根节点。
  松手落在锚点上即收纳（只剩一个可见条目时拒绝）；锚点悬停展开 body 级
  `div[data-dso-ctx-panel]`，位置算法是「优先菜单右侧 + 6px；右侧放不下且左侧更宽
  则翻左；纵向夹在视口内」，条目点击直接调用原菜单项的 `click()`。二级菜单里的行带
  `data-dso-ctx-more-key`，长按即用拖拽层的 `more` 源把行拖回菜单（落点写回顺序并从
  `hidden` 移除）。拖拽命中用菜单的实时矩形，不依赖打开时冻结的快照。
- 右键菜单的细节修正（0.9.4）：宿主把子菜单渲染在行按钮内部（面板是按钮的兄弟），所以
  按压先用 `role=menuitem` 判断按下的是行自己的按钮还是子菜单，后者的手势交还宿主；收纳面板
  整块克隆 `[data-slot="contextMenu.icon"]`（`img` 与 `svg` 同样处理，14×14，缺图标留占位）；
  面板与行直接采用宿主的菜单材质与菜单项规格（`--dsw-menu-surface-fill` + `backdrop-filter`、
  圆角 16、padding 4、行 34px / 6px 8px / gap 6 / 13px 20px），与 dsh-sidebar-row-menu 一致。
  从面板拖回时行的原始 `display` 取自 `state.contextStyled`，不能用 `rememberContextElement` 的
  返回值（对已记录元素返回 null，会把 `none` 当成原始值）。分隔线的 gap 与重排基准统一从
  `layout.order`（剔除 `hidden`）解析，即「绘制顺序的可见行下标」，用 DOM 顺序会在拖动过菜单后错行。
- 扁平化的代价与补偿（0.9.2 / 0.9.3）：`display: contents` 的元素不生成盒，宿主挂在
  `_viewport_` / `_footer_` 上的开合动画（纯 opacity）因此不绘制。宿主的做法是：把
  `--dsh-menu-enter: 40ms` / `--dsh-menu-dismiss: 80ms` 写在菜单 surface 上，用
  `data-menu-phase`（enter / dismiss / replace）切换阶段，动画只作用在 surface 的**直接子节点**。
  插件因此也只看这个属性：MutationObserver（`attributeFilter`）在阶段翻转的同一帧里，把宿主
  发布的时长抄到菜单的 `--dso-ctx-out-duration` / `--dso-ctx-in-duration`，并给被扁平化的
  行 / 分隔线 / 锚点 / 二级面板打上 `dso-ctx-mirror-out` / `dso-ctx-mirror-in`，跑等价的
  opacity 关键帧（缓动与宿主一致：出 ease-in、入 ease-out）。宿主仍在动画的直接子节点会跳过，
  避免压掉它的入场动画、也避免「类一移除宿主动画重播 → 再请求重加类」的 260ms 闪烁环。
  全程不读 `getComputedStyle`：菜单刚挂载时逐个读计算样式会触发整页强制样式重算，实测把
  一次同步从 1.7ms 拖到 12.3ms（0.9.3 改读 CSS 变量后回到 1.7ms，其中镜像段 10.7ms → 0.2ms）。
- 配置页用原生 HTML5 拖拽（`draggable` + `dragstart/dragover/drop`），不引入额外交互库；
  按钮只做上移/下移/收起/恢复，避免和页面长按手势冲突。

## 目录结构

```
src/                 源码（模块化，按依赖顺序拼接）
  constants.js       常量、文案、共享句柄
  styles.js          注入的样式表（拖动 + 配置页）
  storage.js         localStorage 布局持久化与 v2/v3 迁移
  sync.js            宿主侧同步：拉取 / 去抖上传 / 采纳远端布局
  icons.js           图标 SVG 序列化与 id 前缀处理
  slot.js            只读访问插槽投影
  scopes.js          七区域发现、id 映射、轴向
  runtime.js         DOM 运行时：应用顺序、收纳、拖拽手势、菜单数据
  menu.js            三处「更多」菜单里的收纳行
  settings.js        设置页 / 插件详情页配置界面
  plugin.js          插件入口 apply()
scripts/build.mjs    把 src/ 拼成 lib/client.js
lib/client.js        构建产物（DSH 实际加载的客户端半）
lib/index.js         宿主半（GET/POST 布局路由 + $DSH_HOME/storages 下的 JSON 存档）
cordis.patch.yml     bundle 补丁（安装时插入 profile）
test/harness.html    离线夹具：伪造七区域 DOM 与插槽数据，浏览器打开即回归
```

DSH 的客户端插件是以经典脚本方式通过 `window.__ModuleLoader__.load({ id, factory })`
加载的，不是 ES 模块，因此运行时无法 `import`；源码模块化 + 构建期拼接是这个约束下的折中。

## 开发

```bash
npm run build   # src/ → lib/client.js
npm run check   # 语法检查
```

回归测试不碰真实 UI：用浏览器打开 `test/harness.html`，页面会自检并打印七区域发现、
顺序、持久化、v2→v3 迁移、`resetScope()`、收纳 / 恢复、区域菜单清单、设置页固定项、
菜单内拖动、拖动途中 DOM 替换与滚动、配置导出 / 导入与版本拒绝、`dispose()` 还原的结果。

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 `0.2.1-rc.5` 上开发，并对照 `0.2.2-rc.1` 的组件源码与
  0.2.2 结构夹具验证）。
- 0.2.2 的会话头部「更多操作」新增了「复制会话为 Markdown」。已拉出的下载/反馈快捷
  按钮按动作内容（标签 + 图标）识别并自动迁移，不再按菜单里的位置编号，因此宿主插入
  新行也不会点错动作。
- 0.2.2 在窄浏览器窗口把设置导航改成横排，插件会读取实际排布方向，拖拽轴随之切换。
- 会话 / 工作区右键菜单的排序与分隔线只在 0.2.2 及以上出现（0.2.2 起宿主才把这两处
  菜单接到共享的上下文菜单上）；0.2.1 上自动关闭，设置页不显示这张卡片。
- 客户端只 `require("react")`；`@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton`
  存在时优先使用，缺失时降级为内置按钮样式。
- 插槽/属性选择器缺失时对应区域自动降级为空，不影响 DSH 启动。
- 跨窗口同步需要宿主半能在 `connection.fetch.register` 上注册路由（0.2.1-rc.5 与
  0.2.2-rc.1 均具备）；该服务缺失时客户端只跑本地 `localStorage`，不会报错。

## 路线图

- [x] 0.2.0 — 只读 + DOM `order` 的最小可行版本
- [x] 0.3.0 — 「更多」收纳、键盘排序、拖动期抑制 `:hover`
- [x] 0.4.0 — 源码模块化与构建脚本、多语言文档、AI 使用与代码来源声明
- [x] 0.4.3 — 悬停反馈改为按钮整体缩放（图标与文字一起）
- [x] 0.5.0 — 六区域可拖动/收纳；设置页与插件详情页配置界面；v3 存储与迁移
- [x] 0.5.1 — 修正六区域拖拽落点按视觉顺序计算、拖影净化、「更多」高亮贴合圆角
- [x] 0.5.2 — 按区域恢复并展开收纳项、footer/composer 行识别、composer/右侧栏宿主 chrome 隔离、better-sidebar 设置入口固定
- [x] 0.5.3 — 收纳动画回滚到 0.4.x、More 虚线框贴合圆角、横向插入线居中
- [x] 0.5.4 — 菜单拖动隐藏源行、六区域独立拖动开关、右侧栏新入口保持宿主位置
- [x] 0.5.5 — 修复旧布局中右侧栏新入口仍被追加到末尾、横向插入线贴住最后一项、短按缩放
- [x] 0.5.6 — 修复右侧栏起始页指南针与第一张卡之间的空白（宿主 `::after` 占位被 `order` 挤到前面）
- [x] 0.5.7 — 修复窄宽度下已收纳视图泄漏、设置导航可拖动与「更多」入口、拖入「更多」误点击
- [x] 0.6.0 — 首个正式版：六区域整理、设置页、配置导入/导出、刷新后自定义顺序保持
- [x] 0.6.1 — 修复已收纳条目的拖影丢失圆角
- [x] 0.7.0 — 新增会话头部工具条：图标排序、收进官方「更多操作」菜单与拖回；修正陈旧布局条目导致的落点偏移与拖影白边
- [x] 0.7.1 — 修复「更多操作」菜单内排序不生效与重排后菜单关闭、纯图标行拖影黑底
- [x] 0.7.2 — 布局改为宿主侧存档：桌面窗口与浏览器 Web 界面（任意端口）共用同一份顺序；配置页可关闭共用
- [x] 0.7.3 — 仅文档：安装示例与路线图更新
- [x] 0.7.4 — 适配 DSH 0.2.2-rc.1：会话头部快捷动作改为内容稳定的 id 并自动迁移；窄屏设置导航按实际方向切换拖拽轴
- [x] 0.7.5 — 设置页导航改用自定义拖拽面板图标（DSH 0.2.2+，低版本自动回退宿主默认图标）
- [x] 0.8.0 — 拖动热键：默认不绑定，支持长按/开关两种放行模式并分别开关
- [x] 0.8.1 — 会话 / 工作区右键菜单可拖动排序、可右键增删分隔线（DSH 0.2.2+，0.2.1 自动关闭）
- [x] 0.8.2 — 修复分隔线在菜单已打开时的增删与位置漂移、行标签漂移，以及“刷新后不记忆”
- [x] 0.8.3 — 首次定制按文档顺序保存（插件行晚挂载量到 0px 时不再写坏顺序），挂载期不回写剪裁
- [x] 0.8.4 — 菜单底部动作与插件直挂按钮参与分隔线间隙计算（只有最后一个动作是空操作）
- [x] 0.9.0 — 右键菜单「更多」收纳：拖到底部收进 `··· 更多 ›` 二级菜单，长按可拖回原位
- [x] 0.9.1 — 「更多」固定在整张菜单最末端，菜单底部动作与插件直挂按钮也能拖动排序、收进「更多」
- [x] 0.9.2 — 恢复菜单关闭的整张淡出（扁平化后在行上重播宿主的淡出），拖动时「更多」不再缩放抽搐
- [x] 0.9.3 — 打开菜单不再强制样式重算（镜像改读宿主 CSS 变量、按 `data-menu-phase` 驱动），入场淡入恢复不闪，「更多」缩小反馈恢复
- [x] 0.9.4 — 长按二级菜单不再拖动一级行、收纳项恢复图标、拖出「更多」后行不再隐形、面板观感对齐 dsh-sidebar-row-menu、分隔线按绘制顺序落位

## 声明与引用

- 第三方代码与商标说明：[NOTICE.md](NOTICE.md)
- AI 参与方式、代码来源与引用方式：见 [NOTICE.md](NOTICE.md) 的「AI 使用与代码来源声明」一节
- 引用本项目的 BibTeX：[CITATION.cff](CITATION.cff)

## 许可

[MIT](LICENSE)
