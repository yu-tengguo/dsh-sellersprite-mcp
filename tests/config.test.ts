import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MCP_URL,
  DEFAULT_SECRET_KEY_ENV,
  DEFAULT_SERVER_NAME,
  DEFAULT_TOOL_CALL_TIMEOUT_MS,
  resolveConfig,
} from '../src/index.ts'

describe('resolveConfig', () => {
  it('supplies SellerSprite defaults', () => {
    expect(resolveConfig()).toEqual({
      enabled: true,
      url: DEFAULT_MCP_URL,
      serverName: DEFAULT_SERVER_NAME,
      secretKeyEnv: DEFAULT_SECRET_KEY_ENV,
      toolCallTimeoutMs: DEFAULT_TOOL_CALL_TIMEOUT_MS,
      failOnStartupError: false,
    })
  })

  it('accepts a valid custom MCP connection', () => {
    expect(resolveConfig({
      enabled: false,
      url: 'http://127.0.0.1:3000/mcp',
      serverName: 'seller_test',
      secretKeyEnv: 'MY_SELLER_KEY',
      toolCallTimeoutMs: 12_345,
      failOnStartupError: true,
    })).toMatchObject({
      enabled: false,
      url: 'http://127.0.0.1:3000/mcp',
      serverName: 'seller_test',
      secretKeyEnv: 'MY_SELLER_KEY',
      toolCallTimeoutMs: 12_345,
      failOnStartupError: true,
    })
  })

  it.each([
    [{ url: 'not-a-url' }, 'absolute HTTP(S)'],
    [{ url: 'file:///tmp/mcp' }, 'HTTP or HTTPS'],
    [{ serverName: 'bad namespace' }, 'serverName'],
    [{ secretKeyEnv: 'bad-ref' }, 'secretKeyEnv'],
    [{ toolCallTimeoutMs: 999 }, 'toolCallTimeoutMs'],
    [{ toolCallTimeoutMs: 1_001.5 }, 'toolCallTimeoutMs'],
  ] as const)('rejects invalid configuration %#', (input, message) => {
    expect(() => resolveConfig(input)).toThrow(message)
  })
})
