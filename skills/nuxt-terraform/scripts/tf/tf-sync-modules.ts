// Sync terraform modules from source to project
// Usage: bun scripts/tf/tf-sync-modules.ts [--check] [--force]
import {
    existsSync,
    mkdirSync,
    readFileSync,
    writeFileSync,
    readdirSync,
    copyFileSync,
} from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const SOURCE_DIR = 'terraform-modules'
const TARGET_DIR = 'terraform/modules'
const MANIFEST_FILE = path.join(TARGET_DIR, '.terraform-scaffold-version')

interface ModuleManifest {
    version: string
    checksums: Record<string, string>
}

const checkOnly = process.argv.includes('--check')
const force = process.argv.includes('--force')

// --- Helpers ---

function hashFile(filePath: string): string {
    const content = readFileSync(filePath)
    return createHash('sha256').update(content).digest('hex')
}

function collectFiles(dir: string, base = ''): string[] {
    const files: string[] = []
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const rel = base ? `${base}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            files.push(...collectFiles(path.join(dir, entry.name), rel))
        } else {
            files.push(rel)
        }
    }
    return files.sort()
}

function buildChecksums(dir: string): Record<string, string> {
    const files = collectFiles(dir)
    const checksums: Record<string, string> = {}
    for (const file of files) {
        checksums[file] = hashFile(path.join(dir, file))
    }
    return checksums
}

function readManifest(): ModuleManifest | null {
    if (!existsSync(MANIFEST_FILE)) return null
    try {
        return JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')) as ModuleManifest
    } catch {
        return null
    }
}

function writeManifest(
    version: string,
    checksums: Record<string, string>
): void {
    const manifest: ModuleManifest = { version, checksums }
    writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + '\n')
}

function copyDir(src: string, dest: string): void {
    mkdirSync(dest, { recursive: true })
    for (const entry of readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath)
        } else {
            copyFileSync(srcPath, destPath)
        }
    }
}

// --- Main ---

if (!existsSync(SOURCE_DIR)) {
    console.error(`Source modules directory not found: ${SOURCE_DIR}`)
    console.error('Make sure terraform-modules/ exists in the project root.')
    process.exit(1)
}

const sourceModules = readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort()

console.log(`\nSync Terraform Modules — ${sourceModules.length} modules\n`)

const sourceChecksums = buildChecksums(SOURCE_DIR)
const manifest = readManifest()

if (!existsSync(TARGET_DIR)) {
    if (checkOnly) {
        console.log('Target directory does not exist. Modules need syncing.')
        process.exit(1)
    }
    copyDir(SOURCE_DIR, TARGET_DIR)
    writeManifest('1.0.0', sourceChecksums)
    console.log(`  Copied ${sourceModules.length} modules to ${TARGET_DIR}/\n`)
    process.exit(0)
}

// Compare checksums to detect drift
const targetChecksums = buildChecksums(TARGET_DIR)
const locallyModified: string[] = []
const needsUpdate: string[] = []
const newFiles: string[] = []

for (const [file, sourceHash] of Object.entries(sourceChecksums)) {
    const targetHash = targetChecksums[file]
    if (!targetHash) {
        newFiles.push(file)
    } else if (targetHash !== sourceHash) {
        if (
            manifest?.checksums[file] &&
            manifest.checksums[file] !== targetHash
        ) {
            locallyModified.push(file)
        } else {
            needsUpdate.push(file)
        }
    }
}

if (
    locallyModified.length === 0 &&
    needsUpdate.length === 0 &&
    newFiles.length === 0
) {
    console.log('  All modules are up to date.\n')
    process.exit(0)
}

if (checkOnly) {
    if (newFiles.length > 0) {
        console.log(`  New files: ${newFiles.length}`)
        newFiles.forEach((f) => console.log(`    + ${f}`))
    }
    if (needsUpdate.length > 0) {
        console.log(`  Needs update: ${needsUpdate.length}`)
        needsUpdate.forEach((f) => console.log(`    ~ ${f}`))
    }
    if (locallyModified.length > 0) {
        console.log(`  Locally modified: ${locallyModified.length}`)
        locallyModified.forEach((f) => console.log(`    ! ${f}`))
    }
    console.log('')
    process.exit(1)
}

if (locallyModified.length > 0 && !force) {
    console.log(`  ${locallyModified.length} file(s) have local modifications:`)
    locallyModified.forEach((f) => console.log(`    ! ${f}`))
    console.log('\n  Use --force to overwrite local modifications.')
    process.exit(1)
}

// Perform sync
let copied = 0

for (const file of [...newFiles, ...needsUpdate]) {
    const destPath = path.join(TARGET_DIR, file)
    mkdirSync(path.dirname(destPath), { recursive: true })
    copyFileSync(path.join(SOURCE_DIR, file), destPath)
    copied++
}

if (force && locallyModified.length > 0) {
    for (const file of locallyModified) {
        const destPath = path.join(TARGET_DIR, file)
        mkdirSync(path.dirname(destPath), { recursive: true })
        copyFileSync(path.join(SOURCE_DIR, file), destPath)
        copied++
    }
    console.log(
        `  Overwrote ${locallyModified.length} locally modified file(s)`
    )
}

const finalChecksums = buildChecksums(TARGET_DIR)
writeManifest('1.0.0', finalChecksums)

if (newFiles.length > 0) console.log(`  Added ${newFiles.length} new file(s)`)
if (needsUpdate.length > 0)
    console.log(`  Updated ${needsUpdate.length} file(s)`)
console.log(`  Synced ${copied} file(s) total\n`)
