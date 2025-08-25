# 加盐Base64编码解码工具

部署在 Cloudflare Workers 上的编码解码工具，使用服务端加盐加密（AES-GCM + PBKDF2 + HMAC）。

## 主要功能

- **服务端加密**：采用 AES-GCM + PBKDF2（100,000 迭代）+ HMAC 进行安全编码和解码。
- **编码**：输入文本（最大 10,000 字符），生成 iframe 代码，自动复制到剪贴板。
- **解码**：通过 iframe 解码显示内容，支持复制结果不跳转。
- **国际化**：支持中英文界面切换。

## 部署到 Cloudflare Workers

### 前提条件
- Cloudflare 账号
- 安装 [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)：
  ```bash
  npm install -g wrangler
  ```

### 部署步骤

1. **初始化项目**
   ```bash
   mkdir base64-encoder-decoder
   cd base64-encoder-decoder
   wrangler init --yes
   ```

2. **替换 Worker 代码**
   将 `worker.js` 替换为本项目代码。

3. **配置 wrangler.toml**
   ```toml
   name = "base64-encoder-decoder"
   compatibility_date = "2025-08-25"
   account_id = "你的Cloudflare账号ID"
   workers_dev = true

   [vars]
   # 环境变量通过 wrangler secret put 配置
   ```

4. **生成盐值**
   ```bash
   openssl rand -base64 32
   ```

5. **设置环境变量**
   ```bash
   wrangler secret put ENV_BASE_DOMAIN --value "你的域名"
   wrangler secret put ENV_SECURITY_SALT --value "$(openssl rand -base64 32)"
   ```
   示例：
   ```bash
   wrangler secret put ENV_BASE_DOMAIN --value "https://your-domain.workers.dev"
   wrangler secret put ENV_SECURITY_SALT --value "$(openssl rand -base64 32)"
   ```

6. **部署**
   ```bash
   wrangler deploy
   ```

> **⚠️ 安全警告**：生产环境必须设置随机 `ENV_SECURITY_SALT`（32 字节以上）和正确的 `ENV_BASE_DOMAIN`。更改盐值会导致旧数据无法解码。