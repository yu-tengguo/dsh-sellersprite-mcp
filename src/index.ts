/** SellerSprite MCP connection with a live DSH settings namespace. */
import type { Context, Fiber } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type {} from '@deepseek-ai/dsh-credentials'
import * as McpClient from '@deepseek-ai/dsh-mcp-client'
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-settings'
import z from 'schemastery'

export const name = 'sellersprite-mcp'
export const SELLERSPRITE_SETTINGS_NAMESPACE = 'sellersprite-mcp' as SettingsNamespace
export const DEFAULT_MCP_URL = 'https://mcp.sellersprite.com/mcp'
export const DEFAULT_SERVER_NAME = 'sellersprite'
export const DEFAULT_SECRET_KEY_ENV = 'SELLERSPRITE_SECRET_KEY'
export const DEFAULT_TOOL_CALL_TIMEOUT_MS = 90_000

const SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/
const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export interface Config {
  enabled?: boolean
  url?: string
  serverName?: string
  secretKeyEnv?: string
  toolCallTimeoutMs?: number
  failOnStartupError?: boolean
}

/** Schema shared by the Cordis loader and Settings -> Plugin configuration. */
export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  url: z.string().default(DEFAULT_MCP_URL),
  serverName: z.string().pattern(SERVER_NAME_PATTERN).default(DEFAULT_SERVER_NAME),
  secretKeyEnv: z.string().pattern(CREDENTIAL_REF_PATTERN).role('credential-ref').default(DEFAULT_SECRET_KEY_ENV),
  toolCallTimeoutMs: z.number().step(1).min(1_000).max(600_000).default(DEFAULT_TOOL_CALL_TIMEOUT_MS),
  failOnStartupError: z.boolean().default(false),
})

export interface ResolvedConfig {
  enabled: boolean
  url: string
  serverName: string
  secretKeyEnv: string
  toolCallTimeoutMs: number
  failOnStartupError: boolean
}

/** Resolve defaults and constraints for programmatic callers and settings writes. */
export function resolveConfig(input: Config = {}): ResolvedConfig {
  const resolved: ResolvedConfig = {
    enabled: input.enabled ?? true,
    url: (input.url ?? DEFAULT_MCP_URL).trim(),
    serverName: (input.serverName ?? DEFAULT_SERVER_NAME).trim(),
    secretKeyEnv: (input.secretKeyEnv ?? DEFAULT_SECRET_KEY_ENV).trim(),
    toolCallTimeoutMs: input.toolCallTimeoutMs ?? DEFAULT_TOOL_CALL_TIMEOUT_MS,
    failOnStartupError: input.failOnStartupError ?? false,
  }
  let endpoint: URL
  try {
    endpoint = new URL(resolved.url)
  } catch {
    throw new Error('sellersprite-mcp: url must be an absolute HTTP(S) URL')
  }
  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    throw new Error('sellersprite-mcp: url must use HTTP or HTTPS')
  }
  if (!SERVER_NAME_PATTERN.test(resolved.serverName)) {
    throw new Error('sellersprite-mcp: serverName must match [A-Za-z0-9_-]{1,32}')
  }
  if (!CREDENTIAL_REF_PATTERN.test(resolved.secretKeyEnv)) {
    throw new Error('sellersprite-mcp: secretKeyEnv must be a valid environment-variable name')
  }
  if (!Number.isSafeInteger(resolved.toolCallTimeoutMs) || resolved.toolCallTimeoutMs < 1_000 || resolved.toolCallTimeoutMs > 600_000) {
    throw new Error('sellersprite-mcp: toolCallTimeoutMs must be an integer between 1000 and 600000')
  }
  return resolved
}

async function resolveSecret(ctx: Context, ref: string): Promise<string | undefined> {
  const credentials = ctx.get('credentials')
  if (credentials !== undefined) {
    const hit = await credentials.resolve(credentialRef(ref))
    if (hit?.value) return hit.value
  }
  const ambient = process.env[ref]
  return ambient && ambient.length > 0 ? ambient : undefined
}

/** Mount the configurable SellerSprite connection. */
export function apply(ctx: Context, entry: Config = {}): void {
  let current: () => Config = () => entry
  let child: Fiber | undefined
  let stopped = false
  let generation = 0
  let tail: Promise<void> = Promise.resolve()

  const reconfigure = async (requestedGeneration: number): Promise<void> => {
    const previous = child
    child = undefined
    if (previous !== undefined) await previous.dispose()
    if (stopped || requestedGeneration !== generation) return

    const active = resolveConfig(current())
    if (!active.enabled) {
      ctx.logger.info('sellersprite-mcp: disabled; MCP tools are not mounted')
      return
    }

    const secret = await resolveSecret(ctx, active.secretKeyEnv)
    if (stopped || requestedGeneration !== generation) return
    if (secret === undefined) {
      ctx.logger.warn(`sellersprite-mcp: credential ${active.secretKeyEnv} is not configured; waiting for Settings -> Plugins`)
      return
    }

    const fiber = ctx.plugin(McpClient, {
      transport: 'streamable-http',
      serverName: active.serverName,
      url: active.url,
      headers: { 'secret-key': secret },
      toolCallTimeoutMs: active.toolCallTimeoutMs,
      failOnStartupError: active.failOnStartupError,
    })
    child = fiber
    try {
      await fiber
      ctx.logger.info(`sellersprite-mcp: MCP client mounted as ${active.serverName}`)
    } catch (error) {
      if (child === fiber) child = undefined
      await fiber.dispose()
      ctx.logger.error(`sellersprite-mcp: connection failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const scheduleReload = (): void => {
    const requestedGeneration = ++generation
    tail = tail.then(() => reconfigure(requestedGeneration)).catch((error: unknown) => {
      ctx.logger.error(`sellersprite-mcp: reload failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }

  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, SELLERSPRITE_SETTINGS_NAMESPACE, Config, entry, {
      setSource: (source) => {
        current = source
      },
      onChange: scheduleReload,
      validate: (value) => {
        resolveConfig(value)
      },
    })
  })

  ctx.on('credentials/reference-updated', (ref) => {
    if (String(ref) === resolveConfig(current()).secretKeyEnv) scheduleReload()
  })

  scheduleReload()
  ctx.effect(() => async () => {
    stopped = true
    generation += 1
    await tail
    const active = child
    child = undefined
    await active?.dispose()
  }, 'sellersprite-mcp: connection manager')
}
