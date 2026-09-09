/** Browser settings card for the SellerSprite MCP connection. */
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { SettingsScope, SettingsScopeSnapshot } from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type {} from '@deepseek-ai/dsh-client-ui-settings-plugins/client'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

const SETTINGS_NS = 'sellersprite-mcp'
const DEFAULT_URL = 'https://mcp.sellersprite.com/mcp'
const DEFAULT_SERVER_NAME = 'sellersprite'
const DEFAULT_SECRET_REF = 'SELLERSPRITE_SECRET_KEY'
const DEFAULT_TIMEOUT = 90_000
const CONFIG_FIELDS = ['enabled', 'url', 'serverName', 'secretKeyEnv', 'toolCallTimeoutMs', 'failOnStartupError'] as const

interface SettingsValue {
  enabled?: boolean
  url?: string
  serverName?: string
  secretKeyEnv?: string
  toolCallTimeoutMs?: number
  failOnStartupError?: boolean
}

interface Draft {
  enabled: boolean
  url: string
  serverName: string
  secretKeyEnv: string
  toolCallTimeoutMs: string
  failOnStartupError: boolean
}

interface CredentialView {
  configured?: boolean
  writable?: boolean
  source?: string
}

interface RemoteResult<T> {
  ok: boolean
  value?: T
  error?: { message?: string }
}

interface CredentialsRemote {
  describe(refs: string[]): Promise<RemoteResult<Record<string, CredentialView>>>
  set(ref: string, value: string): Promise<RemoteResult<unknown>>
  unset(ref: string): Promise<RemoteResult<unknown>>
}

interface CardFace {
  scope: SettingsScope<SettingsValue>
  credentials: CredentialsRemote
}

type SellerSpriteCardProps = PropsRuntime<'settings.plugin.item'> & InjectFace<CardFace>

export const inject = ['slots', 'settingsScope', 'remote', 'remote.credentials']

function draftOf(snapshot: SettingsScopeSnapshot<SettingsValue>): Draft {
  const value = snapshot.value ?? {}
  return {
    enabled: value.enabled ?? true,
    url: value.url ?? DEFAULT_URL,
    serverName: value.serverName ?? DEFAULT_SERVER_NAME,
    secretKeyEnv: value.secretKeyEnv ?? DEFAULT_SECRET_REF,
    toolCallTimeoutMs: String(value.toolCallTimeoutMs ?? DEFAULT_TIMEOUT),
    failOnStartupError: value.failOnStartupError ?? false,
  }
}

function messageOf(result: RemoteResult<unknown>, fallback: string): string {
  return result.error?.message ?? fallback
}

const styles = {
  card: { border: '1px solid var(--ds-border-color, rgba(127,127,127,.24))', borderRadius: 12, overflow: 'hidden', background: 'var(--ds-color-bg, transparent)' },
  header: { width: '100%', border: 0, background: 'transparent', color: 'inherit', padding: '16px 18px', textAlign: 'left' as const, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 },
  title: { margin: 0, fontSize: 15, fontWeight: 650 },
  description: { margin: '5px 0 0', opacity: .68, fontSize: 13, lineHeight: 1.5 },
  body: { borderTop: '1px solid var(--ds-border-color, rgba(127,127,127,.2))', padding: 18, display: 'grid', gap: 16 },
  field: { display: 'grid', gap: 6 },
  label: { fontSize: 13, fontWeight: 600 },
  hint: { fontSize: 12, opacity: .64, lineHeight: 1.45 },
  input: { boxSizing: 'border-box' as const, width: '100%', border: '1px solid var(--ds-border-color, rgba(127,127,127,.32))', borderRadius: 8, background: 'var(--ds-color-bg, transparent)', color: 'inherit', padding: '9px 11px', fontSize: 13, outline: 'none' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  actions: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' as const, gap: 8, paddingTop: 2 },
  button: { border: '1px solid var(--ds-border-color, rgba(127,127,127,.32))', borderRadius: 8, background: 'transparent', color: 'inherit', padding: '8px 12px', cursor: 'pointer' },
  primary: { border: 0, borderRadius: 8, background: 'var(--ds-color-primary, #4f6ef7)', color: '#fff', padding: '8px 14px', cursor: 'pointer' },
  status: { fontSize: 12, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, background: 'rgba(127,127,127,.1)' },
} as const

function Field(props: { label: string; hint: string; children: ReactNode }): JSX.Element {
  return <label style={styles.field}>
    <span style={styles.label}>{props.label}</span>
    {props.children}
    <span style={styles.hint}>{props.hint}</span>
  </label>
}

function SellerSpriteSettingsCard({ scope, credentials }: SellerSpriteCardProps): JSX.Element | null {
  const snapshot = useSyncExternalStore(
    (listener) => scope.subscribe(listener),
    () => scope.getSnapshot(),
    () => scope.getSnapshot(),
  )
  const initial = useMemo(() => draftOf(snapshot), [snapshot])
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<Draft>(initial)
  const [baseline, setBaseline] = useState<Draft>(initial)
  const [secret, setSecret] = useState('')
  const [credential, setCredential] = useState<CredentialView>({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline) || secret.length > 0
  useEffect(() => {
    if (dirty) return
    const next = draftOf(snapshot)
    setDraft(next)
    setBaseline(next)
  }, [snapshot, dirty])

  const refreshCredential = async (ref: string): Promise<void> => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
      setCredential({ configured: false, writable: false })
      return
    }
    const result = await credentials.describe([ref])
    if (result.ok) setCredential(result.value?.[ref] ?? { configured: false, writable: true })
  }

  useEffect(() => {
    let alive = true
    const ref = draft.secretKeyEnv
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
      setCredential({ configured: false, writable: false })
      return () => { alive = false }
    }
    void credentials.describe([ref]).then((result) => {
      if (alive && result.ok) setCredential(result.value?.[ref] ?? { configured: false, writable: true })
    })
    return () => { alive = false }
  }, [credentials, draft.secretKeyEnv])

  if (snapshot.status === 'unavailable') return null
  if (snapshot.status === 'loading') return <section style={styles.card}><div style={styles.body}>正在读取卖家精灵配置…</div></section>

  const update = <K extends keyof Draft>(field: K, value: Draft[K]): void => {
    setDraft((current) => ({ ...current, [field]: value }))
    setNotice('')
  }

  const validate = (): string | undefined => {
    try {
      const parsed = new URL(draft.url)
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'MCP 地址必须使用 HTTP 或 HTTPS。'
    } catch {
      return '请输入完整的 MCP 地址。'
    }
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(draft.serverName)) return '工具命名空间只能包含字母、数字、下划线或连字符，最长 32 位。'
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(draft.secretKeyEnv)) return '密钥引用必须是有效的环境变量名。'
    const timeout = Number(draft.toolCallTimeoutMs)
    if (!Number.isSafeInteger(timeout) || timeout < 1_000 || timeout > 600_000) return '调用超时必须是 1000–600000 之间的整数。'
    return undefined
  }

  const save = async (): Promise<void> => {
    const invalid = validate()
    if (invalid !== undefined) {
      setNotice(invalid)
      return
    }
    setSaving(true)
    setNotice('')
    try {
      const values: Record<(typeof CONFIG_FIELDS)[number], string | number | boolean> = {
        enabled: draft.enabled,
        url: draft.url.trim(),
        serverName: draft.serverName.trim(),
        secretKeyEnv: draft.secretKeyEnv.trim(),
        toolCallTimeoutMs: Number(draft.toolCallTimeoutMs),
        failOnStartupError: draft.failOnStartupError,
      }
      const ops = CONFIG_FIELDS.map((field) => ({ op: 'set' as const, path: [field], value: values[field] }))
      await scope.mutate(ops, snapshot.revision)
      if (secret.length > 0) {
        const result = await credentials.set(draft.secretKeyEnv.trim(), secret)
        if (!result.ok) throw new Error(messageOf(result, '密钥保存失败。'))
      }
      const accepted = draftOf(scope.getSnapshot())
      setDraft(accepted)
      setBaseline(accepted)
      setSecret('')
      await refreshCredential(accepted.secretKeyEnv)
      setNotice('已保存，MCP 连接正在刷新。')
    } catch (error) {
      setNotice(`保存失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const reset = async (): Promise<void> => {
    setSaving(true)
    setNotice('')
    try {
      await scope.mutate(CONFIG_FIELDS.map((field) => ({ op: 'unset' as const, path: [field] })), snapshot.revision)
      const accepted = draftOf(scope.getSnapshot())
      setDraft(accepted)
      setBaseline(accepted)
      setSecret('')
      setNotice('已恢复默认配置。密钥保持不变。')
    } catch (error) {
      setNotice(`恢复失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const clearSecret = async (): Promise<void> => {
    if (!window.confirm(`确定清除 ${draft.secretKeyEnv} 中保存的密钥吗？`)) return
    setSaving(true)
    try {
      const result = await credentials.unset(draft.secretKeyEnv)
      if (!result.ok) throw new Error(messageOf(result, '密钥清除失败。'))
      setSecret('')
      await refreshCredential(draft.secretKeyEnv)
      setNotice('密钥已清除，SellerSprite 工具将停止挂载。')
    } catch (error) {
      setNotice(`清除失败：${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || !snapshot.writable
  return <section style={styles.card} data-dsh-plugin="sellersprite-mcp">
    <button type="button" style={styles.header} onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      <span>
        <h3 style={styles.title}>卖家精灵 MCP</h3>
        <p style={styles.description}>配置 SellerSprite 地址、密钥与工具连接参数；保存后即时生效。</p>
      </span>
      <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
    </button>
    {expanded ? <div style={styles.body}>
      <label style={styles.row}>
        <span><strong>启用插件</strong><br /><span style={styles.hint}>关闭后移除全部 mcp__sellersprite__* 工具。</span></span>
        <input type="checkbox" checked={draft.enabled} disabled={disabled} onChange={(event) => update('enabled', event.target.checked)} />
      </label>
      <Field label="SellerSprite Secret Key" hint={`密钥只写入 DSH credentials 的 ${draft.secretKeyEnv} 引用，不会写入 settings.yaml 或回显。`}>
        <input style={styles.input} type="password" autoComplete="new-password" value={secret} disabled={saving || credential.writable === false} placeholder={credential.configured ? '已配置；留空保持不变' : '请输入卖家精灵密钥'} onChange={(event) => { setSecret(event.target.value); setNotice('') }} />
      </Field>
      <Field label="MCP 地址" hint="卖家精灵 Streamable HTTP MCP 服务地址。">
        <input style={styles.input} value={draft.url} disabled={disabled} onChange={(event) => update('url', event.target.value)} />
      </Field>
      <Field label="工具命名空间" hint="工具会显示为 mcp__命名空间__工具名；修改会改变所有工具名称。">
        <input style={styles.input} value={draft.serverName} disabled={disabled} onChange={(event) => update('serverName', event.target.value)} />
      </Field>
      <Field label="密钥引用" hint="DSH credentials 与环境变量使用的引用名称。">
        <input style={styles.input} value={draft.secretKeyEnv} disabled={disabled} onChange={(event) => update('secretKeyEnv', event.target.value)} />
      </Field>
      <Field label="调用超时（毫秒）" hint="单次 MCP 工具调用的最大等待时间，范围 1000–600000。">
        <input style={styles.input} inputMode="numeric" value={draft.toolCallTimeoutMs} disabled={disabled} onChange={(event) => update('toolCallTimeoutMs', event.target.value)} />
      </Field>
      <label style={styles.row}>
        <span><strong>启动连接失败时中止加载</strong><br /><span style={styles.hint}>通常保持关闭，让 DSH 正常启动并等待网络恢复。</span></span>
        <input type="checkbox" checked={draft.failOnStartupError} disabled={disabled} onChange={(event) => update('failOnStartupError', event.target.checked)} />
      </label>
      {!snapshot.writable ? <div style={styles.status}>当前设置存储为只读，无法保存修改。</div> : null}
      {notice ? <div style={styles.status} role="status">{notice}</div> : null}
      <div style={styles.actions}>
        {credential.configured ? <button type="button" style={styles.button} disabled={saving || credential.writable === false} onClick={() => { void clearSecret() }}>清除密钥</button> : null}
        <button type="button" style={styles.button} disabled={disabled} onClick={() => { void reset() }}>恢复默认</button>
        <button type="button" style={styles.button} disabled={!dirty || saving} onClick={() => { setDraft(baseline); setSecret(''); setNotice('') }}>放弃修改</button>
        <button type="button" style={styles.primary} disabled={!dirty || disabled} onClick={() => { void save() }}>{saving ? '保存中…' : '保存并刷新连接'}</button>
      </div>
    </div> : null}
  </section>
}

/** Register the keyed card consumed by the built-in Plugin configuration tab. */
export function apply(ctx: ClientContext): void {
  const scope = ctx.settingsScope.bind<SettingsValue>({ namespace: SETTINGS_NS })
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
    name: 'settings.plugin.item',
    key: SETTINGS_NS,
    inject: () => ({ scope, credentials: ctx.remote.credentials as CredentialsRemote }),
  }, SellerSpriteSettingsCard))
}
