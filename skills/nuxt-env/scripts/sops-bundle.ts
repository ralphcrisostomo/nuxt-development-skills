#!/usr/bin/env bun

import { promises as fs } from 'fs'
import * as path from 'path'

const DEFAULT_ENCRYPTED_PATH = 'secrets/env-bundle.sops.json'
const DEFAULT_DECRYPTED_PATH = '.tmp/env-bundle.json'

type Mode = 'decrypt' | 'encrypt'

function resolveDefaultKeyFile(): string {
    if (process.env.SOPS_AGE_KEY_FILE) return process.env.SOPS_AGE_KEY_FILE
    if (process.platform === 'win32') {
        const appData = process.env.APPDATA
        if (appData) return path.join(appData, 'sops', 'age', 'keys.txt')
    }
    const home = process.env.HOME
    if (!home) {
        throw new Error('Missing HOME; set SOPS_AGE_KEY_FILE explicitly.')
    }
    return path.join(home, '.config', 'sops', 'age', 'keys.txt')
}

async function ensureDirForFile(filePath: string) {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
}

async function runSops(args: string[], env: NodeJS.ProcessEnv) {
    const proc = Bun.spawn(['sops', ...args], {
        stdout: 'inherit',
        stderr: 'inherit',
        env,
    })
    const exitCode = await proc.exited
    if (exitCode !== 0) {
        throw new Error(`sops exited with code ${exitCode}`)
    }
}

function parseArgs(argv: string[]): {
    mode: Mode
    inFile: string
    outFile: string
} {
    const mode = argv[0] as Mode | undefined
    if (mode !== 'decrypt' && mode !== 'encrypt') {
        throw new Error('Usage: bun scripts/sops-bundle.ts <decrypt|encrypt>')
    }

    return {
        mode,
        inFile:
            mode === 'decrypt'
                ? DEFAULT_ENCRYPTED_PATH
                : DEFAULT_DECRYPTED_PATH,
        outFile:
            mode === 'decrypt'
                ? DEFAULT_DECRYPTED_PATH
                : DEFAULT_ENCRYPTED_PATH,
    }
}

async function main() {
    const { mode, inFile, outFile } = parseArgs(process.argv.slice(2))
    const keyFile = resolveDefaultKeyFile()

    await ensureDirForFile(outFile)
    const env = {
        ...process.env,
        SOPS_AGE_KEY_FILE: keyFile,
    }

    if (mode === 'decrypt') {
        await runSops(['-d', '--output', outFile, inFile], env)
        return
    }

    await ensureDirForFile(DEFAULT_ENCRYPTED_PATH)
    await runSops(
        [
            '-e',
            '--filename-override',
            DEFAULT_ENCRYPTED_PATH,
            '--output',
            outFile,
            inFile,
        ],
        env
    )
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : String(err))
    process.exit(1)
})
