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
const parts = MODULES.map((file) => {
  const full = path.join(sourceDir, file);
  const text = fs.readFileSync(full, "utf8").replace(/\s+$/, "");
  return text.replaceAll("__VERSION__", pkg.version);
});

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
  `built ${path.relative(root, target)} from ${MODULES.length} modules (${output.split("\n").length} lines)\n`
);
