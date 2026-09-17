#!/usr/bin/env node
import { execSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWin = process.platform === "win32";

function findBun() {
  if (!isWin) return "bun";

  // Global npm install: shim lives in npm/bin, actual binary in npm/node_modules/bun/bin/bun.exe
  try {
    const npmRoot = execSync("npm root -g", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    }).trim();
    const candidate = join(npmRoot, "bun", "bin", "bun.exe");
    if (existsSync(candidate)) return candidate;
  } catch {}

  // Bun Windows installer default location
  const bunInstall = process.env.BUN_INSTALL || join(homedir(), ".bun");
  const candidate = join(bunInstall, "bin", "bun.exe");
  if (existsSync(candidate)) return candidate;

  // Last resort: rely on shell resolution (may emit Node DEP0190 warning)
  return { cmd: "bun", shell: true };
}

// Verify a bun command is reachable.
try {
  execSync(isWin ? "where bun" : "which bun", { stdio: "ignore" });
} catch {
  console.error("❌  bun is required but not found.");
  console.error("    Install it: npm install -g bun");
  process.exit(1);
}

const bun = findBun();
const cli = join(__dirname, "cli.ts");
const child = spawn(
  typeof bun === "string" ? bun : bun.cmd,
  ["run", cli, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: process.env,
    shell: typeof bun === "object" ? bun.shell : false,
  }
);
child.on("exit", (code) => process.exit(code ?? 1));
