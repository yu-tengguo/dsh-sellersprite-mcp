# dsh-sellersprite-mcp

卖家精灵（SellerSprite）MCP 的可配置 DSH Web 插件。安装后可在「设置 → 插件 → 插件配置 → 卖家精灵 MCP」中填写密钥和连接信息，保存后即时重建 MCP 连接，无需重启 DSH。

连接成功后，AI 代理会拥有 45+ 个 Amazon 数据工具，命名形如：

- `mcp__sellersprite__asin_detail` — ASIN 详情（BSR、上架时间、A+…）
- `mcp__sellersprite__product_research` — 多维条件选品
- `mcp__sellersprite__competitor_lookup` / `asin_competitor` — 竞品数据
- `mcp__sellersprite__asin_sales_trend` / `asin_prediction` / `keepa_info` — 销量/预测/Keepa 趋势
- `mcp__sellersprite__keyword_miner` / `keyword_research` / `traffic_keyword` — 关键词
- `mcp__sellersprite__review` / `market_research` / `trademark_*` 等

默认服务端：`https://mcp.sellersprite.com/mcp`（Streamable HTTP，请求头 `secret-key`）。底层桥接由 DSH 自带的 `@deepseek-ai/dsh-mcp-client` 完成。

## 功能

- 在 DSH「插件配置」中编辑启用状态、MCP 地址、工具命名空间、密钥引用、调用超时和启动失败策略。
- 密钥通过 DSH credentials 单独保存，只以 `SELLERSPRITE_SECRET_KEY` 引用出现在设置中，不写入 `settings.yaml`，也不会由设置接口回显。
- 保存配置或轮换密钥后自动卸载旧连接并挂载新连接。
- 没有密钥时 DSH 仍能正常启动；插件等待用户完成配置，不注册无效工具。

---

## 在其他电脑上的安装步骤（每台机器一次）

### 1. 拷贝或克隆插件文件夹

把整个 `dsh-sellersprite-mcp` 文件夹复制到目标机器任意位置（例如 `D:\dsh-plugins\dsh-sellersprite-mcp`）。发布包必须包含 `lib/`、`package.json` 和 `cordis.patch.yml`。

### 2. 用 dsh CLI 安装进 web profile

在目标机器打开 PowerShell / 终端，执行：

```powershell
dsh plugin --profile web add "D:\dsh-plugins\dsh-sellersprite-mcp"
```

成功后会看到 pnpm 完成安装，且 `dsh.profile.bundles` 自动加入 `dsh-sellersprite-mcp`。
（`dsh plugin` 会在 profile 目录执行 pnpm，并把声明了 `dsh.bundle` 的包自动纳入 bundles 层。）

### 3. 在插件配置中填写密钥

启动 `dsh web`，打开「设置 → 插件 → 插件配置」，展开「卖家精灵 MCP」：

1. 在 `SellerSprite Secret Key` 中输入密钥。
2. 保持默认 MCP 地址和 `sellersprite` 工具命名空间，除非你使用代理或私有网关。
3. 点击「保存并刷新连接」。

密钥在 [open.sellersprite.com](https://open.sellersprite.com) 登录后从「我的密钥」获取。

也兼容旧安装方式：可以继续使用 `SELLERSPRITE_SECRET_KEY` 环境变量或 `$DSH_HOME/.env`。环境提供的密钥会被 credentials 服务视为只读，若要在 UI 中轮换，请先移除环境变量并重启 DSH。

### 4. 验证工具

保存后新建一个会话问一句：

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
| 配置卡显示密钥未配置 | 在卡片中填写密钥并保存；若密钥来自环境变量，卡片会显示为已配置但只读 |
| 没有 `mcp__sellersprite__*` 工具 | 检查插件是否启用、密钥是否已配置；确认 `dsh --profile web --dump-config` 中存在 `sellersprite-mcp` 行 |
| 工具存在但调用报错/超时 | 套餐次数耗尽或限速（Basic 40 次/分钟）；或网络无法直连 `mcp.sellersprite.com` |
| dsh web 日志提示 mcp-client 重连 | 服务器短暂不可达，桥会自动重连并保留已注册工具 |

## 备注

- 工具命名空间 `sellersprite` 必须唯一；修改它会改变所有工具名称，已有会话和权限规则不会自动迁移。
- 每次工具调用消耗套餐配额（Basic 4000 次/月、40 次/分钟限速）。

## 开发

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
```

仓库提交 `lib/` 构建产物，以便 DSH 从本地目录安装后直接加载 Host 和 Web 两侧插件。
