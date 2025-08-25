addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// 国际化配置
const i18n = {
    zh: {
        title: "信息解码", placeholder: "请点击下方按钮解码", decodeBtn: "解码",
        copyBtn: "复制结果", hint: "点击按钮解码内容", resultHint: "点击按钮复制或手动选中复制",
        copySuccess: "✅ 复制成功", copyFailed: "复制失败，请手动复制",
        errorNoData: "未获取到可解码的信息", errorInvalid: "输入不是有效的编码",
        errorFail: "解码失败，请检查编码格式或密钥", errorSaltMismatch: "盐值不匹配，无法解码",
        errorIntegrityFailed: "数据完整性验证失败，可能被篡改", errorCryptoNotSupported: "浏览器不支持加密功能，请使用现代浏览器",
        errorInvalidInput: "输入无效，请检查文本", errorServer: "服务器错误，请稍后重试",
        errorKeyDerivation: "密钥生成失败，请检查环境配置", errorHmacFailed: "数据签名失败，请检查环境",
        jsDisabledAlert: "检测到JavaScript已禁用，请手动选中内容，按Ctrl+C复制",
        jsDisabledHint: "请手动选中内容，按Ctrl+C（或Cmd+C）复制",
        homeTitle: "编码工具", encodeBtn: "编码并生成iframe", clearBtn: "清空",
        encodeInputHint: "输入需要编码的文本...", resultSeparator: "生成的iframe代码",
        noContentToCopy: "没有可复制的内容", noContentForIframe: "没有可生成iframe的内容",
        iframeSuccess: "✅ iframe代码已复制", iframeFailed: "❌ 生成iframe代码失败",
        encoding: "编码中..."
    },
    en: {
        title: "Info Decoder", placeholder: "Click button to decode", decodeBtn: "Decode",
        copyBtn: "Copy Result", hint: "Click to decode content", resultHint: "Click to copy or select text manually",
        copySuccess: "✅ Copied successfully", copyFailed: "Copy failed, please copy manually",
        errorNoData: "No decodable information found", errorInvalid: "Input is not valid encoded data",
        errorFail: "Decoding failed, check format or key", errorSaltMismatch: "Salt mismatch, cannot decode",
        errorIntegrityFailed: "Data integrity check failed, may have been tampered with", errorCryptoNotSupported: "Browser does not support crypto functions, please use a modern browser",
        errorInvalidInput: "Invalid input, please check the text", errorServer: "Server error, please try again later",
        errorKeyDerivation: "Key derivation failed, please check environment configuration", errorHmacFailed: "Data signing failed, please check environment",
        jsDisabledAlert: "JavaScript is disabled. Please select the content and press Ctrl+C to copy",
        jsDisabledHint: "Please select content and press Ctrl+C (or Cmd+C) to copy",
        homeTitle: "Encoding Tool", encodeBtn: "Encode & Generate iframe", clearBtn: "Clear",
        encodeInputHint: "Enter text to encode...", resultSeparator: "Generated iframe code",
        noContentToCopy: "No content to copy", noContentForIframe: "No content to generate iframe",
        iframeSuccess: "✅ iframe code copied", iframeFailed: "❌ Failed to generate iframe code",
        encoding: "Encoding..."
    }
};

// 公共样式
const commonStyles = `
    :root {
        --bg: #f3f4f6; --card: #ffffff; --text: #111827; --border: #e5e7eb;
        --primary: #2563eb; --success: #10b981; --danger: #ef4444; --hint: #6b7280;
        --js-disabled-bg: #fff3cd; --js-disabled-text: #856404;
    }
    @media (prefers-color-scheme: dark) {
        :root {
            --bg: #303030; --card: #404040; --text: #f0f0f0; --border: #505050;
            --primary: #60a5fa; --success: #34d399; --danger: #f87171; --hint: #b0b0b0;
            --js-disabled-bg: #5c4b1e; --js-disabled-text: #f8e9a1;
        }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    body { padding: 10px; background: var(--bg); color: var(--text); min-height: 100vh; }
    .container { margin: 20px auto; background: var(--card); padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); position: relative; }
    .title { color: var(--primary); font-weight: 600; text-align: center; margin-bottom: 20px; }
    .lang-switch { position: absolute; right: 20px; top: 20px; background: var(--primary); color: white; border: none; padding: 4px 8px; cursor: pointer; font-size: 14px; text-decoration: none; }
    .action-btn { width: 100%; padding: 10px 0; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 15px; font-weight: 500; margin-bottom: 12px; }
    .action-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .encode-btn, .decode-btn { background: var(--primary); }
    .copy-btn, .clear-btn { background: var(--success); }
    .clear-btn { background: var(--danger); }
    .status { text-align: center; font-size: 14px; margin: 8px 0; height: 20px; }
    .status.success { color: var(--success); }
    .status.error { color: var(--danger); }
    .hint { text-align: center; font-size: 12px; color: var(--hint); }
    textarea { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 16px; font-size: 14px; background: transparent; color: inherit; white-space: pre-wrap; word-break: break-all; resize: none; }
`;

// 公共复制逻辑
const copyScript = `
    function copyToClipboard(text, statusEl, t) {
        const updateStatus = (msg, isSuccess) => {
            statusEl.textContent = msg;
            statusEl.className = \`status \${isSuccess ? 'success' : 'error'}\`;
        };
        try {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => updateStatus(t.copySuccess, true))
                    .catch(() => fallbackCopy(text, statusEl, t));
            } else {
                fallbackCopy(text, statusEl, t);
            }
        } catch {
            updateStatus(t.copyFailed, false);
        }
    }
    function fallbackCopy(text, statusEl, t) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            const success = document.execCommand('copy');
            statusEl.textContent = success ? t.copySuccess : t.copyFailed;
            statusEl.className = success ? 'status success' : 'status error';
        } catch {
            statusEl.textContent = t.copyFailed;
            statusEl.className = 'status error';
        } finally {
            document.body.removeChild(textarea);
        }
    }
`;

const getOriginFromRequest = request => {
    const url = new URL(request.url);
    return typeof ENV_BASE_DOMAIN !== 'undefined' && ENV_BASE_DOMAIN
        ? ENV_BASE_DOMAIN
        : `${url.protocol}//${url.host}`;
};

const extractDomain = origin => {
    try {
        return new URL(origin).hostname;
    } catch {
        return '';
    }
};

// 工具函数 - 获取盐值
const salt = typeof ENV_SECURITY_SALT !== 'undefined' && ENV_SECURITY_SALT
    ? ENV_SECURITY_SALT
    : 'development_only_default_salt_should_be_changed';
const getSalt = () => salt;

const isCryptoSupported = () => typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';

// 通用 PBKDF2 密钥派生函数
const deriveKey = async (saltBytes, keyUsage, algorithm) => {
    try {
        const keyMaterial = await crypto.subtle.importKey(
            'raw', saltBytes, { name: 'PBKDF2' }, false, ['deriveKey']
        );
        const derivedKeyAlgorithm = { name: algorithm, length: 256 };
        if (algorithm === 'HMAC') {
            derivedKeyAlgorithm.hash = 'SHA-256';
        }
        return crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: saltBytes, iterations: 100000, hash: 'SHA-256' },
            keyMaterial,
            derivedKeyAlgorithm,
            false,
            keyUsage
        );
    } catch {
        throw new Error('key_derivation_failed');
    }
};

// 编码实现（AES-GCM + HMAC）
const encodeWithAdvancedSalt = async data => {
    if (!isCryptoSupported()) {
        return null;
    }
    try {
        if (typeof data !== 'string' || data.trim() === '' || data.length > 10000) {
            return null;
        }
        const salt = getSalt();
        if (!salt || typeof salt !== 'string') {
            return null;
        }
        const encoder = new TextEncoder();
        const [dataBytes, saltBytes] = [encoder.encode(data), encoder.encode(salt)];
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encryptionKey = await deriveKey(saltBytes, ['encrypt'], 'AES-GCM');
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, dataBytes);
        const hmacKey = await deriveKey(saltBytes, ['sign'], 'HMAC');
        const hmac = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, encrypted);
        const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted), ...new Uint8Array(hmac)]);
        return btoa(String.fromCharCode(...combined))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch {
        return null;
    }
};

// 解码实现（AES-GCM + HMAC）
const decodeWithAdvancedSalt = async encodedData => {
    if (!isCryptoSupported()) {
        return { success: false, message: 'crypto_not_supported' };
    }
    try {
        if (!encodedData || typeof encodedData !== 'string') {
            return { success: false, message: 'no_data' };
        }
        const salt = getSalt();
        if (!salt || typeof salt !== 'string') {
            return { success: false, message: 'salt_mismatch' };
        }
        const encoder = new TextEncoder();
        const saltBytes = encoder.encode(salt);
        let decodedB64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        decodedB64 += '='.repeat((4 - (decodedB64.length % 4)) % 4);
        let binaryString;
        try {
            binaryString = atob(decodedB64);
        } catch {
            return { success: false, message: 'invalid_format' };
        }
        const combined = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) combined[i] = binaryString.charCodeAt(i);
        if (combined.length < 48) {
            return { success: false, message: 'invalid_format' };
        }
        const [iv, encrypted, hmac] = [
            combined.slice(0, 16),
            combined.slice(16, -32),
            combined.slice(-32)
        ];
        const hmacKey = await deriveKey(saltBytes, ['verify'], 'HMAC');
        if (!await crypto.subtle.verify({ name: 'HMAC' }, hmacKey, hmac, encrypted)) {
            return { success: false, message: 'integrity_failed' };
        }
        const encryptionKey = await deriveKey(saltBytes, ['decrypt'], 'AES-GCM');
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKey, encrypted);
        return { success: true, message: new TextDecoder().decode(decrypted) };
    } catch {
        return { success: false, message: 'decoding_failed' };
    }
};

// HTML 转义函数
const escapeHtml = unsafe => {
    if (!unsafe) return '';
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return unsafe.replace(/[&<>"']/g, c => escapeMap[c] || c);
};

// 处理编码 API 请求
const handleEncodeRequest = async request => {
    try {
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), {
                status: 405, headers: { 'Content-Type': 'application/json' }
            });
        }
        const contentType = request.headers.get('Content-Type');
        if (!contentType?.includes('application/json')) {
            return new Response(JSON.stringify({ success: false, error: 'invalid_content_type' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }
        const { data } = await request.json();
        if (typeof data !== 'string' || data.trim() === '' || data.length > 10000) {
            return new Response(JSON.stringify({ success: false, error: 'invalid_input' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }
        const encodedData = await encodeWithAdvancedSalt(data);
        if (!encodedData) {
            return new Response(JSON.stringify({ success: false, error: 'encoding_failed' }), {
                status: 500, headers: { 'Content-Type': 'application/json' }
            });
        }
        const baseOrigin = getOriginFromRequest(request);
        const requestOrigin = request.headers.get('Origin') || '';
        const allowedOrigin = extractDomain(baseOrigin) && extractDomain(requestOrigin) === extractDomain(baseOrigin)
            ? requestOrigin
            : baseOrigin;
        return new Response(JSON.stringify({ success: true, encodedData }), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': allowedOrigin,
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Vary': 'Origin'
            }
        });
    } catch {
        return new Response(JSON.stringify({ success: false, error: 'server_error' }), {
            status: 500, headers: { 'Content-Type': 'application/json' }
        });
    }
};

// 处理 CORS 预检请求
const handleOptionsRequest = request => {
    const baseOrigin = getOriginFromRequest(request);
    const requestOrigin = request.headers.get('Origin') || '';
    const allowedOrigin = extractDomain(baseOrigin) && extractDomain(requestOrigin) === extractDomain(baseOrigin)
        ? requestOrigin
        : baseOrigin;
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': allowedOrigin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
            'Vary': 'Origin'
        }
    });
};

// 公共 HTML 模板
const generatePageTemplate = (title, content, styles, lang, path, buildUrl, scripts = '', isDecodeAction = false) => [
    '<!DOCTYPE html>',
    `<html lang="${lang}">`,
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    `<title>${title}</title>`,
    '<style>',
    commonStyles,
    styles,
    '</style>',
    '</head>',
    '<body>',
    '<div class="container">',
    `<h1 class="title">${title}</h1>`,
    `<a href="${buildUrl(path, {}, false, false, isDecodeAction)}" class="lang-switch">${lang === 'zh' ? 'EN' : '中'}</a>`,
    content,
    '</div>',
    '<script>',
    copyScript,
    `try { localStorage.setItem('preferredLang', '${lang}'); } catch {}`,
    scripts,
    '</script>',
    '</body>',
    '</html>'
].join('');

// 生成编码页面
const generateEncoderPage = (t, lang, baseDomain, copied, iframeCopied, path, buildUrl) => {
    const styles = `
        .container { max-width: 600px; }
        .lang-switch { border-radius: 4px; }
        #input { min-height: 150px; resize: vertical; }
        .action-buttons { display: flex; gap: 10px; margin-bottom: 16px; }
        .separator { text-align: center; margin: 16px 0; color: var(--hint); font-size: 12px; }
        .iframe-code { font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 6px; word-break: break-all; white-space: pre-wrap; overflow-x: auto; max-height: 200px; overflow-y: auto; margin-bottom: 16px; }
        .loading { text-align: center; padding: 20px; color: var(--hint); display: none; }
    `;
    const content = [
        '<div class="input-container">',
        `<textarea id="input" placeholder="${escapeHtml(t.encodeInputHint)}"></textarea>`,
        '<div class="action-buttons">',
        `<button class="action-btn encode-btn" id="processBtn">${escapeHtml(t.encodeBtn)}</button>`,
        `<button class="action-btn clear-btn" id="clearBtn">${escapeHtml(t.clearBtn)}</button>`,
        '</div>',
        '</div>',
        `<div class="separator">↓ ${escapeHtml(t.resultSeparator)} ↓</div>`,
        '<div class="result-container">',
        '<div class="iframe-code" id="iframeCode"></div>',
        `<div class="loading" id="loading">${escapeHtml(t.encoding)}</div>`,
        '<div class="action-buttons">',
        `<button class="action-btn copy-btn" id="copyBtn" disabled>${escapeHtml(t.copyBtn)}</button>`,
        '</div>',
        `<div class="status" id="status">${iframeCopied ? escapeHtml(t.iframeSuccess) : (copied ? escapeHtml(t.copySuccess) : '')}</div>`,
        '</div>'
    ].join('');
    const scripts = [
        `const baseDomain = '${escapeHtml(baseDomain)}';`,
        `const els = ['processBtn', 'clearBtn', 'copyBtn', 'input', 'iframeCode', 'status', 'loading']`,
        `.reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});`,
        `const t = ${JSON.stringify(t)};`,
        `const updateStatus = (el, msg, isSuccess) => {`,
        `el.textContent = msg;`,
        `el.className = \`status \${isSuccess ? 'success' : 'error'}\`;`,
        `};`,
        `if (!window.crypto || !window.crypto.subtle) {`,
        `updateStatus(els.status, t.errorCryptoNotSupported, false);`,
        `els.processBtn.disabled = true;`,
        `}`,
        `if (els.processBtn) els.processBtn.addEventListener('click', async () => {`,
        `const inputText = els.input.value;`,
        `if (!inputText.trim()) {`,
        `updateStatus(els.status, t.noContentForIframe, false);`,
        `return;`,
        `}`,
        `try {`,
        `els.loading.style.display = 'block';`,
        `els.iframeCode.textContent = '';`,
        `els.status.textContent = '';`,
        `[els.processBtn, els.copyBtn].forEach(el => el.disabled = true);`,
        `const response = await fetch(\`\${baseDomain}/api/encode\`, {`,
        `method: 'POST', headers: { 'Content-Type': 'application/json' },`,
        `body: JSON.stringify({ data: inputText })`,
        `});`,
        `if (!response.ok) throw new Error(\`Server error: \${response.status}\`);`,
        `const { success, encodedData, error } = await response.json();`,
        `if (success && encodedData) {`,
        `const iframeCode = \`<iframe src="\${baseDomain}/decode?data=\${encodeURIComponent(encodedData)}" width="500" height="420" style="border: none;" frameborder="0" scrolling="no"></iframe>\`;`,
        `els.iframeCode.textContent = iframeCode;`,
        `updateStatus(els.status, t.iframeSuccess, true);`,
        `els.copyBtn.disabled = false;`,
        `navigator.clipboard.writeText(iframeCode).catch(() => {});`,
        `} else {`,
        `throw new Error(error || t.iframeFailed);`,
        `}`,
        `} catch (e) {`,
        `updateStatus(els.status, e.message.includes('key_derivation_failed') ? t.errorKeyDerivation : (e.message.includes('hmac_failed') ? t.errorHmacFailed : (e.message || t.iframeFailed)), false);`,
        `els.copyBtn.disabled = true;`,
        `} finally {`,
        `els.loading.style.display = 'none';`,
        `els.processBtn.disabled = false;`,
        `}`,
        `});`,
        `if (els.clearBtn) els.clearBtn.addEventListener('click', () => {`,
        `els.input.value = '';`,
        `els.iframeCode.textContent = '';`,
        `els.status.textContent = '';`,
        `els.copyBtn.disabled = true;`,
        `});`,
        `if (els.copyBtn) els.copyBtn.addEventListener('click', () => {`,
        `const code = els.iframeCode.textContent;`,
        `if (!code) {`,
        `updateStatus(els.status, t.noContentToCopy, false);`,
        `return;`,
        `}`,
        `copyToClipboard(code, els.status, t);`,
        `});`,
        `if (els.input) els.input.addEventListener('input', () => {`,
        `els.copyBtn.disabled = !els.iframeCode.textContent.trim();`,
        `});`
    ].join('\n');
    return generatePageTemplate(t.homeTitle, content, styles, lang, path, buildUrl, scripts);
};

// 生成解码页面
const generateDecoderPage = (t, lang, isResultPage, content, encodedData, path, buildUrl) => {
    const styles = `
        .container { 
            min-width: 300px;
            max-width: 100%;
            width: 100%; 
            height: auto; 
            min-height: 300px;
            padding: 16px; 
            overflow: visible; 
            box-sizing: border-box; 
        }
        .title { font-size: 18px; }
        .lang-switch { border-radius: 50%; width: 28px; height: 28px; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; }
        .js-disabled-alert { background: var(--js-disabled-bg); color: var(--js-disabled-text); padding: 8px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; text-align: center; }
        #content { 
            width: 100%; 
            min-height: 150px; 
            height: auto; 
            max-height: 400px;
            user-select: text; 
            overflow-y: auto; 
            box-sizing: border-box; 
        }
        .js-disabled-hint { display: none; }

        noscript .container {
            min-height: 500px;
        }
        noscript #content {
            min-height: 200px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        noscript .js-disabled-hint {
            display: block;
            margin-top: 10px;
            color: var(--js-disabled-text);
        }
        
        @media (max-width: 600px) {
            .container { padding: 10px; min-height: 250px; }
            noscript .container { min-height: 350px; }
            .title { font-size: 16px; }
            #content { min-height: 120px; }
            noscript #content { min-height: 180px; }
        }
    `;
    
    const contentParts = [
        isResultPage ? `<noscript><div class="js-disabled-alert">${escapeHtml(t.jsDisabledAlert)}</div></noscript>` : '',
        `<textarea id="content" readonly>${escapeHtml(content)}</textarea>`,
        `<div class="status"></div>`,
        isResultPage
            ? [
                '<noscript><style>.js-only { display: none !important; }</style></noscript>',
                `<button class="action-btn copy-btn js-only" id="copyBtn">${escapeHtml(t.copyBtn)}</button>`
            ].join('')
            : [
                `<form action="${buildUrl('/decode', { action: 'decode' })}" method="GET">`,
                `<input type="hidden" name="data" value="${encodeURIComponent(encodedData || '')}">`,
                `<input type="hidden" name="action" value="decode">`,
                `<input type="hidden" name="lang" value="${lang}">`,
                `<button type="submit" class="action-btn decode-btn">${escapeHtml(t.decodeBtn)}</button>`,
                '</form>'
            ].join(''),
        `<div class="hint">${escapeHtml(isResultPage ? t.resultHint : t.hint)}</div>`,
        isResultPage ? `<div class="hint js-disabled-hint">${escapeHtml(t.jsDisabledHint)}</div>` : ''
    ];
    
    const scripts = isResultPage ? [
        `const contentEl = document.getElementById('content');`,
        `const statusEl = document.querySelector('.status');`,
        `const container = document.querySelector('.container');`,
        `const t = ${JSON.stringify(t)};`,
        `const updateStatus = (msg, isSuccess) => {`,
        `statusEl.textContent = msg;`,
        `statusEl.className = \`status \${isSuccess ? 'success' : 'error'}\`;`,
        `};`,
        `const adjustHeights = () => {`,
        `    contentEl.style.height = 'auto';`,
        `    const contentHeight = contentEl.scrollHeight;`,
        `    const adjustedHeight = Math.min(contentHeight + 20, 400);`,
        `    contentEl.style.height = \`\${adjustedHeight}px\`;`,
        ``,
        `    container.style.height = 'auto';`,
        `    const containerHeight = container.scrollHeight + 20;`,
        `    container.style.height = \`\${containerHeight}px\`;`,
        ``,
        `    if (window.parent && window.parent !== window) {`,
        `        try {`,
        `            window.parent.postMessage({`,
        `                type: 'iframeHeight',`,
        `                height: containerHeight`,
        `            }, '*');`,
        `        } catch (e) { console.log('无法通知父窗口调整高度:', e); }`,
        `    }`,
        `};`,
        ``,
        `adjustHeights();`,
        `window.addEventListener('resize', adjustHeights);`,
        ``,
        `if (document.getElementById('copyBtn')) {`,
        `document.getElementById('copyBtn').addEventListener('click', () => {`,
        `const content = contentEl.value;`,
        `if (!content) {`,
        `updateStatus(t.noContentToCopy, false);`,
        `return;`,
        `}`,
        `copyToClipboard(content, statusEl, t);`,
        `});`,
        `}`,
        `document.querySelector('.js-disabled-hint').style.display = 'none';`
    ].join('\n') : '';
    
    return generatePageTemplate(t.title, contentParts.join(''), styles, lang, path, buildUrl, scripts, isResultPage);
};

// 主请求处理函数
const handleRequest = async request => {
    const url = new URL(request.url);
    const { pathname: path, searchParams } = url;

    // 处理 API 路由
    if (path === '/api/encode') {
        return request.method === 'OPTIONS' ? handleOptionsRequest(request) : handleEncodeRequest(request);
    }

    // 页面路由处理
    let encodedData = searchParams.get('data') || '';
    let lang = searchParams.get('lang') || '';
    const copied = searchParams.get('copied') === 'true';
    const iframeCopied = searchParams.get('iframeCopied') === 'true';

    // 从引用页获取数据
    if (!encodedData) {
        try {
            const referrer = request.headers.get('Referer');
            if (referrer) {
                const refUrl = new URL(referrer);
                encodedData = refUrl.searchParams.get('data') || '';
                if (!lang) lang = refUrl.searchParams.get('lang') || '';
            }
        } catch {}
    }

    // 数据清洗
    encodedData = encodedData.replace(/\s+|%20|%2B/g, '+');
    try {
        encodedData = decodeURIComponent(encodedData);
    } catch {}

    // 语言设置
    lang = ['zh', 'en'].includes(lang) ? lang : (request.headers.get('Accept-Language')?.includes('zh') ? 'zh' : 'en');
    const t = i18n[lang];
    const baseDomain = getOriginFromRequest(request);

    // URL 构建工具 - 修复语言切换时保留解码状态
    const buildUrl = (targetPath, extraParams = {}, preserveLang = false, preserveAction = false, isDecodeAction = false) => {
        const params = new URLSearchParams();
        if (encodedData) params.append('data', encodeURIComponent(encodedData));
        params.append('lang', preserveLang ? lang : lang === 'zh' ? 'en' : 'zh');
        
        // 对于解码结果页，保留action参数以维持解码状态
        if (targetPath === '/decode' && isDecodeAction && !preserveAction) {
            params.append('action', 'decode');
        }
        
        Object.entries(extraParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                params.set(key, value.toString());
            }
        });
        const query = params.toString();
        return `${baseDomain}${targetPath}${query ? '?' + query : ''}`;
    };

    // 编码页面路由
    if (['/', '/index.html', '/encode'].includes(path)) {
        return new Response(generateEncoderPage(t, lang, baseDomain, copied, iframeCopied, path, buildUrl), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 解码页面路由
    if (path === '/decode') {
        const isDecodeAction = searchParams.get('action') === 'decode';
        if (isDecodeAction && encodedData) {
            const decodeResult = await decodeWithAdvancedSalt(encodedData);
            let message = decodeResult.message;
            if (!decodeResult.success) {
                const errorMap = {
                    'no_data': t.errorNoData,
                    'invalid_format': t.errorInvalid,
                    'salt_mismatch': t.errorSaltMismatch,
                    'integrity_failed': t.errorIntegrityFailed,
                    'crypto_not_supported': t.errorCryptoNotSupported,
                    'decoding_failed': t.errorFail
                };
                message = errorMap[message] || t.errorFail;
            }
            return new Response(generateDecoderPage(t, lang, true, message, encodedData, path, buildUrl), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }
        return new Response(generateDecoderPage(t, lang, false, t.placeholder, encodedData, path, buildUrl), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    // 404 响应
    return new Response('Not found', {
        status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
};