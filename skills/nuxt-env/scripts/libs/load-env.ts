/**
 * Shared .env file parsing and loading utilities.
 *
 * Extracted from scripts/env-variables.ts so that data-fetch scripts
 * (data-fetch scripts, CLI tools, etc.) can
 * reliably load .env files without duplicating parsing logic.
 */

import { promises as fs } from 'fs'
import * as path from 'path'
import chalk from 'chalk'

// ---- low-level helpers ----

export function stripQuotes(v: string): string {
    v = v.trim()
    if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
    ) {
        return v.slice(1, -1)
    }
    return v
}

export function stripEnvInlineHash(v: string): string {
    let inSingle = false,
        inDouble = false
    for (let i = 0; i < v.length; i++) {
        const ch = v[i]
        if (ch === "'" && !inDouble) inSingle = !inSingle
        else if (ch === '"' && !inSingle) inDouble = !inDouble
        else if (ch === '#' && !inSingle && !inDouble) {
            return v.slice(0, i).trim()
        }
    }
    return v.trim()
}

// ---- .env parser ----

export function parseEnv(content: string): Record<string, string> {
    const out: Record<string, string> = {}
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim()
        if (!line || line.startsWith('#')) continue

        const eq = line.indexOf('=')
        if (eq === -1) continue

        const key = line.slice(0, eq).trim()
        let value = line.slice(eq + 1)

        value = stripEnvInlineHash(value)
        value = stripQuotes(value)

        if (key) out[key] = value
    }
    return out
}

// ---- high-level loaders ----

type LoadEnvOptions = {
    /** When true, later files overwrite earlier values AND overwrite existing process.env entries. Default: false (standard dotenv: first-wins). */
    override?: boolean
    /** Label used in log output. Default: "load-env". */
    label?: string
}

/**
 * Reads one or more `.env` files in order and populates `process.env`.
 *
 * - Files are loaded left-to-right; later files can supply new keys.
 * - By default, existing `process.env` values are NOT overwritten (standard
 *   dotenv convention). Pass `override: true` to change this.
 * - If a file is missing, a red error is logged and loading stops.
 *
 * Returns the merged `Record<string, string>` of all parsed values.
 */
export async function loadEnvFiles(
    filePaths: string[],
    options: LoadEnvOptions = {}
): Promise<Record<string, string>> {
    const { override = false, label = 'load-env' } = options
    const merged: Record<string, string> = {}

    for (const filePath of filePaths) {
        const exists = await fs
            .access(filePath)
            .then(() => true)
            .catch(() => false)

        if (!exists) {
            console.error(
                chalk.red(`[${label}] env file not found: ${filePath}`)
            )
            break
        }

        const content = await fs.readFile(filePath, 'utf8')
        const parsed = parseEnv(content)
        const count = Object.keys(parsed).length

        for (const [key, value] of Object.entries(parsed)) {
            merged[key] = value

            if (override || process.env[key] === undefined) {
                process.env[key] = value
            }
        }

        console.log(
            chalk.cyan(
                `[${label}] loaded ${path.basename(filePath)} (${count} vars)`
            )
        )
    }

    return merged
}

/**
 * Builds an ordered array of absolute `.env` file paths to load.
 *
 * Always starts with the root `.env`, then adds `.env.{env}` when an
 * environment name is supplied, then appends any extra file paths.
 */
export function resolveEnvFilePaths(
    env?: string,
    extraFiles?: string[]
): string[] {
    const cwd = process.cwd()
    const paths: string[] = [path.join(cwd, '.env')]

    if (env) {
        paths.push(path.join(cwd, `.env.${env}`))
    }

    if (extraFiles) {
        for (const f of extraFiles) {
            paths.push(path.isAbsolute(f) ? f : path.join(cwd, f))
        }
    }

    return paths
}
