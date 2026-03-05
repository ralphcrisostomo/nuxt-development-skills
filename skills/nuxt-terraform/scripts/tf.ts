// Terraform wrapper — runs init/plan/apply for a given environment
// Usage: bun scripts/tf.ts <environment> <action> [-- <extra terraform args>]
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ENVS_DIR = "terraform/envs";
const VALID_ENVS = ["staging", "production"] as const;
const VALID_ACTIONS = ["init", "plan", "apply"] as const;

function usage(): string {
  return [
    "Usage: bun scripts/tf.ts <environment> <action> [-- <terraform args>]",
    "  environment: staging | production",
    "  action: init | plan | apply",
  ].join("\n");
}

function run(args: string[]): void {
  const result = spawnSync("terraform", args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`Failed to execute terraform: ${result.error.message}`);
    process.exit(1);
  }
  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

const argv = process.argv.slice(2);
const sepIndex = argv.indexOf("--");
const baseArgs = sepIndex === -1 ? argv : argv.slice(0, sepIndex);
const extraArgs = sepIndex === -1 ? [] : argv.slice(sepIndex + 1);

const [envArg, actionArg] = baseArgs;

if (!envArg || !actionArg) {
  console.error(usage());
  process.exit(1);
}

if (!VALID_ENVS.includes(envArg as any)) {
  console.error(`Invalid environment: ${envArg}\n${usage()}`);
  process.exit(1);
}

if (!VALID_ACTIONS.includes(actionArg as any)) {
  console.error(`Invalid action: ${actionArg}\n${usage()}`);
  process.exit(1);
}

const envDir = `${ENVS_DIR}/${envArg}`;
const planFile = `.terraform/${envArg}.tfplan`;
const chdir = [`-chdir=${envDir}`];

mkdirSync(resolve(envDir, ".terraform"), { recursive: true });

if (actionArg === "init") {
  run([...chdir, "init", "-reconfigure", "-backend-config=backend.hcl", ...extraArgs]);
} else if (actionArg === "plan") {
  run([...chdir, "plan", "-var-file=terraform.tfvars", `-out=${planFile}`, ...extraArgs]);
} else {
  // apply: create fresh plan then apply
  run([...chdir, "plan", "-var-file=terraform.tfvars", `-out=${planFile}`]);
  run([...chdir, "apply", planFile, ...extraArgs]);
}
