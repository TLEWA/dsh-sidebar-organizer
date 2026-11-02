# dsh-sidebar-organizer

**简体中文** · [English](README.en.md)

给 DSH（DeepSeek Harness）左侧栏左上角那块「全局面板」栏——插件、市场、技能管理、定时任务……那一列图标——加上**自定义排序**与**收纳**能力。

> 当前版本 **0.4.1**：修复反复拖动时的排序抖动，并收窄「更多」的投放判定。

## 现在能做什么

- **长按拖动排序**：按住某个面板图标约 0.26 秒，图标浮起（跟随指针的 ghost + 一条落点指示线），上下拖到目标位置松手即可。顺序即时生效并保存。
- **收进「更多」**：把行拖到「更多」按钮上松手，该面板就从面板栏消失，收进「更多」菜单的「已收纳」分组。
- **从「更多」拖回来**：打开「更多」菜单，长按被收纳的面板并拖到左侧面板栏的目标位置松手，即恢复显示。
- **菜单内排序**：在「已收纳」分组里长按拖动，也能调整被收纳面板之间的顺序。
- **键盘排序**：聚焦某行后 `Alt+↑` / `Alt+↓` 上下移动。
- **恢复默认排序**：自定义过布局后，「更多」菜单底部会出现「恢复默认排序」。
- 刷新页面、重启 DSH 后布局保持。
- 拖动过程中，指针下方的行不会触发 `:hover` 或 tooltip（拖动期间行临时 `pointer-events: none`，命中判定全部走几何矩形）。
- 「插件」入口可以参与排序，也可以被收纳；「更多」按钮永远是最后一个。

## 安装

### 从 npm 安装（推荐）

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

1. **面板列表只读**：不注册、不 shadow 任何 `sidebar.panellist` 条目，只读
   `ctx.slots.entriesOfSlot("sidebar.panellist")` 获取面板 `id` 与标签。
2. **排序 / 隐藏只写 DOM 内联样式**：面板列是 `display:flex; flex-direction:column`，
   给每行写 `style.order` 即可改视觉顺序；收纳用 `style.display:none` + `data-dso-hidden`。
3. **唯一一次插槽写入**：往 `sidebar.panellist.actions`（「更多」菜单）注册一个静态行
   `panel-organizer`，用于列出被收纳面板并支持拖回。只注册一次，不订阅、不重注册。
4. **幂等 + 限流**：每次布局 pass 都是「值不同才写」，并用 `requestAnimationFrame` 合并到每帧最多一次。
5. **看门狗**：3 秒内超过 90 次 pass 即判定异常并停止观察与监听。
6. **只观察 `childList`**：自身写入的 `style` / `data-*` 不会反过来触发观察器。
7. **逃生开关**（浏览器控制台）：

   ```js
   window.__dshSidebarOrganizer.reset();      // 忘掉保存的布局
   window.__dshSidebarOrganizer.disable();    // 置 localStorage 开关并停用，刷新后也不启动
   window.__dshSidebarOrganizer.hide("id");   // 手动收纳
   window.__dshSidebarOrganizer.reveal("id"); // 手动恢复
   window.__dshSidebarOrganizer.status();     // 查看当前状态
   ```

   `disable()` 之后要恢复，执行
   `localStorage.removeItem("dsh.sidebar-organizer.disabled")` 再刷新。
8. 就算本插件完全不工作，侧栏也只是保持 DSH 默认顺序，不会有其他副作用。

## 实现说明

- 面板所在的 list 插槽为 `sidebar.panellist`，注册项形如 `{ options: { id, order, label }, component }`；
  侧栏把 `entriesOfSlot` 投影成 `{id, order, label}` 并按 `order` 升序渲染为 `nav > button`。
- 本插件把渲染出来的行映射回注册 `id`：先按解析后的 `label` 与行 `aria-label` 精确匹配，
  匹配不到再按投影下标兜底，两者都不行就用 `label:<文字>` 做键。
- 保存的布局：`localStorage["dsh.sidebar-organizer.layout.v1"] = { version: 2, order: [id…], hidden: [id…] }`
  （`order` 同时包含可见与已收纳的 id）。
- 拖拽层：document 捕获阶段 `pointerdown` → 260ms 长按计时（指针移动超过 8px 取消）→
  激活后克隆行做 ghost、插入落点指示线；落点按其余行的竖直中点判定；拖到「更多」按钮矩形
  （外扩 6px）内即收纳；松手后 500ms 内吞掉紧随的 click，避免误触打开面板。
- 「更多」菜单里的行包在 `div[data-dso-more-key]` 中，同一套拖拽层据此识别来源并恢复。

## 目录结构

```
src/                 源码（模块化，按依赖顺序拼接）
  constants.js       常量、文案、共享句柄
  styles.js          注入的样式表
  storage.js         localStorage 布局持久化
  icons.js           图标 SVG 序列化与 id 前缀处理
  slot.js            只读访问 sidebar.panellist 投影
  runtime.js         DOM 运行时：定位面板列、应用顺序、拖拽手势
  menu.js            「更多」菜单里注册的那一行
  plugin.js          插件入口 apply()
scripts/build.mjs    把 src/ 拼成 lib/client.js
lib/client.js        构建产物（DSH 实际加载的客户端半）
lib/index.js         宿主半（占位）
cordis.patch.yml     bundle 补丁（安装时插入 profile）
test/harness.html    离线夹具：伪造侧栏 DOM 与插槽数据，浏览器打开即回归
```

DSH 的客户端插件是以经典脚本方式通过 `window.__ModuleLoader__.load({ id, factory })`
加载的，不是 ES 模块，因此运行时无法 `import`；源码模块化 + 构建期拼接是这个约束下的折中。

## 开发

```bash
npm run build   # src/ → lib/client.js
npm run check   # 语法检查
```

回归测试不碰真实 UI：用浏览器打开 `test/harness.html`，页面会自检并打印顺序、
持久化、`reset()`、收纳 / 恢复、菜单内拖动、拖动途中 DOM 替换与滚动的结果。

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 `0.2.1-rc.5` 上开发）。
- 客户端只 `require("react")`；`@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton`
  存在时优先使用，缺失时降级为内置按钮样式。

## 路线图

- [x] 0.2.0 — 只读 + DOM `order` 的最小可行版本
- [x] 0.2.1 — 属性选择器修复（CSS Modules 哈希类名导致选择器失配）
- [x] 0.3.0 — 「更多」收纳、键盘排序、拖动期抑制 `:hover`
- [x] 0.3.1 — 拖动期性能：几何快照、rAF 合并、暂停布局 pass
- [x] 0.3.2 — 「已收纳」行使用 `MenuItemButton` 的图标槽位
- [x] 0.3.3 — 修复 DOM 节点作为 React children 的回归
- [x] 0.3.4 — 图标内嵌 id 加前缀；「已收纳」内排序
- [x] 0.3.5 — 指针捕获延后到拖动成立，修复收纳条目无法点击
- [x] 0.3.6 — 点击收纳条目只打开面板，不再自动放回侧栏
- [x] 0.4.0 — 源码模块化与构建脚本、多语言文档、AI 使用与代码来源声明
- [x] 0.4.1 — 修复反复拖动时的排序抖动与「更多」误收纳
- [ ] 0.5.0 — 无障碍补强（菜单内上移 / 下移按钮、屏幕阅读器朗读顺序变化）

## 声明与引用

- 第三方代码与商标说明：[NOTICE.md](NOTICE.md)
- AI 参与方式、代码来源与引用方式：见 [NOTICE.md](NOTICE.md) 的「AI 使用与代码来源声明」一节
- 引用本项目的 BibTeX：[CITATION.cff](CITATION.cff)

## 许可

[MIT](LICENSE)
