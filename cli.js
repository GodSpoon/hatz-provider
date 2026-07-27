#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Verify bun is available before spawning (Node v24+ blocks direct .cmd execution)
try {
  execSync(process.platform === "win32" ? "where bun" : "which bun", { stdio: "ignore" });
} catch {
  console.error("❌  bun is required but not found.");
  console.error("    Install it: npm install -g bun");
  process.exit(1);
}

const cli = join(__dirname, "cli.ts");
const child = spawn("bun", ["run", cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
child.on("exit", (code) => process.exit(code ?? 1));
