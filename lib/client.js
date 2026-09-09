window.__ModuleLoader__.load({
	id: "dsh-sellersprite-mcp",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/index.tsx
		const SETTINGS_NS = "sellersprite-mcp";
		const DEFAULT_URL = "https://mcp.sellersprite.com/mcp";
		const DEFAULT_SERVER_NAME = "sellersprite";
		const DEFAULT_SECRET_REF = "SELLERSPRITE_SECRET_KEY";
		const DEFAULT_TIMEOUT = 9e4;
		const CONFIG_FIELDS = [
			"enabled",
			"url",
			"serverName",
			"secretKeyEnv",
			"toolCallTimeoutMs",
			"failOnStartupError"
		];
		const inject = [
			"slots",
			"settingsScope",
			"remote"
		];
		function draftOf(snapshot) {
			const value = snapshot.value ?? {};
			return {
				enabled: value.enabled ?? true,
				url: value.url ?? DEFAULT_URL,
				serverName: value.serverName ?? DEFAULT_SERVER_NAME,
				secretKeyEnv: value.secretKeyEnv ?? DEFAULT_SECRET_REF,
				toolCallTimeoutMs: String(value.toolCallTimeoutMs ?? DEFAULT_TIMEOUT),
				failOnStartupError: value.failOnStartupError ?? false
			};
		}
		function messageOf(result, fallback) {
			return result.error?.message ?? fallback;
		}
		const styles = {
			card: {
				border: "1px solid var(--ds-border-color, rgba(127,127,127,.24))",
				borderRadius: 12,
				overflow: "hidden",
				background: "var(--ds-color-bg, transparent)"
			},
			header: {
				width: "100%",
				border: 0,
				background: "transparent",
				color: "inherit",
				padding: "16px 18px",
				textAlign: "left",
				cursor: "pointer",
				display: "flex",
				justifyContent: "space-between",
				gap: 12
			},
			title: {
				margin: 0,
				fontSize: 15,
				fontWeight: 650
			},
			description: {
				margin: "5px 0 0",
				opacity: .68,
				fontSize: 13,
				lineHeight: 1.5
			},
			body: {
				borderTop: "1px solid var(--ds-border-color, rgba(127,127,127,.2))",
				padding: 18,
				display: "grid",
				gap: 16
			},
			field: {
				display: "grid",
				gap: 6
			},
			label: {
				fontSize: 13,
				fontWeight: 600
			},
			hint: {
				fontSize: 12,
				opacity: .64,
				lineHeight: 1.45
			},
			input: {
				boxSizing: "border-box",
				width: "100%",
				border: "1px solid var(--ds-border-color, rgba(127,127,127,.32))",
				borderRadius: 8,
				background: "var(--ds-color-bg, transparent)",
				color: "inherit",
				padding: "9px 11px",
				fontSize: 13,
				outline: "none"
			},
			row: {
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 16
			},
			actions: {
				display: "flex",
				justifyContent: "flex-end",
				flexWrap: "wrap",
				gap: 8,
				paddingTop: 2
			},
			button: {
				border: "1px solid var(--ds-border-color, rgba(127,127,127,.32))",
				borderRadius: 8,
				background: "transparent",
				color: "inherit",
				padding: "8px 12px",
				cursor: "pointer"
			},
			primary: {
				border: 0,
				borderRadius: 8,
				background: "var(--ds-color-primary, #4f6ef7)",
				color: "#fff",
				padding: "8px 14px",
				cursor: "pointer"
			},
			status: {
				fontSize: 12,
				lineHeight: 1.5,
				padding: "8px 10px",
				borderRadius: 8,
				background: "rgba(127,127,127,.1)"
			}
		};
		function Field(props) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
				style: styles.field,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles.label,
						children: props.label
					}),
					props.children,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						style: styles.hint,
						children: props.hint
					})
				]
			});
		}
		function SellerSpriteSettingsCard({ scope, credentials }) {
			const snapshot = (0, react.useSyncExternalStore)((listener) => scope.subscribe(listener), () => scope.getSnapshot(), () => scope.getSnapshot());
			const initial = (0, react.useMemo)(() => draftOf(snapshot), [snapshot]);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [draft, setDraft] = (0, react.useState)(initial);
			const [baseline, setBaseline] = (0, react.useState)(initial);
			const [secret, setSecret] = (0, react.useState)("");
			const [credential, setCredential] = (0, react.useState)(credentials === void 0 ? {
				configured: false,
				writable: false,
				source: "unavailable"
			} : {});
			const [saving, setSaving] = (0, react.useState)(false);
			const [notice, setNotice] = (0, react.useState)("");
			const dirty = JSON.stringify(draft) !== JSON.stringify(baseline) || secret.length > 0;
			(0, react.useEffect)(() => {
				if (dirty) return;
				const next = draftOf(snapshot);
				setDraft(next);
				setBaseline(next);
			}, [snapshot, dirty]);
			const refreshCredential = async (ref) => {
				if (credentials === void 0) {
					setCredential({
						configured: false,
						writable: false,
						source: "unavailable"
					});
					return;
				}
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
					setCredential({
						configured: false,
						writable: false
					});
					return;
				}
				const result = await credentials.describe([ref]);
				if (result.ok) setCredential(result.value?.[ref] ?? {
					configured: false,
					writable: true
				});
			};
			(0, react.useEffect)(() => {
				let alive = true;
				if (credentials === void 0) {
					setCredential({
						configured: false,
						writable: false,
						source: "unavailable"
					});
					return () => {
						alive = false;
					};
				}
				const ref = draft.secretKeyEnv;
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(ref)) {
					setCredential({
						configured: false,
						writable: false
					});
					return () => {
						alive = false;
					};
				}
				credentials.describe([ref]).then((result) => {
					if (alive && result.ok) setCredential(result.value?.[ref] ?? {
						configured: false,
						writable: true
					});
				});
				return () => {
					alive = false;
				};
			}, [credentials, draft.secretKeyEnv]);
			if (snapshot.status === "unavailable") return null;
			if (snapshot.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("section", {
				style: styles.card,
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					style: styles.body,
					children: "正在读取卖家精灵配置…"
				})
			});
			const update = (field, value) => {
				setDraft((current) => ({
					...current,
					[field]: value
				}));
				setNotice("");
			};
			const validate = () => {
				try {
					const parsed = new URL(draft.url);
					if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "MCP 地址必须使用 HTTP 或 HTTPS。";
				} catch {
					return "请输入完整的 MCP 地址。";
				}
				if (!/^[A-Za-z0-9_-]{1,32}$/.test(draft.serverName)) return "工具命名空间只能包含字母、数字、下划线或连字符，最长 32 位。";
				if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(draft.secretKeyEnv)) return "密钥引用必须是有效的环境变量名。";
				const timeout = Number(draft.toolCallTimeoutMs);
				if (!Number.isSafeInteger(timeout) || timeout < 1e3 || timeout > 6e5) return "调用超时必须是 1000–600000 之间的整数。";
			};
			const save = async () => {
				const invalid = validate();
				if (invalid !== void 0) {
					setNotice(invalid);
					return;
				}
				setSaving(true);
				setNotice("");
				try {
					const values = {
						enabled: draft.enabled,
						url: draft.url.trim(),
						serverName: draft.serverName.trim(),
						secretKeyEnv: draft.secretKeyEnv.trim(),
						toolCallTimeoutMs: Number(draft.toolCallTimeoutMs),
						failOnStartupError: draft.failOnStartupError
					};
					const ops = CONFIG_FIELDS.map((field) => ({
						op: "set",
						path: [field],
						value: values[field]
					}));
					await scope.mutate(ops, snapshot.revision);
					if (secret.length > 0) {
						if (credentials === void 0) throw new Error("当前 DSH 未提供凭据管理服务，请通过环境变量配置密钥。");
						const result = await credentials.set(draft.secretKeyEnv.trim(), secret);
						if (!result.ok) throw new Error(messageOf(result, "密钥保存失败。"));
					}
					const accepted = draftOf(scope.getSnapshot());
					setDraft(accepted);
					setBaseline(accepted);
					setSecret("");
					await refreshCredential(accepted.secretKeyEnv);
					setNotice("已保存，MCP 连接正在刷新。");
				} catch (error) {
					setNotice(`保存失败：${error instanceof Error ? error.message : String(error)}`);
				} finally {
					setSaving(false);
				}
			};
			const reset = async () => {
				setSaving(true);
				setNotice("");
				try {
					await scope.mutate(CONFIG_FIELDS.map((field) => ({
						op: "unset",
						path: [field]
					})), snapshot.revision);
					const accepted = draftOf(scope.getSnapshot());
					setDraft(accepted);
					setBaseline(accepted);
					setSecret("");
					setNotice("已恢复默认配置。密钥保持不变。");
				} catch (error) {
					setNotice(`恢复失败：${error instanceof Error ? error.message : String(error)}`);
				} finally {
					setSaving(false);
				}
			};
			const clearSecret = async () => {
				if (credentials === void 0) {
					setNotice("当前 DSH 未提供凭据管理服务，请在系统环境变量中清除密钥。");
					return;
				}
				if (!window.confirm(`确定清除 ${draft.secretKeyEnv} 中保存的密钥吗？`)) return;
				setSaving(true);
				try {
					const result = await credentials.unset(draft.secretKeyEnv);
					if (!result.ok) throw new Error(messageOf(result, "密钥清除失败。"));
					setSecret("");
					await refreshCredential(draft.secretKeyEnv);
					setNotice("密钥已清除，SellerSprite 工具将停止挂载。");
				} catch (error) {
					setNotice(`清除失败：${error instanceof Error ? error.message : String(error)}`);
				} finally {
					setSaving(false);
				}
			};
			const disabled = saving || !snapshot.writable;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
				style: styles.card,
				"data-dsh-plugin": "sellersprite-mcp",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					style: styles.header,
					onClick: () => setExpanded((value) => !value),
					"aria-expanded": expanded,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
						style: styles.title,
						children: "卖家精灵 MCP"
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						style: styles.description,
						children: "配置 SellerSprite 地址、密钥与工具连接参数；保存后即时生效。"
					})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						"aria-hidden": "true",
						children: expanded ? "⌃" : "⌄"
					})]
				}), expanded ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: styles.body,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							style: styles.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "启用插件" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles.hint,
									children: "关闭后移除全部 mcp__sellersprite__* 工具。"
								})
							] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.enabled,
								disabled,
								onChange: (event) => update("enabled", event.target.checked)
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: "SellerSprite Secret Key",
							hint: `密钥只写入 DSH credentials 的 ${draft.secretKeyEnv} 引用，不会写入 settings.yaml 或回显。`,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								type: "password",
								autoComplete: "new-password",
								value: secret,
								disabled: saving || credentials === void 0 || credential.writable === false,
								placeholder: credentials === void 0 ? "当前 DSH 不支持在界面中保存密钥" : credential.configured ? "已配置；留空保持不变" : "请输入卖家精灵密钥",
								onChange: (event) => {
									setSecret(event.target.value);
									setNotice("");
								}
							})
						}),
						credentials === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: styles.status,
							children: [
								"当前 DSH 未提供凭据管理服务。插件仍可正常加载；请将密钥写入 Windows 环境变量 ",
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: draft.secretKeyEnv }),
								"，然后重启 DSH。"
							]
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: "MCP 地址",
							hint: "卖家精灵 Streamable HTTP MCP 服务地址。",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								value: draft.url,
								disabled,
								onChange: (event) => update("url", event.target.value)
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: "工具命名空间",
							hint: "工具会显示为 mcp__命名空间__工具名；修改会改变所有工具名称。",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								value: draft.serverName,
								disabled,
								onChange: (event) => update("serverName", event.target.value)
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: "密钥引用",
							hint: "DSH credentials 与环境变量使用的引用名称。",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								value: draft.secretKeyEnv,
								disabled,
								onChange: (event) => update("secretKeyEnv", event.target.value)
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(Field, {
							label: "调用超时（毫秒）",
							hint: "单次 MCP 工具调用的最大等待时间，范围 1000–600000。",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								inputMode: "numeric",
								value: draft.toolCallTimeoutMs,
								disabled,
								onChange: (event) => update("toolCallTimeoutMs", event.target.value)
							})
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
							style: styles.row,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "启动连接失败时中止加载" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles.hint,
									children: "通常保持关闭，让 DSH 正常启动并等待网络恢复。"
								})
							] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: draft.failOnStartupError,
								disabled,
								onChange: (event) => update("failOnStartupError", event.target.checked)
							})]
						}),
						!snapshot.writable ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: styles.status,
							children: "当前设置存储为只读，无法保存修改。"
						}) : null,
						notice ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							style: styles.status,
							role: "status",
							children: notice
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: styles.actions,
							children: [
								credential.configured ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: styles.button,
									disabled: saving || credential.writable === false,
									onClick: () => {
										clearSecret();
									},
									children: "清除密钥"
								}) : null,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: styles.button,
									disabled,
									onClick: () => {
										reset();
									},
									children: "恢复默认"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: styles.button,
									disabled: !dirty || saving,
									onClick: () => {
										setDraft(baseline);
										setSecret("");
										setNotice("");
									},
									children: "放弃修改"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									style: styles.primary,
									disabled: !dirty || disabled,
									onClick: () => {
										save();
									},
									children: saving ? "保存中…" : "保存并刷新连接"
								})
							]
						})
					]
				}) : null]
			});
		}
		/** Register the keyed card consumed by the built-in Plugin configuration tab. */
		function apply(ctx) {
			const scope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
			ctx.slots.inject("settings.plugin.item", () => ctx.slots.register({
				name: "settings.plugin.item",
				key: SETTINGS_NS,
				inject: () => ({
					scope,
					credentials: ctx.get("remote.credentials")
				})
			}, SellerSpriteSettingsCard));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map