# Config File Contents

All config files to scaffold for a new Nuxt 4 project.

## `prettier.config.js`

```js
export default {
    trailingComma: 'es5',
    tabWidth: 4,
    semi: false,
    singleQuote: true,
    bracketSpacing: true,
    bracketSameLine: false,
    arrowParens: 'always',
    vueIndentScriptAndStyle: false,
    singleAttributePerLine: true,
    endOfLine: 'crlf',

    // Pug-specific config
    plugins: ['@prettier/plugin-pug', 'prettier-plugin-terraform-formatter'],
    pugFramework: 'vue',
    pugSortAttributes: 'asc',
    pugWrapAttributesThreshold: 1,
    pugClassNotation: 'attribute',
    pugIdNotation: 'literal',
    pugAttributeSeparator: 'always',

    pugSingleQuote: false,
    pugPrintWidth: 100,
}
```

## `.prettierignore`

```
node_modules
*.log*
.nuxt
.nitro
.cache
.output
.env
.agents
.claude
.githooks
dist
jsons/**/*
public/**/*
ios
android
terraform/lambda/src/
pnpm-lock.yaml
```

## `.gitignore`

```
# Nuxt dev/build outputs
.output
.data
.nuxt
.nitro
.cache
dist

# Node dependencies
node_modules

# Logs
logs
*.log

# Misc
.DS_Store
.fleet
.idea

# Local env files
.env
.env.*
!.env.example

# Local scratch
.tmp/

# Claude Code
.claude/worktrees/

# Terraform local artifacts
**/.terraform/*
*.tfstate
*.tfstate.*
*.tfplan
terraform/envs/*/terraform.tfvars
*.tsbuildinfo
```

## `eslint.config.ts`

```ts
import withNuxt from './.nuxt/eslint.config.mjs'
// @ts-expect-error: module uses export = syntax
import prettierConfig from 'eslint-config-prettier'

export default withNuxt(
    {
        name: 'project/ignores',
        ignores: [
            '.agents/**',
            '**/.agents/**',
            '.claude/**',
            '**/.claude/**',
            '.nuxt/**',
            '**/.nuxt/**',
            '.output/**',
            '**/.output/**',
            'node_modules/**',
            '**/node_modules/**',
            'vendor/**',
            '**/vendor/**',
            'terraform/functions/**',
        ],
    },
    {
        name: 'project/rules',
        languageOptions: {
            parserOptions: {
                templateTokenizer: {
                    pug: 'vue-eslint-parser-template-tokenizer-pug',
                },
            },
        },
        rules: {
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    varsIgnorePattern: '^(_|on[A-Z].*|props|emit)$',
                    argsIgnorePattern: '^_',
                },
            ],
            'vue/max-attributes-per-line': 'off',
            'vue/attributes-order': 'off',
            'vue/html-quotes': 'off',
            'vue/multiline-html-element-content-newline': 'off',
            'vue/singleline-html-element-content-newline': 'off',
            'vue/html-self-closing': 'off',
            'func-style': ['error', 'declaration'],
        },
    },
    prettierConfig
)
```

## `vitest.config.ts`

```ts
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
    },
    resolve: {
        conditions: ['vitest'],
        alias: {
            '~~': resolve(__dirname),
            '~': resolve(__dirname, 'app'),
        },
    },
})
```

## `tsconfig.json`

```json
{
    "files": [],
    "references": [
        { "path": "./.nuxt/tsconfig.app.json" },
        { "path": "./.nuxt/tsconfig.server.json" },
        { "path": "./.nuxt/tsconfig.shared.json" },
        { "path": "./.nuxt/tsconfig.node.json" }
    ]
}
```

## `.husky/pre-commit`

```sh
bunx lint-staged
```

## `.husky/pre-push`

```sh
bun run lint
bun run test
```

## `.sops.yaml`

```yaml
# Replace placeholder recipients with real age public keys (age1...)
creation_rules:
    - path_regex: ^(.+[\\/])?secrets[\\/].*\.sops\.json$
      age: >-
          age1REPLACE_WITH_YOUR_AGE_PUBLIC_KEY
    - path_regex: ^(.+[\\/])?secrets[\\/]env-bundle\.sops\.json$
      age: >-
          age1REPLACE_WITH_YOUR_AGE_PUBLIC_KEY
```
