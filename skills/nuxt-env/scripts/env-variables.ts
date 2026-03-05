#!/usr/bin/env bun

// scripts/env-variables.ts
import { promises as fs } from 'fs'
import * as path from 'path'
import chalk from 'chalk'
import { parseEnv, stripQuotes } from './libs/load-env'

type EnvMap = Record<string, string>
type OutputShape = Record<string, EnvMap>

const DEFAULT_BUNDLE_PATH = '.tmp/env-bundle.json'
const ALLOWED_TFVARS_FILES = [
    'terraform/terraform.tfvars',
    'terraform/envs/staging/terraform.tfvars',
    'terraform/envs/production/terraform.tfvars',
] as const
const ALLOWED_TFVARS_FILE_SET = new Set<string>(ALLOWED_TFVARS_FILES)

function stripHclInlineComment(v: string) {
    // Remove unquoted '#' or '//' comments for tfvars values
    let inSingle = false,
        inDouble = false
    for (let i = 0; i < v.length; i++) {
        const ch = v[i]
        const next = v[i + 1]
        if (ch === "'" && !inDouble) inSingle = !inSingle
        else if (ch === '"' && !inSingle) inDouble = !inDouble
        else if (!inSingle && !inDouble) {
            if (ch === '#') return v.slice(0, i).trim()
            if (ch === '/' && next === '/') return v.slice(0, i).trim()
        }
    }
    return v.trim()
}

async function findEnvFiles(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    return entries
        .filter(
            (e) =>
                e.isFile() &&
                // include .env and .env.*
                (e.name === '.env' || e.name.startsWith('.env.')) &&
                // exclude the encrypted bundle and temp files
                e.name !== '.env.hash.json' &&
                !e.name.endsWith('~') &&
                !e.name.endsWith('.bak') &&
                !e.name.endsWith('.tmp')
        )
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b))
}

// -------- Terraform (flat) parsing/writing --------
function isHclLiteral(v: string): boolean {
    const t = v.trim()
    // Lists: [...] and booleans only — numbers stay quoted since Terraform
    // auto-coerces "50" to number but cannot coerce unquoted 144737676116 to string.
    if (t.startsWith('[') && t.endsWith(']')) return true
    if (t === 'true' || t === 'false') return true
    return false
}

function parseTfvarsFlat(content: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#') || line.startsWith('//')) continue
        if (line.endsWith('{') || line.endsWith('}')) continue // ignore blocks

        const eq = line.indexOf('=')
        if (eq === -1) continue

        const key = line
            .slice(0, eq)
            .trim()
            .replace(/^"(.+)"$/, '$1')
        let value = line.slice(eq + 1)

        // allow // and # comments but only when outside quotes
        value = stripHclInlineComment(value)

        // Preserve HCL literals (lists, booleans, numbers) as-is; only strip quotes from strings
        if (!isHclLiteral(value)) {
            value = stripQuotes(value)
        }

        if (key) out[key] = value
    }
    return out
}

function tfvarsStringify(flat: EnvMap): string {
    const lines: string[] = []
    for (const [k, v] of Object.entries(sortFlatMap(flat))) {
        if (isHclLiteral(v)) {
            lines.push(`${k} = ${v}`)
        } else {
            const escaped = v.replace(/"/g, '\\"')
            lines.push(`${k} = "${escaped}"`)
        }
    }
    lines.push('') // trailing newline
    return lines.join('\n')
}

// -------- .env writing --------
function needsQuoteEnv(v: string): boolean {
    // Quote if contains spaces, tabs, #, or quotes
    return /\s|#|["']/.test(v)
}
function dotenvStringify(map: EnvMap): string {
    const lines: string[] = []
    for (const [k, v] of Object.entries(sortFlatMap(map))) {
        if (needsQuoteEnv(v)) {
            const escaped = v.replace(/"/g, '\\"')
            lines.push(`${k}="${escaped}"`)
        } else {
            lines.push(`${k}=${v}`)
        }
    }
    lines.push('')
    return lines.join('\n')
}

function sortFlatMap(map: EnvMap): EnvMap {
    return Object.fromEntries(
        Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    )
}

async function readJsonBundle(
    cwd: string,
    inFile: string
): Promise<OutputShape> {
    const jsonPath = path.join(cwd, inFile)
    const exists = await fs
        .access(jsonPath)
        .then(() => true)
        .catch(() => false)
    if (!exists) throw new Error(`Missing ${inFile}`)
    const raw = await fs.readFile(jsonPath, 'utf8')
    return JSON.parse(raw)
}

async function writeJsonBundle(
    cwd: string,
    outFile: string,
    data: OutputShape
) {
    const jsonPath = path.join(cwd, outFile)
    await fs.mkdir(path.dirname(jsonPath), { recursive: true })
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8')
}

async function findTfvarsFiles(cwd: string): Promise<string[]> {
    const results: string[] = []
    for (const relPath of ALLOWED_TFVARS_FILES) {
        const exists = await fs
            .access(path.join(cwd, relPath))
            .then(() => true)
            .catch(() => false)
        if (exists) results.push(relPath)
    }
    return results
}

function isAllowedEnvFilename(name: string): boolean {
    if (name.includes('/') || name.includes('\\')) return false
    if (name === '.env') return true
    if (!name.startsWith('.env.')) return false
    return name !== '.env.hash.json'
}

function assertSafeTargetKey(rawKey: string): 'env' | 'tfvars' {
    if (!rawKey || !rawKey.trim()) {
        throw new Error('Bundle contains an empty file key.')
    }
    if (path.isAbsolute(rawKey) || rawKey.startsWith('~')) {
        throw new Error(`Refusing absolute target path "${rawKey}".`)
    }
    if (rawKey.includes('\\')) {
        throw new Error(`Refusing Windows-style path separator in "${rawKey}".`)
    }

    const normalized = path.posix.normalize(rawKey)
    if (
        normalized !== rawKey ||
        normalized.startsWith('../') ||
        normalized === '..'
    ) {
        throw new Error(`Refusing unsafe target path "${rawKey}".`)
    }

    if (isAllowedEnvFilename(rawKey)) return 'env'
    if (ALLOWED_TFVARS_FILE_SET.has(rawKey)) return 'tfvars'

    throw new Error(
        `Refusing unsupported target "${rawKey}". Only root .env/.env.* and approved terraform.tfvars files are allowed.`
    )
}

function assertFlatStringMap(value: unknown, key: string): EnvMap {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(
            `Bundle entry "${key}" must be an object of string values.`
        )
    }

    const out: EnvMap = {}
    for (const [entryKey, entryValue] of Object.entries(
        value as Record<string, unknown>
    )) {
        if (typeof entryValue !== 'string') {
            throw new Error(
                `Bundle entry "${key}" contains non-string value for "${entryKey}".`
            )
        }
        out[entryKey] = entryValue
    }

    return out
}

// -------- JSON write ( --export-json ) --------
async function toJson(cwd: string, outFile = DEFAULT_BUNDLE_PATH) {
    const files = await findEnvFiles(cwd)

    const result: OutputShape = {}
    for (const name of files) {
        const fp = path.join(cwd, name)
        const content = await fs.readFile(fp, 'utf8')
        result[name] = sortFlatMap(parseEnv(content))
    }

    const tfvarsFiles = await findTfvarsFiles(cwd)
    for (const relPath of tfvarsFiles) {
        const content = await fs.readFile(path.join(cwd, relPath), 'utf8')
        const parsed = parseTfvarsFlat(content)
        result[relPath] = sortFlatMap(parsed)
    }

    await writeJsonBundle(cwd, outFile, result)
    const jsonPath = path.join(cwd, outFile)
    console.log(
        chalk.blue(
            `Wrote ${jsonPath} with ${files.length} .env.* file(s)${
                tfvarsFiles.length
                    ? ` + ${tfvarsFiles.length} terraform.tfvars file(s)`
                    : ''
            }.`
        )
    )
}

async function writeEnvFiles(
    cwd: string,
    data: Record<string, unknown>,
    dryRun = false
) {
    for (const [key, value] of Object.entries(data)) {
        const targetType = assertSafeTargetKey(key)
        const outPath = path.join(cwd, key)
        const envMap = assertFlatStringMap(value, key)

        if (dryRun) {
            console.log(chalk.yellow(`Would write ${key}`))
            continue
        }

        await fs.mkdir(path.dirname(outPath), { recursive: true })

        if (targetType === 'tfvars') {
            await fs.writeFile(outPath, tfvarsStringify(envMap), 'utf8')
            console.log(chalk.green(`Wrote ${key}`))
            continue
        }

        await fs.writeFile(outPath, dotenvStringify(envMap), 'utf8')
        console.log(chalk.green(`Wrote ${key}`))
    }
}

// -------- JSON -> files ( --import-json ) --------
async function toEnvFiles(
    cwd: string,
    inFile = DEFAULT_BUNDLE_PATH,
    dryRun = false
) {
    const data = await readJsonBundle(cwd, inFile)
    await writeEnvFiles(cwd, data as Record<string, unknown>, dryRun)
}

type CliOptions = {
    exportJson: boolean
    importJson: boolean
    inFile: string
    outFile: string
    dryRun: boolean
}

function parseCliArgs(argv: string[]): CliOptions {
    const options: CliOptions = {
        exportJson: false,
        importJson: false,
        inFile: DEFAULT_BUNDLE_PATH,
        outFile: DEFAULT_BUNDLE_PATH,
        dryRun: false,
    }

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i]

        if (arg === '--export-json') {
            options.exportJson = true
            continue
        }
        if (arg === '--import-json') {
            options.importJson = true
            continue
        }
        if (arg === '--dry-run') {
            options.dryRun = true
            continue
        }
        if (arg === '--in') {
            const next = argv[++i]
            if (!next) throw new Error('Missing value for --in')
            options.inFile = next
            continue
        }
        if (arg === '--out') {
            const next = argv[++i]
            if (!next) throw new Error('Missing value for --out')
            options.outFile = next
            continue
        }

        throw new Error(`Unknown argument "${arg}"`)
    }

    if (options.exportJson && options.importJson) {
        throw new Error('Use only one of --export-json or --import-json.')
    }

    return options
}

// -------- CLI --------
async function main() {
    const argv = parseCliArgs(process.argv.slice(2))

    const cwd = process.cwd()

    if (argv.exportJson) {
        await toJson(cwd, argv.outFile)
        return
    }
    if (argv.importJson) {
        await toEnvFiles(cwd, argv.inFile, argv.dryRun)
        return
    }

    console.log(
        chalk.blue('Nothing to do.\n') +
            chalk.blue(
                'Use --export-json (files -> JSON bundle) or --import-json (JSON bundle -> files).\n'
            ) +
            chalk.blue(
                `Optional: --out <path>, --in <path>, --dry-run (with --import-json). Default bundle path: ${DEFAULT_BUNDLE_PATH}`
            )
    )
}

main().catch((err) => {
    console.error(chalk.red(err instanceof Error ? err.message : String(err)))
    process.exit(1)
})
