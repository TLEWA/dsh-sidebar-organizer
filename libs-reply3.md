已修，见下个提交。两点都改了：

1. 完全没有定制（没有已保存顺序）且开关关闭时，`applyHostMenuOrder` 不再写任何 order——同时把上一次 pass 留在节点上的 order 清回空，开关中途关闭也能完整还给宿主，默认分组保持原样。
2. 开关关闭但存在已保存顺序时，新增 `placeHeaderMenuNativeSeams()`：宿主自己的两条 separator 也按「它上面有几行」拿到 `2GAP-1` 的 order，与行的 `2N` 插进同一条序列，不会再全部堆到 0 跳到最上面。

`npm test` 61/61、本地 gate PASS 17 ok / 0 fail / 1 skip；中英 CHANGELOG 同步。