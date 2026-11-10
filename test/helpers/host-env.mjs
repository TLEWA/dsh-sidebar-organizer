import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIB_DIR = join(HERE, "..", "..", "lib");

/**
 * Import lib/index.js against a throwaway $DSH_HOME and capture the fetch route
 * handler it registers with the host. Each call gets a fresh module instance
 * (unique query) so module-level state cannot leak between test files.
 */
export async function createHostEnv() {
  const home = await mkdtemp(join(tmpdir(), "dso-host-"));
  const previousHome = process.env.DSH_HOME;
  process.env.DSH_HOME = home;

  const url = pathToFileURL(join(LIB_DIR, "index.js")).href + "?case=" + encodeURIComponent(home);
  const mod = await import(url);
  const warnings = [];
  let route = null;

  mod.apply({
    logger: {
      warn: (...args) => warnings.push(args.map(String).join(" ")),
      debug: () => {},
      info: () => {},
    },
    inject: (deps, callback) => {
      callback({
        get: (name) =>
          name === "connection"
            ? { fetch: { register: (definition) => { route = definition; return () => {}; } } }
            : undefined,
        effect: (fn) => fn(),
      });
    },
  });

  if (!route) throw new Error("the host half did not register the layout route");

  const layoutFile = join(home, "storages", "dsh-sidebar-organizer", "layout.json");

  async function request(method, body) {
    const init = { method, headers: {} };
    if (body !== undefined) {
      init.headers["content-type"] = "application/json";
      init.body = typeof body === "string" ? body : JSON.stringify(body);
    }
    return route.fetch(new Request("http://127.0.0.1" + route.path, init));
  }

  return {
    home,
    layoutFile,
    request,
    warnings,
    async writeLayoutFile(text) {
      await mkdir(dirname(layoutFile), { recursive: true });
      await writeFile(layoutFile, text, "utf8");
    },
    async readLayoutFile() {
      return readFile(layoutFile, "utf8");
    },
    async listLayoutDir() {
      return readdir(dirname(layoutFile));
    },
    async cleanup() {
      if (previousHome === undefined) delete process.env.DSH_HOME;
      else process.env.DSH_HOME = previousHome;
      await rm(home, { recursive: true, force: true });
    },
  };
}
