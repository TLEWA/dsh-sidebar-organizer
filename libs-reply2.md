已修，提交见下。`applyHostMenuOrder` 的早退挪到「排序写入之后」：行顺序先照旧按 `HOST_MENU_ORDER_KEY` 应用，之后才判断 `contextMenuEnabled()`，开关关闭时只 `clearHeaderMenuDividers()`（顺带恢复宿主原生 separator 的 display）并返回，不再影响排序本身。

也就是说开关现在只拥有「分隔线」这一块，排序回到 ad5ac42 之前那条不受开关约束的路径；DSH 0.2.1 与关掉右键菜单时拖动仍会换位，重新打开也会恢复已保存顺序。CHANGELOG 中英各补一条，本地 gate PASS 17 ok / 0 fail / 1 skip。