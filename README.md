# dsh-sidebar-organizer

**简体中文** · [English](README.en.md)

给 DSH（DeepSeek Harness）里六处会重复出现的按钮/卡片加上**自定义排序**与**收纳**能力：左侧边栏、侧栏底部、对话标签、输入框工具条、右侧栏、设置导航。

> 当前版本 **0.6.0**（正式版）：六区域整理、收纳与配置导入/导出；不包含右键菜单或无障碍增强（计划 0.7.0）。

## 现在能做什么

整理范围覆盖六处位置：

| 位置 | 内容 | 拖动方向 |
| --- | --- | --- |
| 左侧边栏 | 插件、市场、技能管理、定时任务…… | 上下 |
| 侧栏底部 | 反馈、设置等底部入口 | 左右 |
| 对话标签 | 对话、轨迹等标签 | 左右 |
| 输入框工具条 | 统计、上下文、活动、用量等 | 左右 |
| 右侧栏「开始」页 | 文件、浏览器、终端、「更多工具」 | 上下 |
| 设置导航 | 账户、通用、模型、插件…… | 上下 |

- **长按拖动排序**：按住目标约 0.26 秒，行/卡片浮起（跟随指针的 ghost + 落点指示线），拖到目标位置松手。横向区域显示竖线，纵向区域显示横线。顺序即时生效并保存。
- **收进对应「更多」**：把行拖到本区域的「更多」按钮上松手，即从原位消失，收进该区域「更多」菜单的「已收纳」分组。侧栏底部与左侧边栏共用左侧「更多」；对话标签与输入框工具条共用对话区「更多」；右侧栏使用自己的「更多工具」。设置导航的「更多」由本插件在出现收纳项时补上：第一项需在配置页收起，之后导航底部会出现「更多」，可继续把其他设置行拖进去，也可以点击其中条目直接打开对应设置。
- **从「更多」拖回来**：打开对应菜单，长按被收纳项并拖回该区域的目标位置松手；拖动时源行会隐藏，只留下浮动预览，避免预览框与原行重叠。
- **菜单内排序**：在「已收纳」分组里长按拖动，调整被收纳项之间的顺序。
- **键盘排序**：聚焦某行后 `Alt+↑` / `Alt+↓`（横向区域同样按顺序移动）。
- **配置页**：DSH 设置 →「布局整理」，或本插件的详情页。六张位置卡片，可拖动整行、上移/下移、收起/恢复、恢复本组；每张卡片有独立的「拖动」开关，关闭后该区域不再响应长按拖动（布局和收纳保持不变）。本插件自己的设置入口可以拖动排序但不能收起；better-sidebar 的设置入口完全固定，既不能拖动也不能收起。
- **导入 / 导出配置**：配置页标题栏的「导出配置」把六区域的排序、收纳状态和拖动开关写成 JSON 文件；「导入配置」读取同格式文件并整体替换当前配置。版本不兼容或文件损坏时整份拒绝，不会只应用一半。
- **按区域恢复**：每处「更多」菜单的「恢复默认排序」只恢复该区域（左侧边栏、对话区或右侧栏），恢复时已收纳的行会立即展开；「恢复默认排序」不会改动各区域的拖动开关。
- 刷新页面、重启 DSH 后布局保持。
- 拖动过程中，指针下方的行不会触发 `:hover` 或 tooltip（拖动期间临时 `pointer-events: none`，命中判定全部走几何矩形）。
- **没有**右键菜单、悬浮启动器、快捷键、搜索或分组——这些不在本版本范围内。

## 安装

### 从 GitHub Release 安装（推荐）

打开 [Releases](https://github.com/TLEWA/dsh-sidebar-organizer/releases/latest)，在最新发布里复制
`dsh-sidebar-organizer-<版本>.tgz` 的链接，粘贴到 DSH 的「插件」页 →「添加插件」；
也可以下载后选择本地文件。发布页同时提供 `SHA256SUMS` 便于校验。

每个 `v*` 标签由 GitHub Actions 自动构建并附加到 Release。

也可以直接粘贴 Git 地址（使用仓库里已构建好的 `lib/`，无需在本机构建）：

```
git+https://github.com/TLEWA/dsh-sidebar-organizer.git#v0.6.0
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
   window.__dshSidebarOrganizer.status();                   // 查看六区域状态
   ```

   `hide(id)` / `reveal(id)` 只传一个参数时仍按旧版语义作用于 `sidebar`。
   `disable()` 之后要恢复，执行
   `localStorage.removeItem("dsh.sidebar-organizer.disabled")` 再刷新。
8. 就算本插件完全不工作，六处位置也只是保持 DSH 默认顺序，不会有其他副作用。

## 实现说明

- 六个区域的定义、行/卡片发现与 id 映射都在 `src/scopes.js`：
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
  并为六个区域标记一次性修复已完成，避免旧版尾行修复改写导入的顺序。
- 拖拽层：document 捕获阶段 `pointerdown` → 260ms 长按计时（指针移动超过 8px 取消）→
  激活后克隆行做 ghost、按区域轴向插入落点指示线；落点按其余行的中点判定；拖到本区域
  「更多」按钮矩形内即收纳；松手后 500ms 内吞掉紧随的 click，避免误触打开。
- 配置页用原生 HTML5 拖拽（`draggable` + `dragstart/dragover/drop`），不引入额外交互库；
  按钮只做上移/下移/收起/恢复，避免和页面长按手势冲突。

## 目录结构

```
src/                 源码（模块化，按依赖顺序拼接）
  constants.js       常量、文案、共享句柄
  styles.js          注入的样式表（拖动 + 配置页）
  storage.js         localStorage 布局持久化与 v2/v3 迁移
  icons.js           图标 SVG 序列化与 id 前缀处理
  slot.js            只读访问插槽投影
  scopes.js          六区域发现、id 映射、轴向
  runtime.js         DOM 运行时：应用顺序、收纳、拖拽手势、菜单数据
  menu.js            三处「更多」菜单里的收纳行
  settings.js        设置页 / 插件详情页配置界面
  plugin.js          插件入口 apply()
scripts/build.mjs    把 src/ 拼成 lib/client.js
lib/client.js        构建产物（DSH 实际加载的客户端半）
lib/index.js         宿主半（占位）
cordis.patch.yml     bundle 补丁（安装时插入 profile）
test/harness.html    离线夹具：伪造六区域 DOM 与插槽数据，浏览器打开即回归
```

DSH 的客户端插件是以经典脚本方式通过 `window.__ModuleLoader__.load({ id, factory })`
加载的，不是 ES 模块，因此运行时无法 `import`；源码模块化 + 构建期拼接是这个约束下的折中。

## 开发

```bash
npm run build   # src/ → lib/client.js
npm run check   # 语法检查
```

回归测试不碰真实 UI：用浏览器打开 `test/harness.html`，页面会自检并打印六区域发现、
顺序、持久化、v2→v3 迁移、`resetScope()`、收纳 / 恢复、区域菜单清单、设置页固定项、
菜单内拖动、拖动途中 DOM 替换与滚动、配置导出 / 导入与版本拒绝、`dispose()` 还原的结果。

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 `0.2.1-rc.5` 上开发）。
- 客户端只 `require("react")`；`@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton`
  存在时优先使用，缺失时降级为内置按钮样式。
- 插槽/属性选择器缺失时对应区域自动降级为空，不影响 DSH 启动。

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
- [ ] 0.7.0 — 无障碍补强（配置页屏幕阅读器朗读顺序变化、菜单内上移/下移按钮）

## 声明与引用

- 第三方代码与商标说明：[NOTICE.md](NOTICE.md)
- AI 参与方式、代码来源与引用方式：见 [NOTICE.md](NOTICE.md) 的「AI 使用与代码来源声明」一节
- 引用本项目的 BibTeX：[CITATION.cff](CITATION.cff)

## 许可

[MIT](LICENSE)
