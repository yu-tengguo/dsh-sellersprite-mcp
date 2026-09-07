# dsh-sellersprite-mcp

卖家精灵（SellerSprite）MCP 的 DSH 插件（bundle）。在任何一台安装了 DSH（`dsh web`）的电脑上装好它，
AI 代理就会拥有 45+ 个 Amazon 数据工具，命名形如：

- `mcp__sellersprite__asin_detail` — ASIN 详情（BSR、上架时间、A+…）
- `mcp__sellersprite__product_research` — 多维条件选品
- `mcp__sellersprite__competitor_lookup` / `asin_competitor` — 竞品数据
- `mcp__sellersprite__asin_sales_trend` / `asin_prediction` / `keepa_info` — 销量/预测/Keepa 趋势
- `mcp__sellersprite__keyword_miner` / `keyword_research` / `traffic_keyword` — 关键词
- `mcp__sellersprite__review` / `market_research` / `trademark_*` 等

服务端：`https://mcp.sellersprite.com/mcp`（streamable HTTP，请求头 `secret-key`）。
底层桥接由 DSH 自带的 `@deepseek-ai/dsh-mcp-client` 完成，本包只是一个配置 bundle——无代码、无额外依赖。

---

## 在其他电脑上的安装步骤（每台机器一次）

### 1. 拷贝插件文件夹

把整个 `dsh-sellersprite-mcp` 文件夹复制到目标机器任意位置（例如 `D:\dsh-plugins\dsh-sellersprite-mcp`）。
文件夹内只需保留 `package.json` 和 `cordis.patch.yml` 即可（README 可留可删）。

### 2. 用 dsh CLI 安装进 web profile

在目标机器打开 PowerShell / 终端，执行：

```powershell
dsh plugin --profile web add "D:\dsh-plugins\dsh-sellersprite-mcp"
```

成功后会看到 pnpm 完成安装，且 `dsh.profile.bundles` 自动加入 `dsh-sellersprite-mcp`。
（`dsh plugin` 会在 profile 目录执行 pnpm，并把声明了 `dsh.bundle` 的包自动纳入 bundles 层。）

### 3. 配置密钥（不要写进任何 YAML / 仓库）

任选其一：

- 用户级环境变量（PowerShell 一次性设置，之后重启 `dsh web` 生效）：
  ```powershell
  setx SELLERSPRITE_SECRET_KEY "你的密钥"
  ```
- 或写入 `$DSH_HOME\.env`（默认 `C:\Users\<你>\.dsh\.env`），dsh 启动时自动加载：
  ```
  SELLERSPRITE_SECRET_KEY=你的密钥
  ```

密钥在 [open.sellersprite.com](https://open.sellersprite.com) 登录 →「我的密钥」获取（MCP 为付费套餐，
Basic ¥990/年起、4000 次/月）。

### 4. 重启并验证

完全退出并重新启动 `dsh web`，然后新建一个会话问一句：

> 列出你当前能用的所有工具，是否有 mcp__sellersprite__ 开头的工具？

应看到 45 个工具（如 `mcp__sellersprite__asin_detail`）。直接说需求即可触发，例如：

> 用 mcp__sellersprite__asin_detail 分析 B0XXXXXXX（US 站）

---

## 卸载

```powershell
dsh plugin --profile web remove dsh-sellersprite-mcp
```

---

## 故障排查

| 现象 | 原因与处理 |
|---|---|
| 看到 `mcp__sellersprite__secret_invalid` 工具 | 密钥缺失或不合法：检查第 3 步环境变量是否生效（重启 GUI / 重开终端后再试）；密钥在平台「我的密钥」复制，确认无空格 |
| 没有 mcp__sellersprite__* 工具 | bundle 未激活：确认第 2 步输出、`dsh --profile web --dump-config` 里能看到 `mcp-sellersprite` 行；重启 GUI |
| 工具存在但调用报错/超时 | 套餐次数耗尽或限速（Basic 40 次/分钟）；或网络无法直连 `mcp.sellersprite.com` |
| dsh web 日志提示 mcp-client 重连 | 服务器短暂不可达，桥会自动重连并保留已注册工具 |

## 备注

- 工具命名空间 `sellersprite` 唯一性：若同一 profile 里再插一个同 serverName 的实例会失败（保留 `sellersprite` 即可）。
- 每次工具调用消耗套餐配额（Basic 4000 次/月、40 次/分钟限速）。
- 本包与 CLI 的 `@deepseek-ai/dsh-mcp-client` 版本自动匹配（经 `$DSH_HOME/profiles/node_modules` 模块 fallback），无需手动安装 npm 依赖、无需联网下载。
