import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
const SETTINGS_NS = 'sellersprite-mcp';
const DEFAULT_URL = 'https://mcp.sellersprite.com/mcp';
const DEFAULT_SERVER_NAME = 'sellersprite';
const DEFAULT_SECRET_REF = 'SELLERSPRITE_SECRET_KEY';
const DEFAULT_TIMEOUT = 90_000;
const CONFIG_FIELDS = ['enabled', 'url', 'serverName', 'secretKeyEnv', 'toolCallTimeoutMs', 'failOnStartupError'];
// `remote.credentials` is not present in every DSH host/profile. Requiring the
// nested service here leaves the whole client plugin pending and blocks web
// boot. The card treats it as an optional capability instead.
export const inject = ['slots', 'settingsScope', 'remote'];
function draftOf(snapshot) {
    const value = snapshot.value ?? {};
    return {
        enabled: value.enabled ?? true,
        url: value.url ?? DEFAULT_URL,
        serverName: value.serverName ?? DEFAULT_SERVER_NAME,
        secretKeyEnv: value.secretKeyEnv ?? DEFAULT_SECRET_REF,
        toolCallTimeoutMs: String(value.toolCallTimeoutMs ?? DEFAULT_TIMEOUT),
        failOnStartupError: value.failOnStartupError ?? false,
    };
}
function messageOf(result, fallback) {
    return result.error?.message ?? fallback;
}
const styles = {
    card: { border: '1px solid var(--ds-border-color, rgba(127,127,127,.24))', borderRadius: 12, overflow: 'hidden', background: 'var(--ds-color-bg, transparent)' },
    header: { width: '100%', border: 0, background: 'transparent', color: 'inherit', padding: '16px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 12 },
    title: { margin: 0, fontSize: 15, fontWeight: 650 },
    description: { margin: '5px 0 0', opacity: .68, fontSize: 13, lineHeight: 1.5 },
    body: { borderTop: '1px solid var(--ds-border-color, rgba(127,127,127,.2))', padding: 18, display: 'grid', gap: 16 },
    field: { display: 'grid', gap: 6 },
    label: { fontSize: 13, fontWeight: 600 },
    hint: { fontSize: 12, opacity: .64, lineHeight: 1.45 },
    input: { boxSizing: 'border-box', width: '100%', border: '1px solid var(--ds-border-color, rgba(127,127,127,.32))', borderRadius: 8, background: 'var(--ds-color-bg, transparent)', color: 'inherit', padding: '9px 11px', fontSize: 13, outline: 'none' },
    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
    actions: { display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, paddingTop: 2 },
    button: { border: '1px solid var(--ds-border-color, rgba(127,127,127,.32))', borderRadius: 8, background: 'transparent', color: 'inherit', padding: '8px 12px', cursor: 'pointer' },
    primary: { border: 0, borderRadius: 8, background: 'var(--ds-color-primary, #4f6ef7)', color: '#fff', padding: '8px 14px', cursor: 'pointer' },
    status: { fontSize: 12, lineHeight: 1.5, padding: '8px 10px', borderRadius: 8, background: 'rgba(127,127,127,.1)' },
};
function Field(props) {
    return _jsxs("label", { style: styles.field, children: [_jsx("span", { style: styles.label, children: props.label }), props.children, _jsx("span", { style: styles.hint, children: props.hint })] });
}
function SellerSpriteSettingsCard({ scope, credentials }) {
    const snapshot = useSyncExternalStore((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
    const initial = useMemo(() => draftOf(snapshot), [snapshot]);
    const [expanded, setExpanded] = useState(false);
    const [draft, setDraft] = useState(initial);
    const [baseline, setBaseline] = useState(initial);
    const [secret, setSecret] = useState('');
    const [credential, setCredential] = useState(credentials === undefined
        ? { configured: false, writable: false, source: 'unavailable' }
        : {});
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const dirty = JSON.stringify(draft) !== JSON.stringify(baseline) || secret.length > 0;
    useEffect(() => {
        if (dirty)
            return;
        const next = draftOf(snapshot);
        setDraft(next);
        setBaseline(next);
    }, [snapshot, dirty]);
    const refreshCredential = async (ref) => {
        if (credentials === undefined) {
            setCredential({ configured: false, writable: false, source: 'unavailable' });
            return;
        }
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
            setCredential({ configured: false, writable: false });
            return;
        }
        const result = await credentials.describe([ref]);
        if (result.ok)
            setCredential(result.value?.[ref] ?? { configured: false, writable: true });
    };
    useEffect(() => {
        let alive = true;
        if (credentials === undefined) {
            setCredential({ configured: false, writable: false, source: 'unavailable' });
            return () => { alive = false; };
        }
        const ref = draft.secretKeyEnv;
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
            setCredential({ configured: false, writable: false });
            return () => { alive = false; };
        }
        void credentials.describe([ref]).then((result) => {
            if (alive && result.ok)
                setCredential(result.value?.[ref] ?? { configured: false, writable: true });
        });
        return () => { alive = false; };
    }, [credentials, draft.secretKeyEnv]);
    if (snapshot.status === 'unavailable')
        return null;
    if (snapshot.status === 'loading')
        return _jsx("section", { style: styles.card, children: _jsx("div", { style: styles.body, children: "\u6B63\u5728\u8BFB\u53D6\u5356\u5BB6\u7CBE\u7075\u914D\u7F6E\u2026" }) });
    const update = (field, value) => {
        setDraft((current) => ({ ...current, [field]: value }));
        setNotice('');
    };
    const validate = () => {
        try {
            const parsed = new URL(draft.url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
                return 'MCP 地址必须使用 HTTP 或 HTTPS。';
        }
        catch {
            return '请输入完整的 MCP 地址。';
        }
        if (!/^[A-Za-z0-9_-]{1,32}$/.test(draft.serverName))
            return '工具命名空间只能包含字母、数字、下划线或连字符，最长 32 位。';
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(draft.secretKeyEnv))
            return '密钥引用必须是有效的环境变量名。';
        const timeout = Number(draft.toolCallTimeoutMs);
        if (!Number.isSafeInteger(timeout) || timeout < 1_000 || timeout > 600_000)
            return '调用超时必须是 1000–600000 之间的整数。';
        return undefined;
    };
    const save = async () => {
        const invalid = validate();
        if (invalid !== undefined) {
            setNotice(invalid);
            return;
        }
        setSaving(true);
        setNotice('');
        try {
            const values = {
                enabled: draft.enabled,
                url: draft.url.trim(),
                serverName: draft.serverName.trim(),
                secretKeyEnv: draft.secretKeyEnv.trim(),
                toolCallTimeoutMs: Number(draft.toolCallTimeoutMs),
                failOnStartupError: draft.failOnStartupError,
            };
            const ops = CONFIG_FIELDS.map((field) => ({ op: 'set', path: [field], value: values[field] }));
            await scope.mutate(ops, snapshot.revision);
            if (secret.length > 0) {
                if (credentials === undefined)
                    throw new Error('当前 DSH 未提供凭据管理服务，请通过环境变量配置密钥。');
                const result = await credentials.set(draft.secretKeyEnv.trim(), secret);
                if (!result.ok)
                    throw new Error(messageOf(result, '密钥保存失败。'));
            }
            const accepted = draftOf(scope.getSnapshot());
            setDraft(accepted);
            setBaseline(accepted);
            setSecret('');
            await refreshCredential(accepted.secretKeyEnv);
            setNotice('已保存，MCP 连接正在刷新。');
        }
        catch (error) {
            setNotice(`保存失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSaving(false);
        }
    };
    const reset = async () => {
        setSaving(true);
        setNotice('');
        try {
            await scope.mutate(CONFIG_FIELDS.map((field) => ({ op: 'unset', path: [field] })), snapshot.revision);
            const accepted = draftOf(scope.getSnapshot());
            setDraft(accepted);
            setBaseline(accepted);
            setSecret('');
            setNotice('已恢复默认配置。密钥保持不变。');
        }
        catch (error) {
            setNotice(`恢复失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSaving(false);
        }
    };
    const clearSecret = async () => {
        if (credentials === undefined) {
            setNotice('当前 DSH 未提供凭据管理服务，请在系统环境变量中清除密钥。');
            return;
        }
        if (!window.confirm(`确定清除 ${draft.secretKeyEnv} 中保存的密钥吗？`))
            return;
        setSaving(true);
        try {
            const result = await credentials.unset(draft.secretKeyEnv);
            if (!result.ok)
                throw new Error(messageOf(result, '密钥清除失败。'));
            setSecret('');
            await refreshCredential(draft.secretKeyEnv);
            setNotice('密钥已清除，SellerSprite 工具将停止挂载。');
        }
        catch (error) {
            setNotice(`清除失败：${error instanceof Error ? error.message : String(error)}`);
        }
        finally {
            setSaving(false);
        }
    };
    const disabled = saving || !snapshot.writable;
    return _jsxs("section", { style: styles.card, "data-dsh-plugin": "sellersprite-mcp", children: [_jsxs("button", { type: "button", style: styles.header, onClick: () => setExpanded((value) => !value), "aria-expanded": expanded, children: [_jsxs("span", { children: [_jsx("h3", { style: styles.title, children: "\u5356\u5BB6\u7CBE\u7075 MCP" }), _jsx("p", { style: styles.description, children: "\u914D\u7F6E SellerSprite \u5730\u5740\u3001\u5BC6\u94A5\u4E0E\u5DE5\u5177\u8FDE\u63A5\u53C2\u6570\uFF1B\u4FDD\u5B58\u540E\u5373\u65F6\u751F\u6548\u3002" })] }), _jsx("span", { "aria-hidden": "true", children: expanded ? '⌃' : '⌄' })] }), expanded ? _jsxs("div", { style: styles.body, children: [_jsxs("label", { style: styles.row, children: [_jsxs("span", { children: [_jsx("strong", { children: "\u542F\u7528\u63D2\u4EF6" }), _jsx("br", {}), _jsx("span", { style: styles.hint, children: "\u5173\u95ED\u540E\u79FB\u9664\u5168\u90E8 mcp__sellersprite__* \u5DE5\u5177\u3002" })] }), _jsx("input", { type: "checkbox", checked: draft.enabled, disabled: disabled, onChange: (event) => update('enabled', event.target.checked) })] }), _jsx(Field, { label: "SellerSprite Secret Key", hint: `密钥只写入 DSH credentials 的 ${draft.secretKeyEnv} 引用，不会写入 settings.yaml 或回显。`, children: _jsx("input", { style: styles.input, type: "password", autoComplete: "new-password", value: secret, disabled: saving || credentials === undefined || credential.writable === false, placeholder: credentials === undefined ? '当前 DSH 不支持在界面中保存密钥' : credential.configured ? '已配置；留空保持不变' : '请输入卖家精灵密钥', onChange: (event) => { setSecret(event.target.value); setNotice(''); } }) }), credentials === undefined ? _jsxs("div", { style: styles.status, children: ["\u5F53\u524D DSH \u672A\u63D0\u4F9B\u51ED\u636E\u7BA1\u7406\u670D\u52A1\u3002\u63D2\u4EF6\u4ECD\u53EF\u6B63\u5E38\u52A0\u8F7D\uFF1B\u8BF7\u5C06\u5BC6\u94A5\u5199\u5165 Windows \u73AF\u5883\u53D8\u91CF ", _jsx("code", { children: draft.secretKeyEnv }), "\uFF0C\u7136\u540E\u91CD\u542F DSH\u3002"] }) : null, _jsx(Field, { label: "MCP \u5730\u5740", hint: "\u5356\u5BB6\u7CBE\u7075 Streamable HTTP MCP \u670D\u52A1\u5730\u5740\u3002", children: _jsx("input", { style: styles.input, value: draft.url, disabled: disabled, onChange: (event) => update('url', event.target.value) }) }), _jsx(Field, { label: "\u5DE5\u5177\u547D\u540D\u7A7A\u95F4", hint: "\u5DE5\u5177\u4F1A\u663E\u793A\u4E3A mcp__\u547D\u540D\u7A7A\u95F4__\u5DE5\u5177\u540D\uFF1B\u4FEE\u6539\u4F1A\u6539\u53D8\u6240\u6709\u5DE5\u5177\u540D\u79F0\u3002", children: _jsx("input", { style: styles.input, value: draft.serverName, disabled: disabled, onChange: (event) => update('serverName', event.target.value) }) }), _jsx(Field, { label: "\u5BC6\u94A5\u5F15\u7528", hint: "DSH credentials \u4E0E\u73AF\u5883\u53D8\u91CF\u4F7F\u7528\u7684\u5F15\u7528\u540D\u79F0\u3002", children: _jsx("input", { style: styles.input, value: draft.secretKeyEnv, disabled: disabled, onChange: (event) => update('secretKeyEnv', event.target.value) }) }), _jsx(Field, { label: "\u8C03\u7528\u8D85\u65F6\uFF08\u6BEB\u79D2\uFF09", hint: "\u5355\u6B21 MCP \u5DE5\u5177\u8C03\u7528\u7684\u6700\u5927\u7B49\u5F85\u65F6\u95F4\uFF0C\u8303\u56F4 1000\u2013600000\u3002", children: _jsx("input", { style: styles.input, inputMode: "numeric", value: draft.toolCallTimeoutMs, disabled: disabled, onChange: (event) => update('toolCallTimeoutMs', event.target.value) }) }), _jsxs("label", { style: styles.row, children: [_jsxs("span", { children: [_jsx("strong", { children: "\u542F\u52A8\u8FDE\u63A5\u5931\u8D25\u65F6\u4E2D\u6B62\u52A0\u8F7D" }), _jsx("br", {}), _jsx("span", { style: styles.hint, children: "\u901A\u5E38\u4FDD\u6301\u5173\u95ED\uFF0C\u8BA9 DSH \u6B63\u5E38\u542F\u52A8\u5E76\u7B49\u5F85\u7F51\u7EDC\u6062\u590D\u3002" })] }), _jsx("input", { type: "checkbox", checked: draft.failOnStartupError, disabled: disabled, onChange: (event) => update('failOnStartupError', event.target.checked) })] }), !snapshot.writable ? _jsx("div", { style: styles.status, children: "\u5F53\u524D\u8BBE\u7F6E\u5B58\u50A8\u4E3A\u53EA\u8BFB\uFF0C\u65E0\u6CD5\u4FDD\u5B58\u4FEE\u6539\u3002" }) : null, notice ? _jsx("div", { style: styles.status, role: "status", children: notice }) : null, _jsxs("div", { style: styles.actions, children: [credential.configured ? _jsx("button", { type: "button", style: styles.button, disabled: saving || credential.writable === false, onClick: () => { void clearSecret(); }, children: "\u6E05\u9664\u5BC6\u94A5" }) : null, _jsx("button", { type: "button", style: styles.button, disabled: disabled, onClick: () => { void reset(); }, children: "\u6062\u590D\u9ED8\u8BA4" }), _jsx("button", { type: "button", style: styles.button, disabled: !dirty || saving, onClick: () => { setDraft(baseline); setSecret(''); setNotice(''); }, children: "\u653E\u5F03\u4FEE\u6539" }), _jsx("button", { type: "button", style: styles.primary, disabled: !dirty || disabled, onClick: () => { void save(); }, children: saving ? '保存中…' : '保存并刷新连接' })] })] }) : null] });
}
/** Register the keyed card consumed by the built-in Plugin configuration tab. */
export function apply(ctx) {
    const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
    ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({
        name: 'settings.plugin.item',
        key: SETTINGS_NS,
        inject: () => ({ scope, credentials: ctx.get('remote.credentials') }),
    }, SellerSpriteSettingsCard));
}
