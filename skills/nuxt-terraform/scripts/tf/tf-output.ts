// Export terraform outputs to .env files
// Usage: bun scripts/tf/tf-output.ts <environment>
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ENVS_DIR = "terraform/envs";
const VALID_ENVS = ["staging", "production"] as const;

type EnvMap = Record<string, string>;

function parseEnv(content: string): EnvMap {
  const out: EnvMap = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

function needsQuote(v: string): boolean {
  return /\s|#|["']/.test(v);
}

function stringify(map: EnvMap): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(map).sort(([a], [b]) => a.localeCompare(b))) {
    if (needsQuote(v)) {
      lines.push(`${k}="${v.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${k}=${v}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function mergeEnv(tfValues: EnvMap, targetPath: string): void {
  let existing: EnvMap = {};
  try {
    existing = parseEnv(readFileSync(targetPath, "utf8"));
  } catch {
    // file doesn't exist yet
  }

  const added: string[] = [];
  const updated: string[] = [];
  const tfKeys = Object.keys(tfValues).sort();

  for (const key of tfKeys) {
    if (!(key in existing)) added.push(key);
    else if (existing[key] !== tfValues[key]) updated.push(key);
  }

  const merged = { ...existing, ...tfValues };
  writeFileSync(targetPath, stringify(merged), "utf8");

  console.log(`Wrote ${targetPath} (${Object.keys(merged).length} keys total)`);
  if (added.length > 0) console.log(`  Added: ${added.join(", ")}`);
  if (updated.length > 0) console.log(`  Updated: ${updated.join(", ")}`);
  const unchanged = tfKeys.length - added.length - updated.length;
  if (unchanged > 0) console.log(`  Unchanged: ${unchanged} key(s)`);
}

// --- Main ---

const envArg = process.argv[2];

if (!envArg || !VALID_ENVS.includes(envArg as any)) {
  console.error(
    envArg
      ? `Invalid environment: ${envArg}`
      : "Missing environment argument",
  );
  console.error("Usage: bun scripts/tf/tf-output.ts <environment>");
  console.error("  environment: staging | production");
  process.exit(1);
}

const envDir = `${ENVS_DIR}/${envArg}`;
const outFile = `.env.${envArg}`;

console.log(`Running terraform output for ${envArg}...`);

const result = spawnSync(
  "terraform",
  [`-chdir=${envDir}`, "output", "-json", "config"],
  { env: process.env, encoding: "utf8" },
);

if (result.error) {
  console.error(`Failed to execute terraform: ${result.error.message}`);
  process.exit(1);
}

if (typeof result.status === "number" && result.status !== 0) {
  console.error(`terraform output failed (exit ${result.status})`);
  if (result.stderr) console.error(result.stderr);
  process.exit(result.status);
}

let tfValues: EnvMap;
try {
  const parsed = JSON.parse(result.stdout);
  const raw = parsed.value ?? parsed;
  tfValues = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    tfValues[k] = String(v);
  }
} catch (err) {
  console.error(`Failed to parse terraform output: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}

if (Object.keys(tfValues).length === 0) {
  console.warn("Terraform output contained no keys.");
  process.exit(0);
}

mergeEnv(tfValues, outFile);

if (envArg === "staging") {
  mergeEnv(tfValues, ".env");
}
