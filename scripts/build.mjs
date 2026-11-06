/**
 * Assemble the client bundle.
 *
 * The DSH client loads plugin code as a single classic script that calls
 * `window.__ModuleLoader__.load({ id, factory })` — it is not an ES module and
 * cannot `import`. So the readable sources live in `src/`, and this script
 * concatenates them, in dependency order, into `lib/client.js`.
 *
 * Usage: npm run build
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve(import.meta.dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

/** Concatenation order matters: later files may use earlier declarations. */
const MODULES = [
  "constants.js",
  "styles.js",
  "storage.js",
  "sync.js",
  "icons.js",
  "slot.js",
  "scopes.js",
  "runtime.js",
  "menu.js",
  "settings.js",
  "plugin.js",
];

const sourceDir = path.join(root, "src");
// Normalise line endings before hashing and emitting: a Windows checkout reads
// sources as CRLF while CI checks out LF, and hashing the raw bytes made the
// build hash (and therefore the committed bundle) differ per platform.
const readSource = (file) =>
  fs.readFileSync(path.join(sourceDir, file), "utf8").replace(/\r\n/g, "\n").replace(/\s+$/, "");
const rawParts = MODULES.map((file) => readSource(file).replaceAll("__VERSION__", pkg.version));
// Short content hash so a running page can report exactly which bundle it got.
const build = pkg.version + "+" + crypto.createHash("sha256").update(rawParts.join("\n")).digest("hex").slice(0, 10);
const parts = MODULES.map((file) => readSource(file).replaceAll("__BUILD__", build));

const banner = `/**
 * dsh-sidebar-organizer — client half (v${pkg.version}).
 *
 * GENERATED FILE — do not edit by hand.
 * Sources live in src/; run \`npm run build\` to regenerate.
 *
 * Why one file: the DSH client loads plugin code as a classic script through
 * window.__ModuleLoader__.load({ id, factory }), not as an ES module, so there
 * is no import resolution at runtime.
 */

`;

const wrapperHead = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(pkg.name)},
  factory: (require) => {
`;

const wrapperTail = `
    sharedRequire = require;
    return {
      apply,
      inject: ["slots"],
    };
  },
});
`;

const output = `${banner}${wrapperHead}${parts.join("\n\n")}${wrapperTail}`;
const target = path.join(root, "lib", "client.js");
fs.writeFileSync(target, output, "utf8");
process.stdout.write(
  `built ${path.relative(root, target)} from ${MODULES.length} modules (${output.split("\n").length} lines) build ${build}\n`
);
