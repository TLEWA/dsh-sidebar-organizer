已修，提交 f5a456d。右键换算 GAP 之前先按视觉顺序（行上的 flex `order`）重排各行：新增纯函数 `sortHeaderMenuRowIndexes()`（src/context-geometry.js），runtime 里用 `headerMenuVisualRowNodes()` 取行；未设 order 的行按 CSS 默认的 order 0 排在最前，而不是排到最后，全部未设时退回子节点顺序。

新增 `test/o17-header-menu-visual-order.test.mjs`（4 例：拖到首位的行、未设 order、全部未设、同 order 与垃圾输入），`npm test` 61/61 通过，本地 gate PASS 17 ok / 0 fail / 1 skip。真机侧这一条由纯函数覆盖；拖动与右键的交互回归已在 ad5ac42 的构建上做过。