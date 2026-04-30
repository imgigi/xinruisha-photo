// 把 data.initial.json 灌进 Cloudflare KV
// 用法：
//   wrangler 已登录 + wrangler.toml 里的 KV namespace id 已填好
//   node scripts/seed-data.mjs            ← 灌远端 KV
//   node scripts/seed-data.mjs --local    ← 灌本地 dev KV（npm run dev 用的那个）

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const dataFile = resolve(root, "data.initial.json");
const isLocal = process.argv.includes("--local");

const json = JSON.parse(readFileSync(dataFile, "utf8"));
const tmp  = resolve(root, ".seed.tmp.json");
writeFileSync(tmp, JSON.stringify(json));

const flag = isLocal ? "--local" : "--remote";
const cmd  = `wrangler kv key put data --binding=DATA --path=${tmp} ${flag}`;

console.log(`> ${cmd}`);
try {
  execSync(cmd, { cwd: root, stdio: "inherit" });
  console.log(isLocal ? "✓ Seeded LOCAL KV" : "✓ Seeded REMOTE KV");
} finally {
  try { unlinkSync(tmp); } catch {}
}
