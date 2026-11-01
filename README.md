# dsh-modmenu

给 DSH 左侧栏左上角那块「全局面板」栏（插件、市场、技能管理、定时任务…… 那一列图标）加上自定义排序能力。

> **当前版本 0.2.0 = 最小可行版本（MVP）**：只做「长按拖动排序」。
> 「拖进 / 拖出『更多』」是下一步，等这版稳定后再加，见文末路线图。

## 现在能做什么

- **长按拖动排序**：按住某个面板图标约 0.3 秒，图标会浮起来（出现跟随指针的 ghost 和一条落点指示线），上下拖动到目标位置松手即可。顺序即时生效并保存。
- 刷新页面、重启 DSH 后顺序保持。
- 「插件」入口和「更多」按钮的位置固定：「插件」可以拖动排序，「更多」永远在最下方。

## 安装

本仓库就是一个 DSH 插件包（bundle），在仓库目录下用插件管理器安装：

```
plugin_manager  action: install_bundle  target: C:\Users\TLEWA\Desktop\modmenu
```

装好后刷新 Web 界面（`Ctrl+R`）。仓库以 `link:` 方式装进 profile，之后改 `lib/client.js` 只需刷新页面即可生效，不必重装。

## 安全设计（0.1.0 卡死事故之后重写）

0.1.0 在每次插槽变更通知里重新注册整列面板，形成了
`注册 → 通知 → 再注册` 的反馈环，把页面拖死。0.2.0 彻底换掉机制：

1. **不碰插槽写接口**：不再调用 `ctx.slots.register / inject`，只读 `ctx.slots.entriesOfSlot("sidebar.panellist")` 来拿面板 `id` 和标签。侧栏自己的排序状态完全不受影响，结构上不可能再触发它的更新循环。
2. **排序只写 DOM 内联样式**：侧栏的面板列是 `display:flex; flex-direction:column`，所以给每行写 `style.order` 就足以改变视觉顺序；React 不管理这些节点的 `style`，不会打架。
3. **幂等 + 限流**：每次布局 pass 都是「值不同才写」，并通过 `requestAnimationFrame` 合并到每帧最多一次。
4. **看门狗**：3 秒内超过 90 次 pass 就判定异常，立刻停止观察与监听（宁可不干活，也不能拖死页面）。
5. **只观察 `childList`**：自己写的 `style` / `data-*` 不会反过来触发观察器。
6. **两个逃生开关**（浏览器控制台）：
   ```js
   window.__dshModmenu.reset();     // 忘掉保存的顺序
   window.__dshModmenu.disable();   // 置 localStorage 开关并停用，刷新后也不启动
   window.__dshModmenu.status();    // 查看当前状态
   ```
   `disable()` 之后要恢复，执行 `localStorage.removeItem("dsh.modmenu.disabled")` 再刷新。
7. 就算本插件完全不工作，侧栏也只是保持 DSH 默认顺序 —— 不会有其他副作用。

## 实现说明

- 面板所在的 list 插槽：`sidebar.panellist`，注册项形如 `{ options: { id, order, label }, component }`；侧栏把 `entriesOfSlot` 投影成 `{id, order, label}` 数组按 `order` 升序渲染成 `nav > button.panelRow`。
- 本插件把渲染出来的行映射回注册 `id`：先按解析后的 `label` 与行 `aria-label` 精确匹配，匹配不到再按投影下标兜底，两者都不行就用 `label:<文字>` 做键。
- 保存的布局：`localStorage["dsh.modmenu.layout.v1"] = { version: 1, order: [id…] }`。
- 拖拽层：document 捕获阶段 `pointerdown` → 320ms 长按计时（指针移动超过 8px 取消）→ 激活后克隆行做 ghost、插入落点指示线；落点按其余行的竖直中点判定；松手后 500ms 内吞掉紧随的 click，避免误触打开面板。

## 目录

```
lib/index.js       宿主半：仅占位（所有行为都在浏览器端）
lib/client.js      客户端半：只读插槽投影 + DOM 排序 + 长按拖拽 + 看门狗
cordis.patch.yml   bundle 补丁（安装时插入 profile）
test/harness.html  离线夹具：伪造侧栏 DOM 与插槽数据，浏览器直接打开即可回归拖拽逻辑
```

## 回归测试（不碰真实 UI）

用浏览器打开 `test/harness.html`，页面会自检并打印：

- 初次加载后的行顺序；
- 把最后一行拖到最前，检查视觉顺序与 `localStorage`；
- `reset()` 后是否回到注册顺序。

`test/harness.html` 里没有任何 DSH 服务依赖，纯静态页面。

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 0.2.1-rc.5 上开发）。
- 不依赖 `@deepseek-ai/dsh-client-ui-primitives` 或任何共享模块，客户端 `require` 为空。

## 路线图

- [x] 0.2.0 — 只读 + DOM `order` 的最小可行版本：长按拖动排序、持久化、看门狗、逃生开关。
- [ ] 0.3.0 — 「更多」收纳：把行拖到「更多」按钮上松手 = 隐藏；在「更多」菜单里长按拖出 = 恢复。隐藏同样只走 DOM 标记 + CSS，不写插槽。
- [ ] 0.4.0 — 键盘/辅助技术支持（给每行加「上移 / 下移 / 收起」的可访问操作）。

## 许可

MIT
