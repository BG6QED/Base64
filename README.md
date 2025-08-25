# 加盐 Base64 编码解码工具

部署在 Cloudflare Workers 上的编码解码工具，使用服务端加盐加密（AES-GCM + PBKDF2 + HMAC）。

## 主要功能



*   **服务端加密**：采用 AES-GCM + PBKDF2（100,000 迭代）+ HMAC 进行安全编码和解码。

*   **编码**：输入文本（最大 10,000 字符），一键生成 iframe 代码，自动复制到剪贴板。

*   **解码**：通过 iframe 解码显示内容，支持复制结果。

*   **国际化**：支持中英文界面切换。

## 部署到 Cloudflare Workers

### 前提条件



*   Cloudflare 账号

*   浏览器访问 [Cloudflare Workers 控制台](https://dash.cloudflare.com/?to=/:account/workers)

### 快速部署（推荐）



**创建新 Worker**

*   登录 Cloudflare 控制台，进入 Workers 页面

*   点击 "创建服务"，输入服务名称（如 `base64-encoder-decoder`）

*   选择 "Hello World" 模板，点击 "创建服务"

**编辑代码**

*   在服务详情页，点击 "快速编辑"

*   删除默认代码，粘贴本项目的 `worker.js` 完整代码

*   点击 "保存并部署"

**设置环境变量**

*   返回服务详情页，点击 "设置" 标签

*   选择 "变量" 选项卡，在 "环境变量" 部分点击 "添加变量"

*   添加以下变量（均设为加密）：


    *   名称：`ENV_BASE_DOMAIN`，值：你的 Worker 域名（如 `https://your-service-name.your-account.workers.dev`）

    *   名称：`ENV_SECURITY_SALT`，值：随机盐值（可通过 `openssl rand -base64 32` 生成）

### 命令行部署（适合开发）

如果需要本地开发或版本控制，可以使用 Wrangler CLI：



**安装 Wrangler CLI**



```
npm install -g wrangler
```



**初始化并部署**



```
# 登录Cloudflare账号

wrangler login

# 克隆或创建项目

mkdir base64-encoder-decoder

cd base64-encoder-decoder

# 复制worker.js到项目目录

# 部署

wrangler deploy worker.js --name base64-encoder-decoder

# 设置环境变量

wrangler secret put ENV\_BASE\_DOMAIN

wrangler secret put ENV\_SECURITY\_SALT
```

> **⚠️ 安全警告**
>
> 生产环境必须设置随机 `ENV_SECURITY_SALT`（32 字节以上）和正确的`ENV_BASE_DOMAIN`。更改盐值会导致旧数据无法解码。

> **提示**
>
> 部署后可在 Workers 控制台的 "设置" 标签中绑定自定义域名。
