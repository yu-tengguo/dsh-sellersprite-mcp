import { credentialRef } from "@deepseek-ai/dsh-credentials";
import * as McpClient from "@deepseek-ai/dsh-mcp-client";
import z from "@deepseek-ai/schemastery";
//#region src/index.ts
const name = "sellersprite-mcp";
const SELLERSPRITE_SETTINGS_NAMESPACE = "sellersprite-mcp";
const DEFAULT_MCP_URL = "https://mcp.sellersprite.com/mcp";
const DEFAULT_SERVER_NAME = "sellersprite";
const DEFAULT_SECRET_KEY_ENV = "SELLERSPRITE_SECRET_KEY";
const DEFAULT_TOOL_CALL_TIMEOUT_MS = 9e4;
const SERVER_NAME_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;
const CREDENTIAL_REF_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Schema shared by the Cordis loader and Settings -> Plugin configuration. */
const Config = z.object({
	enabled: z.boolean().default(true),
	url: z.string().default(DEFAULT_MCP_URL),
	serverName: z.string().pattern(SERVER_NAME_PATTERN).default(DEFAULT_SERVER_NAME),
	secretKeyEnv: z.string().pattern(CREDENTIAL_REF_PATTERN).role("credential-ref").default(DEFAULT_SECRET_KEY_ENV),
	toolCallTimeoutMs: z.number().step(1).min(1e3).max(6e5).default(DEFAULT_TOOL_CALL_TIMEOUT_MS),
	failOnStartupError: z.boolean().default(false)
});
/** Resolve defaults and constraints for programmatic callers and settings writes. */
function resolveConfig(input = {}) {
	const resolved = {
		enabled: input.enabled ?? true,
		url: (input.url ?? "https://mcp.sellersprite.com/mcp").trim(),
		serverName: (input.serverName ?? "sellersprite").trim(),
		secretKeyEnv: (input.secretKeyEnv ?? "SELLERSPRITE_SECRET_KEY").trim(),
		toolCallTimeoutMs: input.toolCallTimeoutMs ?? 9e4,
		failOnStartupError: input.failOnStartupError ?? false
	};
	let endpoint;
	try {
		endpoint = new URL(resolved.url);
	} catch {
		throw new Error("sellersprite-mcp: url must be an absolute HTTP(S) URL");
	}
	if (endpoint.protocol !== "http:" && endpoint.protocol !== "https:") throw new Error("sellersprite-mcp: url must use HTTP or HTTPS");
	if (!SERVER_NAME_PATTERN.test(resolved.serverName)) throw new Error("sellersprite-mcp: serverName must match [A-Za-z0-9_-]{1,32}");
	if (!CREDENTIAL_REF_PATTERN.test(resolved.secretKeyEnv)) throw new Error("sellersprite-mcp: secretKeyEnv must be a valid environment-variable name");
	if (!Number.isSafeInteger(resolved.toolCallTimeoutMs) || resolved.toolCallTimeoutMs < 1e3 || resolved.toolCallTimeoutMs > 6e5) throw new Error("sellersprite-mcp: toolCallTimeoutMs must be an integer between 1000 and 600000");
	return resolved;
}
async function resolveSecret(ctx, ref) {
	const credentials = ctx.get("credentials");
	if (credentials !== void 0) {
		const hit = await credentials.resolve(credentialRef(ref));
		if (hit?.value) return hit.value;
	}
	const ambient = process.env[ref];
	return ambient && ambient.length > 0 ? ambient : void 0;
}
/** Mount the configurable SellerSprite connection. */
function apply(ctx, entry = {}) {
	let current = () => entry;
	let child;
	let stopped = false;
	let generation = 0;
	let tail = Promise.resolve();
	const reconfigure = async (requestedGeneration) => {
		const previous = child;
		child = void 0;
		if (previous !== void 0) await previous.dispose();
		if (stopped || requestedGeneration !== generation) return;
		const active = resolveConfig(current());
		if (!active.enabled) {
			ctx.logger.info("sellersprite-mcp: disabled; MCP tools are not mounted");
			return;
		}
		const secret = await resolveSecret(ctx, active.secretKeyEnv);
		if (stopped || requestedGeneration !== generation) return;
		if (secret === void 0) {
			ctx.logger.warn(`sellersprite-mcp: credential ${active.secretKeyEnv} is not configured; waiting for Settings -> Plugins`);
			return;
		}
		const fiber = ctx.plugin(McpClient, {
			transport: "streamable-http",
			serverName: active.serverName,
			url: active.url,
			headers: { "secret-key": secret },
			toolCallTimeoutMs: active.toolCallTimeoutMs,
			failOnStartupError: active.failOnStartupError
		});
		child = fiber;
		try {
			await fiber;
			ctx.logger.info(`sellersprite-mcp: MCP client mounted as ${active.serverName}`);
		} catch (error) {
			if (child === fiber) child = void 0;
			await fiber.dispose();
			ctx.logger.error(`sellersprite-mcp: connection failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	};
	const scheduleReload = () => {
		const requestedGeneration = ++generation;
		tail = tail.then(() => reconfigure(requestedGeneration)).catch((error) => {
			ctx.logger.error(`sellersprite-mcp: reload failed: ${error instanceof Error ? error.message : String(error)}`);
		});
	};
	ctx.inject(["settings"], (settingsCtx) => {
		settingsCtx.settings.installSection(ctx, SELLERSPRITE_SETTINGS_NAMESPACE, Config, entry, {
			setSource: (source) => {
				current = source;
			},
			onChange: scheduleReload,
			validate: (value) => {
				resolveConfig(value);
			}
		});
	});
	ctx.on("credentials/reference-updated", (ref) => {
		if (String(ref) === resolveConfig(current()).secretKeyEnv) scheduleReload();
	});
	scheduleReload();
	ctx.effect(() => async () => {
		stopped = true;
		generation += 1;
		await tail;
		const active = child;
		child = void 0;
		await active?.dispose();
	}, "sellersprite-mcp: connection manager");
}
//#endregion
export { Config, DEFAULT_MCP_URL, DEFAULT_SECRET_KEY_ENV, DEFAULT_SERVER_NAME, DEFAULT_TOOL_CALL_TIMEOUT_MS, SELLERSPRITE_SETTINGS_NAMESPACE, apply, name, resolveConfig };

//# sourceMappingURL=index.js.map