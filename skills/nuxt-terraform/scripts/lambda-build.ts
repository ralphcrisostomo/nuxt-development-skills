// Build Lambda functions using esbuild and zip them for deployment
// Usage: bun scripts/lambda-build.ts --env=staging|production [--function=FunctionName]
// Requires: esbuild (bun add -d esbuild)
import {
  readdirSync,
  mkdirSync,
  createWriteStream,
  existsSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import archiver from "archiver";

const LAMBDA_SRC = "terraform/lambda/src";
const LAMBDA_DIST = "terraform/lambda/dist";
const TMP_DIR = ".tmp/lambda-build";

type Environment = "staging" | "production";

// --- Parse args ---

let env: Environment | undefined;
let functionName: string | undefined;

for (const arg of process.argv.slice(2)) {
  if (arg.startsWith("--env=")) {
    const val = arg.split("=")[1];
    if (val !== "staging" && val !== "production") {
      console.error(`Invalid environment: ${val} (must be staging or production)`);
      process.exit(1);
    }
    env = val;
  } else if (arg.startsWith("--function=")) {
    functionName = arg.split("=")[1];
  }
}

if (!env) {
  console.error("Usage: bun scripts/lambda-build.ts --env=staging|production [--function=FunctionName]");
  process.exit(1);
}

// --- Load config ---

const configPath = path.resolve("terraform-scaffold.config.ts");
if (!existsSync(configPath)) {
  console.error("terraform-scaffold.config.ts not found in project root");
  process.exit(1);
}

const configModule = await import(configPath);
const config = configModule.default ?? configModule;
const prefix: string = config.functionPrefix;

if (!prefix) {
  console.error("Could not read functionPrefix from terraform-scaffold.config.ts");
  process.exit(1);
}

// --- Resolve aliases from config ---

const aliases: Record<string, string> = {};
if (config.lambdaBuild?.aliases) {
  for (const [key, value] of Object.entries(config.lambdaBuild.aliases as Record<string, string>)) {
    aliases[key] = value === "." ? process.cwd() : path.resolve(value.replace(/^\.\//, ""));
  }
}

const target = config.lambdaBuild?.target ?? "node20";
const external = config.lambdaBuild?.external ?? ["aws-sdk", "@aws-sdk/*", "@aws-appsync/utils"];

// --- Discover functions ---

function discoverFunctions(): string[] {
  if (!existsSync(LAMBDA_SRC)) return [];
  return readdirSync(LAMBDA_SRC, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith(prefix))
    .map((e) => e.name)
    .sort();
}

const allFunctions = discoverFunctions();
let targets: string[];

if (functionName) {
  if (!allFunctions.includes(functionName)) {
    console.error(
      `Function "${functionName}" not found. Available:\n` +
        allFunctions.map((f) => `  - ${f}`).join("\n"),
    );
    process.exit(1);
  }
  targets = [functionName];
} else {
  targets = allFunctions;
}

if (targets.length === 0) {
  console.error(`No Lambda functions found matching prefix: ${prefix}`);
  process.exit(1);
}

// --- Build helpers ---

const envPrefix = env === "staging" ? "Staging" : "Production";

function getZipName(fn: string): string {
  const suffix = fn.replace(prefix, "");
  return `${prefix}${envPrefix}${suffix}.zip`;
}

function formatTimestamp(): string {
  return new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

async function bundleFunction(fn: string): Promise<string> {
  const entryFile = path.join(LAMBDA_SRC, fn, "index.ts");
  if (!existsSync(entryFile)) {
    throw new Error(`Entry file not found: ${entryFile}`);
  }

  const outDir = path.join(TMP_DIR, fn);
  mkdirSync(outDir, { recursive: true });

  const outfile = path.join(outDir, "index.js");

  await build({
    entryPoints: [entryFile],
    bundle: true,
    minify: false,
    sourcemap: false,
    platform: "node",
    target,
    supported: { bigint: true },
    outfile,
    external,
    define: { "process.env.NODE_ENV": '"production"' },
    format: "cjs",
    logLevel: "warning",
    alias: Object.keys(aliases).length > 0 ? aliases : undefined,
  });

  return outfile;
}

async function zipFunction(bundlePath: string, zipPath: string): Promise<void> {
  mkdirSync(path.dirname(zipPath), { recursive: true });

  const packageJsonPath = path.join(path.dirname(bundlePath), "package.json");
  writeFileSync(
    packageJsonPath,
    JSON.stringify({ version: "0.0.1", lastBuildAt: formatTimestamp() }, null, 2) + "\n",
  );

  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.file(bundlePath, { name: "index.js" });
    archive.file(packageJsonPath, { name: "package.json" });
    archive.finalize();
  });
}

// --- Main ---

mkdirSync(LAMBDA_DIST, { recursive: true });
mkdirSync(TMP_DIR, { recursive: true });

console.log(`\nLambda Build — ${envPrefix}\n`);
console.log(`Building ${targets.length} function(s)...\n`);

const results = await Promise.allSettled(
  targets.map(async (fn) => {
    const zipName = getZipName(fn);
    console.log(`  [build] ${fn} → ${zipName}`);
    const bundlePath = await bundleFunction(fn);
    const zipPath = path.join(LAMBDA_DIST, zipName);
    await zipFunction(bundlePath, zipPath);
    console.log(`  [done]  ${zipName}`);
  }),
);

const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");

console.log("");
if (failed.length > 0) {
  console.error(`${failed.length} function(s) failed to build:`);
  failed.forEach((r) => console.error(`  ${r.reason}`));
  process.exit(1);
}

console.log(`All ${targets.length} function(s) built successfully.`);
