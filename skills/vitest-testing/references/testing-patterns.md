# Testing Patterns Reference

## mockNuxtImports Pattern

For any code that uses Nuxt auto-imports (composables, components using `useRuntimeConfig`, `useState`, etc.):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mockNuxtImports } from '../../helpers'  // adjust path

beforeEach(() => {
    mockNuxtImports()
    vi.useFakeTimers()  // only if testing timers/async delays
})

afterEach(() => {
    vi.useRealTimers()  // only if using fake timers
})
```

The `mockNuxtImports()` function (in `tests/helpers/nuxt-mocks.ts`) stubs: `useRuntimeConfig`, `useState`, `computed`, `ref`, `watch`, `onMounted`, `onUnmounted`, `navigateTo`.

To mock additional Nuxt auto-imports (e.g., `useRouter`, custom composables):

```ts
const mockPush = vi.fn()
beforeEach(() => {
    mockNuxtImports()
    vi.stubGlobal('useRouter', () => ({ push: mockPush }))
    vi.stubGlobal('useCommentDrawer', () => ({ openDrawer: vi.fn() }))
})
```

## AWS SDK Mock Template (DynamoDB)

```ts
const mockSend = vi.fn()

vi.mock('@aws-sdk/client-dynamodb', () => {
    class MockDynamoDBClient { _mock = true }
    return { DynamoDBClient: MockDynamoDBClient }
})

vi.mock('@aws-sdk/lib-dynamodb', () => {
    function makeCommand(type: string) {
        return class {
            _type = type
            _input: unknown
            constructor(input: unknown) { this._input = input }
        }
    }
    return {
        DynamoDBDocumentClient: { from: vi.fn(() => ({ send: mockSend })) },
        GetCommand: makeCommand('Get'),
        PutCommand: makeCommand('Put'),
        QueryCommand: makeCommand('Query'),
        UpdateCommand: makeCommand('Update'),
        DeleteCommand: makeCommand('Delete'),
        BatchWriteCommand: makeCommand('BatchWrite'),
        ScanCommand: makeCommand('Scan'),
    }
})

beforeEach(() => { mockSend.mockReset() })
```

## AWS SDK Mock Template (Cognito)

```ts
const mockSend = vi.fn()

vi.mock('@aws-sdk/client-cognito-identity-provider', () => {
    class MockClient { send = mockSend }
    function makeCommand(type: string) {
        return class {
            _type = type
            _input: unknown
            constructor(input: unknown) { this._input = input }
        }
    }
    return {
        CognitoIdentityProviderClient: MockClient,
        InitiateAuthCommand: makeCommand('InitiateAuth'),
        SignUpCommand: makeCommand('SignUp'),
        // ... add commands as needed
    }
})

beforeEach(() => { mockSend.mockReset() })
```

## AWS SDK Mock Template (S3, SES, Textract)

Same pattern — mock the client class and `send`:

```ts
const mockSend = vi.fn()

vi.mock('@aws-sdk/client-s3', () => {
    class MockS3Client { send = mockSend }
    function makeCommand(type: string) {
        return class { _type = type; _input: unknown; constructor(input: unknown) { this._input = input } }
    }
    return {
        S3Client: MockS3Client,
        PutObjectCommand: makeCommand('PutObject'),
        GetObjectCommand: makeCommand('GetObject'),
        DeleteObjectCommand: makeCommand('DeleteObject'),
    }
})
```

## Component DOM Test Template (happy-dom)

```ts
/** @vitest-environment happy-dom */
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
    it('renders expected content', () => {
        const wrapper = mount(MyComponent, {
            global: {
                stubs: {
                    // Stub Nuxt UI components
                    UBadge: {
                        template: '<span><slot />{{ $attrs.label }}</span>',
                        inheritAttrs: true,
                    },
                    UButton: {
                        template: '<button><slot /></button>',
                        inheritAttrs: true,
                    },
                },
            },
            props: { /* component props */ },
        })

        expect(wrapper.text()).toContain('Expected text')
    })
})
```

## Component Logic-Only Test Template

Prefer this over DOM tests — extract logic into testable functions:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImports } from '../../helpers'

// Extract or duplicate the logic from the component
function relativeTime(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    // ...
}

beforeEach(() => { mockNuxtImports() })

describe('relativeTime', () => {
    it('returns "just now" for recent timestamps', () => {
        expect(relativeTime(new Date().toISOString())).toBe('just now')
    })
})
```

## Lambda Handler Test Template

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSend = vi.fn()

vi.mock('@aws-sdk/client-dynamodb', () => ({
    DynamoDBClient: class MockDynamoDBClient {},
}))

vi.mock('@aws-sdk/lib-dynamodb', () => ({
    DynamoDBDocumentClient: { from: () => ({ send: mockSend }) },
    GetCommand: class { input: unknown; constructor(i: unknown) { this.input = i } },
    PutCommand: class { input: unknown; constructor(i: unknown) { this.input = i } },
    // ... add commands as needed
}))

// Set env vars BEFORE importing handler
process.env.TABLE_NAME = 'TestTable'

// Dynamic import after mocks
const { handler } = await import('../index')

function makeEvent(fieldName: string, args: Record<string, unknown> = {}) {
    return {
        arguments: args,
        identity: { sub: 'test-user', groups: ['Admin'] },
        info: { fieldName },
    }
}

describe('MyLambda', () => {
    beforeEach(() => {
        mockSend.mockReset()
        vi.spyOn(console, 'log').mockImplementation(() => {})
    })

    it('handles action correctly', async () => {
        mockSend.mockResolvedValueOnce({ Item: { id: '1' } })
        const result = await handler(makeEvent('myAction', { id: '1' }))
        expect(result.id).toBe('1')
    })
})
```

## Fake Timer Pattern

For composables or services with async delays:

```ts
beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
})

it('loads after delay', async () => {
    const { loadMore } = useInfiniteScroll({ items, pageSize: 10, loadDelay: 100 })
    loadMore()
    await vi.advanceTimersByTimeAsync(100)
    expect(visibleItems.value).toHaveLength(10)
})
```

## Pure Utility Test Template

```ts
import { describe, it, expect } from 'vitest'
import { myFunction } from '../../../app/utils/myFunction'

describe('myFunction', () => {
    it('returns expected output for valid input', () => {
        expect(myFunction('input')).toBe('expected')
    })

    it('handles edge cases', () => {
        expect(myFunction('')).toBe('')
    })
})
```
