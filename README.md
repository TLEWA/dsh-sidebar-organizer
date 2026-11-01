# dsh-modmenu

给 DSH 左侧栏左上角那块「全局面板」栏（插件、市场、技能管理、定时任务…… 那一列图标）加上自定义能力：

- **长按拖动排序**：按住某个面板图标约 0.3 秒，图标会浮起来，上下拖动即可调整顺序。
- **拖进「更多」收起**：把图标拖到这一列最下方的「更多」按钮上松手，它就收进「更多」菜单。
- **从「更多」拖出来**：打开「更多」，长按里面「已收起的面板」，往上拖到列表里想要的空位松手即可放回。
- **恢复默认**：「更多」菜单底部提供「恢复默认排序」。

布局保存在浏览器 `localStorage`（键 `dsh.modmenu.layout.v1`），刷新/重启后仍然生效。
「插件」面板是进入插件管理的主入口，**始终不会被收起**（但仍可拖动排序）。

## 安装

本仓库就是一个 DSH 插件包（bundle），直接在仓库目录下用插件管理器安装即可：

```
plugin_manager  action: install_bundle  target: C:\Users\TLEWA\Desktop\modmenu
```

或者用 DSH CLI：`dsh plugin add <本目录>`。安装完成后刷新 Web 界面。

## 实现说明（为什么这么做）

DSH 的侧栏面板列表来自客户端插槽 `sidebar.panellist`：每个插件向这个 list 插槽注册一格（一个 `id` 对应一个面板），槽渲染器按各条注册的 `order` 排序，而**按钮本身由侧栏绘制**，插件只提供图标组件。槽的核心规则是「同 `id` 但不同 `priority` 可以覆盖（shadow），priority 最低者生效」。

因此本插件：

1. 读取 `ctx.slots.entries("sidebar.panellist")`，拿到当前每一格真正的组件、`label`、`locale`、`inject` 等元信息；
2. 用同一个 `id`、`priority = 其它注册者的最低 priority - 1` 重新注册一遍，组件换成一层**透明包装**：它原样接收并转发所有 props（`size`、`active`、标准 hook props、`t`……），同时在 `useEffect` 里给外壳画的那颗 `button.panelRow` 打上 `data-modmenu-id`，让拖拽层能不靠猜 DOM 就认出行；
3. 排序靠重新注册时的 `order`（`(index+1)*10`），改动后重新注册一次即可让侧栏自己重排；
4. 「收起」= 给行按钮加 `data-modmenu-hidden`，用 CSS 隐藏（外壳的 pin 状态是内存态、启动时无法调用，所以不走它）；同时把这些面板作为可拖动行渲染进 `sidebar.panellist.actions`（「更多」菜单的行来源）里；
5. 拖拽是纯 DOM 手势层：`pointerdown` 捕获 → 300ms 长按定时器 → 克隆一行做浮动 ghost + 2px 落点指示线，「更多」按钮作为收起目标高亮；落点用行元素的中点判定插入位置；松手后抑制紧随的 click，避免误触打开面板。

## 目录

```
lib/index.js   宿主半：仅占位（插件所有行为都在浏览器端）
lib/client.js  客户端半：覆盖注册 + 拖拽手势 + 「更多」菜单行 + 样式
cordis.patch.yml  bundle 补丁（安装时插入 profile）
```

## 兼容性

- DSH `>= 0.2.1-rc.3`（在 0.2.1-rc.5 上开发）。
- 只依赖公开插槽 API 与 `@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton`；若后者缺失会退化为插件自带的行样式。

## 许可

MIT
