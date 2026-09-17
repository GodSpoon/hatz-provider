#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";

// Verify bun is available before spawning.
try {
  execSync(isWin ? "where bun" : "which bun", { stdio: "ignore" });
} catch {
  console.error("❌  bun is required but not found.");
  console.error("    Install it: npm install -g bun");
  process.exit(1);
}

const cli = join(__dirname, "cli.ts");
const bunCmd = isWin ? "bun.cmd" : "bun";
const child = spawn(bunCmd, ["run", cli, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code) => process.exit(code ?? 1));
