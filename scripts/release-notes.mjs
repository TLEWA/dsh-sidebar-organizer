#!/usr/bin/env node
// Generate the GitHub Release body for a tag:
//   node scripts/release-notes.mjs v0.6.0 [asset-name]
// The body contains a DSH install section plus the matching CHANGELOG section.
import fs from "node:fs";

const tag = process.argv[2];
const assetArg = process.argv[3];
if (!tag) {
  console.error("usage: node scripts/release-notes.mjs <tag> [asset-name]");
  process.exit(1);
}

const pkg = JSON.parse(
  fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
const changelog = fs.readFileSync(
  new URL("../CHANGELOG.md", import.meta.url),
  "utf8",
);

const version = pkg.version;
if (tag.replace(/^v/, "") !== version) {
  console.error(`tag ${tag} does not match package.json version ${version}`);
  process.exit(1);
}

const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const heading = new RegExp(`^##\\s+${escaped}(?:\\s|$)`);
const lines = changelog.split(/\r?\n/);
const start = lines.findIndex((line) => heading.test(line));
if (start === -1) {
  console.error(`CHANGELOG.md has no section for ${version}`);
  process.exit(1);
}
let end = lines.length;
for (let i = start + 1; i < lines.length; i += 1) {
  if (/^##\s+/.test(lines[i])) {
    end = i;
    break;
  }
}
const section = lines.slice(start, end).join("\n").trim();

const repo = (pkg.repository?.url ?? "")
  .replace(/^git\+/, "")
  .replace(/\.git$/, "");
if (!/^https:\/\/github\.com\//.test(repo)) {
  console.error("package.json repository.url must be a GitHub HTTPS URL");
  process.exit(1);
}

const asset = assetArg || `${pkg.name}-${version}.tgz`;
const assetUrl = `${repo}/releases/download/${tag}/${asset}`;

const body = `## 安装

在 DSH 桌面端打开「插件」页 →「添加插件」，粘贴下面的压缩包链接：

${assetUrl}

也可以下载 \`${asset}\` 后选择本地文件安装；发布页同时提供 \`SHA256SUMS\` 便于校验。安装完成后按 \`Ctrl+R\` 刷新界面。

> 备选：粘贴 Git 地址 \`git+${repo}.git#${tag}\`。这种方式直接使用仓库里已构建好的 \`lib/\`，不需要在本机构建。

---

${section}
`;

process.stdout.write(body);
