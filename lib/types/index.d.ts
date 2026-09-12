/** SellerSprite MCP connection with a live DSH settings namespace. */
import type { Context } from '@deepseek-ai/cordis';
import type { SettingsNamespace } from '@deepseek-ai/dsh-settings';
import z from '@deepseek-ai/schemastery';
export declare const name = "sellersprite-mcp";
export declare const SELLERSPRITE_SETTINGS_NAMESPACE: SettingsNamespace;
export declare const DEFAULT_MCP_URL = "https://mcp.sellersprite.com/mcp";
export declare const DEFAULT_SERVER_NAME = "sellersprite";
export declare const DEFAULT_SECRET_KEY_ENV = "SELLERSPRITE_SECRET_KEY";
export declare const DEFAULT_TOOL_CALL_TIMEOUT_MS = 90000;
export interface Config {
    enabled?: boolean;
    url?: string;
    serverName?: string;
    secretKeyEnv?: string;
    toolCallTimeoutMs?: number;
    failOnStartupError?: boolean;
}
/** Schema shared by the Cordis loader and Settings -> Plugin configuration. */
export declare const Config: z<Config>;
export interface ResolvedConfig {
    enabled: boolean;
    url: string;
    serverName: string;
    secretKeyEnv: string;
    toolCallTimeoutMs: number;
    failOnStartupError: boolean;
}
/** Resolve defaults and constraints for programmatic callers and settings writes. */
export declare function resolveConfig(input?: Config): ResolvedConfig;
/** Mount the configurable SellerSprite connection. */
export declare function apply(ctx: Context, entry?: Config): void;
//# sourceMappingURL=index.d.ts.map