/**
 * Runs the .check.ts files in this folder.
 *
 * They import real app modules, so they need Vite's `import.meta.env`
 * (which does not exist in node) and a `localStorage` (which the Supabase
 * client touches at import time). esbuild bundles each check with both
 * stubbed in, then node runs it. Any check that exits non-zero fails the
 * whole run.
 *
 * Deliberately not a test framework: one file, no config, no watch mode,
 * nothing to keep up to date.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const checks = readdirSync(here).filter((f) => f.endsWith(".check.ts")).sort();

if (checks.length === 0) {
  console.error("no .check.ts files found in checks/");
  process.exit(1);
}

const out = mkdtempSync(path.join(tmpdir(), "loop-checks-"));
let failed = 0;

try {
  for (const file of checks) {
    const bundle = path.join(out, file.replace(/\.ts$/, ".mjs"));
    execFileSync(
      "npx",
      [
        "esbuild",
        path.join(here, file),
        "--bundle",
        "--platform=node",
        "--format=esm",
        "--tsconfig=tsconfig.app.json",
        // Vite inlines these at build time; node has no import.meta.env at all.
        `--define:import.meta.env={"DEV":false,"VITE_SUPABASE_URL":"http://localhost","VITE_SUPABASE_PUBLISHABLE_KEY":"stub"}`,
        `--outfile=${bundle}`,
        "--log-level=error",
      ],
      { stdio: "inherit", cwd: path.join(here, "..") }
    );

    // The Supabase client reads localStorage when the module loads.
    const boot = path.join(out, `boot-${file}.mjs`);
    writeFileSync(
      boot,
      `globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };\n` +
        `await import(${JSON.stringify(bundle)});\n`
    );

    console.log(`\n=== ${file} ===`);
    try {
      execFileSync("node", [boot], { stdio: "inherit" });
    } catch {
      failed++;
    }
  }
} finally {
  rmSync(out, { recursive: true, force: true });
}

if (failed > 0) {
  console.error(`\n${failed} check file(s) failed.\n`);
  process.exit(1);
}
console.log("all checks passed\n");
