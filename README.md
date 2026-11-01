# dsh-modmenu

给 DSH 左侧栏左上角那块「全局面板」栏（插件、市场、技能管理、定时任务…… 那一列图标）加上自定义排序与收纳能力。

> **当前版本 0.3.6**：长按拖动排序 + 拖入 / 拖出「更多」收纳 + 键盘排序。0.3.1 把拖动期性能改成「按下时冻结几何快照 + 每帧最多一次写入」；0.3.2 让「已收纳」行复用 MenuItemButton 的图标槽位，与「浏览更多插件 / 创建你的插件」排版一致；0.3.3 修掉 0.3.2 引入的回归——React 18 不接受 DOM 节点作为 children；0.3.4 给图标内嵌 id 加前缀（修「上下文洞察」等自带 mask 的图标空白），并支持在「已收纳」里长按拖动内部排序；0.3.5 把指针捕获从 pointerdown 推迟到真正开始拖动，修好「已收纳」条目无法单击进入的问题；0.3.6 让点击「已收纳」条目只打开对应面板、不再顺带把它放回侧栏。
>
> 0.2.1 修掉了 0.2.0 的静默失效：侧栏用 CSS Modules，运行时类是哈希名
> （如 `wtg9ga_panelRow`），所以插件改用属性/结构选择器（`nav`、
> `button[aria-label]`、`button[aria-haspopup="menu"]`）定位面板行。

## 现在能做什么

- **长按拖动排序**：按住某个面板图标约 0.3 秒，图标会浮起来（跟随指针的 ghost + 一条落点指示线），上下拖到目标位置松手即可。顺序即时生效并保存。
- **收进「更多」**：把行拖到「更多」按钮上松手，该面板就从面板栏消失，收进「更多」菜单。菜单里会多出「已收纳」分组。
- **从「更多」拖回来**：打开「更多」菜单，长按里面被收纳的面板并拖到左侧面板栏的目标位置松手，即恢复显示。
- **键盘排序**：聚焦某行后 `Alt+↑ / Alt+↓` 上下移动。
- **恢复默认排序**：自定义过布局后，「更多」菜单底部会出现「恢复默认排序」。
- 刷新页面、重启 DSH 后布局保持。
- 拖动过程中，指针下方的行不会触发 `:hover` / tooltip（拖动时行临时 `pointer-events: none`，命中判定全部走几何矩形）。
- 「插件」入口可以参与排序，也可以被收纳；「更多」按钮永远是最后一个。

## 安装

本仓库就是一个 DSH 插件包（bundle），在仓库目录下用插件管理器安装：

```
plugin_manager  action: install_bundle  target: C:\Users\TLEWA\Desktop\modmenu
```

装好后刷新 Web 界面（`Ctrl+R`）。仓库以 `link:` 方式装进 profile，之后改 `lib/client.js` 只需刷新页面即可生效，不必重装。

## 安全设计（0.1.0 卡死事故之后重写）

0.1.0 在每次插槽变更通知里重新注册整列面板，形成了
`注册 → 通知 → 再注册` 的反馈环，把页面拖死。0.2.0 起彻底换掉机制：

1. **面板列表只读**：不注册、不 shadow 任何 `sidebar.panellist` 条目，只读 `ctx.slots.entriesOfSlot("sidebar.panellist")` 来拿面板 `id` 和标签。侧栏自己的排序状态完全不受影响，结构上不可能再触发它的更新循环。
2. **排序/隐藏只写 DOM 内联样式**：面板列是 `display:flex; flex-direction:column`，给每行写 `style.order` 即可改视觉顺序；收纳用 `style.display:none` + `data-modmenu-hidden`。React 不管理这些内联样式，不会打架。
3. **唯一一次插槽写入**：往 `sidebar.panellist.actions`（「更多」菜单）注册一个静态行 `modmenu-organizer`，用来列出被收纳的面板并支持拖回。它只注册一次，不订阅、不重注册——这是 0.1.0 的反馈环里唯一被保留下来的写操作，且是静态的。
4. **幂等 + 限流**：每次布局 pass 都是「值不同才写」，并通过 `requestAnimationFrame` 合并到每帧最多一次。
5. **看门狗**：3 秒内超过 90 次 pass 就判定异常，立刻停止观察与监听（宁可不干活，也不能拖死页面）。
6. **只观察 `childList`**：自己写的 `style` / `data-*` 不会反过来触发观察器。
7. **逃生开关**（浏览器控制台）：
   ```js
   window.__dshModmenu.reset();     // 忘掉保存的布局
   window.__dshModmenu.disable();   // 置 localStorage 开关并停用，刷新后也不启动
   window.__dshModmenu.hide("id");  // 手动收纳
   window.__dshModmenu.reveal("id");// 手动恢复
   window.__dshModmenu.status();    // 查看当前状态
   ```
   `disable()` 之后要恢复，执行 `localStorage.removeItem("dsh.modmenu.disabled")` 再刷新。
8. 就算本插件完全不工作，侧栏也只是保持 DSH 默认顺序 —— 不会有其他副作用。

## 实现说明

- 面板所在的 list 插槽：`sidebar.panellist`，注册项形如 `{ options: { id, order, label }, component }`；侧栏把 `entriesOfSlot` 投影成 `{id, order, label}` 数组按 `order` 升序渲染成 `nav > button.panelRow`。
- 本插件把渲染出来的行映射回注册 `id`：先按解析后的 `label` 与行 `aria-label` 精确匹配，匹配不到再按投影下标兜底，两者都不行就用 `label:<文字>` 做键。
- 保存的布局：`localStorage["dsh.modmenu.layout.v1"] = { version: 2, order: [id…], hidden: [id…] }`（`order` 同时包含可见与已收纳的 id）。
- 拖拽层：document 捕获阶段 `pointerdown` → 260ms 长按计时（指针移动超过 8px 取消）→ 激活后克隆行做 ghost、插入落点指示线；落点按其余行的竖直中点判定；拖到「更多」按钮矩形（外扩 6px）内 = 收纳；松手后 500ms 内吞掉紧随的 click，避免误触打开面板。
- 「更多」菜单里的行包在 `div[data-modmenu-more-key]` 里，同一套拖拽层据此识别来源并恢复。

## 目录

```
lib/index.js       宿主半：仅占位（所有行为都在浏览器端）
lib/client.js      客户端半：只读插槽投影 + DOM 排序/隐藏 + 长按拖拽 + 「更多」菜单项 + 看门狗
cordis.patch.yml   bundle 补丁（安装时插入 profile）
test/harness.html  离线夹具：伪造侧栏 DOM 与插槽数据，浏览器直接打开即可回归拖拽逻辑
```

## 回归测试（不碰真实 UI）

用浏览器打开 `test/harness.html`，页面会自检并打印：

- 初次加载后的行顺序；
- 把最后一行拖到最前，检查视觉顺序与 `localStorage`；
- `reset()` 后是否回到注册顺序；
- 把一行拖到「更多」按钮上，检查 `hidden` 与 `display:none`；
- 调 eveal() 后检查恢复；
- 拖动过程中替换一行 DOM 并派发 scroll，检查拖动不中断、松手仍能提交。

`test/harness.html` 里没有任何 DSH 服务依赖，纯静态页面。

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 0.2.1-rc.5 上开发）。
- 客户端只 `require("react")`；`@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton` 存在时优先使用，缺失时降级为内置按钮样式。

## 路线图

- [x] 0.2.0 — 只读 + DOM `order` 的最小可行版本：长按拖动排序、持久化、看门狗、逃生开关。
- [x] 0.2.1 — 属性选择器修复（CSS Modules 哈希类名导致的选择器失配）。
- [x] 0.3.0 — 「更多」收纳：拖到「更多」= 收纳，菜单内长按拖出 = 恢复；`Alt+↑/↓` 键盘排序；拖动期间抑制 `:hover`。
- [x] 0.3.1 — 拖动期性能：按下时冻结几何快照、requestAnimationFrame 合并写入、拖动中暂停布局 pass；「已收纳」行沿用本地化名称与图标；移除菜单提示行。
- [x] 0.3.2 — 「已收纳」行改为把 glyph 交给 `MenuItemButton` 的 `icon` 槽位（与「浏览更多插件 / 创建你的插件」同一排版），图标统一 16px。
- [x] 0.3.3 — 修复 0.3.2 的回归：DOM 节点不能当 React children（会抛 "Objects are not valid as a React child" 并被插槽错误边界整块摘除），改为把 SVG 序列化成标记交给 `dangerouslySetInnerHTML`，并加 MenuBoundary 降级兜底。
- [ ] 0.4.0 — 无障碍补强（菜单内的上移/下移按钮、屏幕阅读器朗读顺序变化）。

## 许可

MIT

- [x] 0.3.4 — 图标 SVG 内嵌 id（mask/gradient）统一加前缀后再注入，修复「上下文洞察」收纳后图标空白；「已收纳」行支持长按拖动在菜单内排序。

- [x] 0.3.5 — 指针捕获只在长按成立后设置，普通点击不再被改派到外层容器，「更多」里的收纳条目可直接点击打开。

- [x] 0.3.6 — 「更多」里的收纳条目点击即打开对应面板并保持收纳状态；恢复到侧栏仅通过拖回左侧触发。
