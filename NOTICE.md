# NOTICE — dsh-sidebar-organizer

**简体中文** · [English](NOTICE.en.md)

本文件说明本项目的代码来源、第三方组件、AI 参与方式与引用方式。
最后更新：2026-11-02（v0.4.0）。

## 1. 项目性质

`dsh-sidebar-organizer` 是社区第三方插件，**不是** DeepSeek 官方产品，也未获得
DeepSeek 的背书或认证。它通过 DSH 客户端在运行时暴露的插件接口
（`window.__ModuleLoader__.load`、`ctx.slots`、`ctx.locale`、`ctx.effect`）
与宿主交互，不修改宿主安装目录中的任何文件。

## 2. 第三方代码与资源

- **不包含宿主源代码。** 本项目未复制、未改编、未再分发 DSH（DeepSeek Harness）
  的任何源代码或资源。DSH 为专有软件，其版权归 DeepSeek 所有；本项目仅依据其
  公开的插件机制（bundle 包格式、客户端模块加载器、插槽 API）编写。
- **运行时依赖由宿主提供。** `react` 由 DSH 客户端模块加载器提供；
  `@deepseek-ai/dsh-client-ui-primitives` 的 `MenuItemButton` 为可选增强，
  仅在宿主存在时调用，本项目不分发这两个包。
- **图标由宿主实时提供。** 菜单行左侧图标是运行时从侧栏面板自身渲染的 SVG
  克隆而来（含 `mask` / `gradient` 的 id 前缀改写），本项目不附带任何图标资源。
- **无第三方运行时代码。** `src/`、`lib/`、`test/harness.html` 中未内联任何
  第三方库；测试夹具使用原生 DOM API 与手写的假模块加载器。
- **开发工具**（不随包分发）：Node.js（MIT）、npm（Artistic License 2.0）。
- 若你认为本项目某段实现与你的项目高度相似且未被署名，请通过 issue 联系，
  我们会核实并补充署名或调整实现。

## 3. AI 使用与代码来源声明

- **开发方式。** 本项目在 DeepSeek Harness 中、由 AI 编程代理（DeepSeek 模型）
  与维护者结对完成：维护者负责提出需求、评审交互、指出缺陷、验收与发布决策；
  AI 负责实现、调试与文档初稿。
- **AI 参与范围。** `src/` 与 `lib/` 的全部客户端代码、宿主侧占位代码、离线
  测试夹具、README / NOTICE / CHANGELOG 的初稿，均由 AI 生成或大幅修改，
  并经维护者在真实 DSH 桌面端逐版验证（拖动、收纳、菜单、性能与卡死回归）。
- **人类责任。** 维护者对仓库内容、构建产物与发布版本负最终责任。
- **隐私。** 插件不发起网络请求、不采集遥测；全部状态（顺序、收纳列表、
  停用开关）只写入浏览器 `localStorage`，键名见 README。
- **稳定性提示。** 本插件依赖宿主渲染出的 DOM 结构与插槽投影（未文档化细节）。
  DSH 升级后可能失效；失效时侧栏会保持宿主默认顺序，并可用 README 中的
  逃生开关停用。

## 4. 引用方式

若在教学、文章或研究中引用本项目，请使用 [CITATION.cff](CITATION.cff)：

```bibtex
@software{dsh_sidebar_organizer,
  author  = {TLEWA},
  title   = {dsh-sidebar-organizer: Drag-to-reorder and tuck-away for the DSH sidebar panel strip},
  version = {0.4.0},
  year    = {2026},
  license = {MIT},
  url     = {https://github.com/TLEWA/dsh-sidebar-organizer}
}
```

代码引用请同时标注版本号或 commit SHA，例如
`dsh-sidebar-organizer v0.4.0 (https://github.com/TLEWA/dsh-sidebar-organizer)`。

## 5. 商标

「DeepSeek」「DeepSeek Harness」「DSH」等名称与标识归其权利人所有。本项目名称
`dsh-sidebar-organizer` 仅作描述性使用（说明其适用的宿主与用途），不代表任何
关联或背书。README 中出现的第三方产品名仅用于说明兼容性。

## 6. 许可

本项目以 [MIT](LICENSE) 许可发布。再分发源码或构建产物时，请保留 `LICENSE`
与本 `NOTICE` 文件。MIT 许可不提供任何担保。
