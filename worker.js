addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const questionStore = new Map();

const getQuestionsFromEnv = (lang) => {
    const envVar = lang === 'en' ? 'ENV_QUESTIONS_EN' : 'ENV_QUESTIONS';
    
    if (typeof self[envVar] === 'undefined' || self[envVar] === null || self[envVar].trim() === '') {
        return lang === 'en' ? getDefaultEnglishQuestions() : getDefaultChineseQuestions();
    }
    
    try {
        return self[envVar].split(',').map(item => {
            const [question, answer] = item.split('|');
            return question && answer ? { 
                question: question.trim(), 
                answer: answer.trim().toLowerCase() 
            } : null;
        }).filter(Boolean);
    } catch (e) {
        console.error('解析问题库失败:', e);
        return lang === 'en' ? getDefaultEnglishQuestions() : getDefaultChineseQuestions();
    }
};

const getDefaultChineseQuestions = () => [{ question: "2加2等于多少?", answer: "4" }];
const getDefaultEnglishQuestions = () => [{ question: "What is 2 plus 2?", answer: "4" }];

const getRandomQuestion = (lang) => {
    try {
        const questions = getQuestionsFromEnv(lang);
        if (questions.length === 0) {
            return lang === 'en' ? { question: "What is 2 plus 2?", answer: "4" } : { question: "2加2等于多少?", answer: "4" };
        }
        return questions[Math.floor(Math.random() * questions.length)];
    } catch (e) {
        console.error('获取随机问题失败:', e);
        return lang === 'en' ? { question: "What is 2 plus 2?", answer: "4" } : { question: "2加2等于多少?", answer: "4" };
    }
};

const validateAnswer = (userAnswer, correctAnswer) => userAnswer.trim().toLowerCase() === correctAnswer.toLowerCase();

const generateQuestionId = (question, answer) => {
    const encoder = new TextEncoder();
    return crypto.subtle.digest('SHA-256', encoder.encode(`${question}|${answer}`))
        .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16));
};

const i18n = {
    zh: {
        title: "信息解码", placeholder: "请回答问题后解码", decodeBtn: "解码",
        copyBtn: "复制结果", hint: "回答问题后点击解码", resultHint: "点击按钮复制或手动选中复制",
        copySuccess: "✅ 复制成功", copyFailed: "复制失败，请手动复制",
        errorNoData: "未获取到可解码的信息", errorInvalid: "输入不是有效的编码",
        errorFail: "解码失败，请检查编码格式或密钥", errorSaltMismatch: "盐值不匹配，无法解码",
        errorIntegrityFailed: "数据完整性验证失败，可能被篡改", errorCryptoNotSupported: "浏览器不支持加密功能，请使用现代浏览器",
        errorInvalidInput: "输入无效，请检查文本", errorServer: "服务器错误，请稍后重试",
        errorKeyDerivation: "密钥生成失败，请检查环境配置", errorHmacFailed: "数据签名失败，请检查环境",
        jsDisabledAlert: "检测到JavaScript已禁用，请手动选中内容，按Ctrl+C复制",
        jsDisabledHint: "请手动选中内容，按Ctrl+C（或Cmd-C）复制",
        homeTitle: "编码工具", encodeBtn: "编码并生成iframe", clearBtn: "清空",
        encodeInputHint: "输入需要编码的文本...", resultSeparator: "生成的iframe代码",
        noContentToCopy: "没有可复制的内容", noContentForIframe: "没有可生成iframe的内容",
        iframeSuccess: "✅ iframe代码已复制", iframeFailed: "❌ 生成iframe代码失败",
        encoding: "编码中...",
        questionPrompt: "请回答以下问题以解码信息：",
        answerPlaceholder: "输入答案",
        wrongAnswer: "答案不正确，请重试"
    },
    en: {
        title: "Info Decoder", placeholder: "Answer the question to decode", decodeBtn: "Decode",
        copyBtn: "Copy Result", hint: "Answer the question then click decode", resultHint: "Click to copy or select text manually",
        copySuccess: "✅ Copied successfully", copyFailed: "Copy failed, please copy manually",
        errorNoData: "No decodable information found", errorInvalid: "Input is not valid encoded data",
        errorFail: "Decoding failed, check format or key", errorSaltMismatch: "Salt mismatch, cannot decode",
        errorIntegrityFailed: "Data integrity check failed, may have been tampered with", errorCryptoNotSupported: "Browser does not support crypto functions, please use a modern browser",
        errorInvalidInput: "Invalid input, please check the text", errorServer: "Server error, please try again later",
        errorKeyDerivation: "Key derivation failed, please check environment configuration", errorHmacFailed: "Data signing failed, please check environment",
        jsDisabledAlert: "JavaScript is disabled. Please select the content and press Ctrl+C to copy",
        jsDisabledHint: "Please select content and press Ctrl+C (or Cmd-C) to copy",
        homeTitle: "Encoding Tool", encodeBtn: "Encode & Generate iframe", clearBtn: "Clear",
        encodeInputHint: "Enter text to encode...", resultSeparator: "Generated iframe code",
        noContentToCopy: "No content to copy", noContentForIframe: "No content to generate iframe",
        iframeSuccess: "✅ iframe code copied", iframeFailed: "❌ Failed to generate iframe code",
        encoding: "Encoding...",
        questionPrompt: "Please answer the following question to continue:",
        answerPlaceholder: "Enter your answer",
        wrongAnswer: "Incorrect answer, please try again"
    }
};

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
    .container { 
        margin: 20px auto; 
        background: var(--card); 
        padding: 20px; 
        border-radius: 8px; 
        box-shadow: 0 1px 3px rgba(0,0,0,0.1); 
        position: relative;
        max-width: 700px;
    }
    .title { color: var(--primary); font-weight: 600; text-align: center; margin-bottom: 20px; }
    .lang-switch { position: absolute; right: 20px; top: 20px; background: var(--primary); color: white; border: none; padding: 4px 8px; cursor: pointer; font-size: 14px; text-decoration: none; border-radius: 4px; }
    .action-btn { width: 100%; padding: 10px 0; border: none; border-radius: 6px; color: white; cursor: pointer; font-size: 15px; font-weight: 500; margin-bottom: 12px; }
    .action-btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .encode-btn, .decode-btn { background: var(--primary); }
    .copy-btn, .clear-btn { background: var(--success); }
    .clear-btn { background: var(--danger); }
    .status { text-align: center; font-size: 14px; margin: 8px 0; height: 20px; }
    .status.success { color: var(--success); }
    .status.error { color: var(--danger); }
    .hint { text-align: center; font-size: 12px; color: var(--hint); }
    textarea, .answer-input { width: 100%; padding: 10px; border: 1px solid var(--border); border-radius: 6px; margin-bottom: 16px; font-size: 14px; background: transparent; color: inherit; white-space: pre-wrap; word-break: break-all; resize: none; }
    .question-container { margin-bottom: 16px; }
    .question-text { margin-bottom: 8px; font-weight: 500; }
    .wrong-answer { color: var(--danger); text-align: center; margin-bottom: 12px; }
`;

const getOriginFromRequest = request => {
    const url = new URL(request.url);
    return typeof ENV_BASE_DOMAIN !== 'undefined' && ENV_BASE_DOMAIN ? ENV_BASE_DOMAIN : `${url.protocol}//${url.host}`;
};

const getSalt = () => {
    const salt = typeof ENV_SECURITY_SALT !== 'undefined' ? ENV_SECURITY_SALT : null;
    if (!salt) {
        throw new Error('ENV_SECURITY_SALT environment variable is not set. This is a critical security requirement.');
    }
    return salt;
};

const isCryptoSupported = () => typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';

const deriveKey = async (saltBytes, keyUsage, algorithm) => {
    try {
        const keyMaterial = await crypto.subtle.importKey('raw', saltBytes, { name: 'PBKDF2' }, false, ['deriveKey']);
        const derivedKeyAlgorithm = { name: algorithm, length: 256 };
        if (algorithm === 'HMAC') derivedKeyAlgorithm.hash = 'SHA-256';
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

const encodeWithAdvancedSalt = async data => {
    if (!isCryptoSupported() || typeof data !== 'string' || data.trim() === '' || data.length > 10000) return null;
    try {
        const encoder = new TextEncoder();
        const [dataBytes, saltBytes] = [encoder.encode(data), encoder.encode(getSalt())];
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const encryptionKey = await deriveKey(saltBytes, ['encrypt'], 'AES-GCM');
        const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKey, dataBytes);
        const hmacKey = await deriveKey(saltBytes, ['sign'], 'HMAC');
        const hmac = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, encrypted);
        const combined = new Uint8Array([...iv, ...new Uint8Array(encrypted), ...new Uint8Array(hmac)]);
        return btoa(String.fromCharCode(...combined)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch {
        return null;
    }
};

const decodeWithAdvancedSalt = async encodedData => {
    if (!isCryptoSupported() || !encodedData || typeof encodedData !== 'string' || encodedData.length > 20000) {
        return { success: false, message: encodedData ? 'no_data' : 'invalid_format' };
    }
    try {
        const saltBytes = new TextEncoder().encode(getSalt());
        let decodedB64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        decodedB64 += '='.repeat((4 - (decodedB64.length % 4)) % 4);
        
        let binaryString;
        try { binaryString = atob(decodedB64); } catch { return { success: false, message: 'invalid_format' }; }
        
        const combined = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) combined[i] = binaryString.charCodeAt(i);
        
        if (combined.length < 48) return { success: false, message: 'invalid_format' };

        const [iv, encrypted, hmac] = [combined.slice(0, 16), combined.slice(16, -32), combined.slice(-32)];
        
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

const escapeHtml = unsafe => {
    if (!unsafe) return '';
    const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return unsafe.replace(/[&<>"']/g, c => escapeMap[c] || c);
};

const generateCsrfToken = async () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const hmacKey = await deriveKey(new TextEncoder().encode(getSalt()), ['sign'], 'HMAC');
    const hmac = await crypto.subtle.sign({ name: 'HMAC' }, hmacKey, new TextEncoder().encode(token));
    const hmacHex = Array.from(new Uint8Array(hmac)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${token}.${hmacHex}`;
};

const verifyCsrfToken = async (token) => {
    try {
        const [randomPart, hmacPart] = token.split('.');
        if (!randomPart || !hmacPart) return false;
        const hmacKey = await deriveKey(new TextEncoder().encode(getSalt()), ['verify'], 'HMAC');
        const hmac = new Uint8Array(hmacPart.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        return await crypto.subtle.verify({ name: 'HMAC' }, hmacKey, hmac, new TextEncoder().encode(randomPart));
    } catch {
        return false;
    }
};

const handleEncodeRequest = async request => {
    try {
        if (request.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' } });
        if (request.method !== 'POST') return new Response(JSON.stringify({ success: false, error: 'method_not_allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
        if (!request.headers.get('Content-Type')?.includes('application/json')) return new Response(JSON.stringify({ success: false, error: 'invalid_content_type' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const { data } = await request.json();
        if (typeof data !== 'string' || data.trim() === '' || data.length > 10000) return new Response(JSON.stringify({ success: false, error: 'invalid_input' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        const encodedData = await encodeWithAdvancedSalt(data);
        if (!encodedData) return new Response(JSON.stringify({ success: false, error: 'encoding_failed' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify({ success: true, encodedData }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' } });
    } catch {
        return new Response(JSON.stringify({ success: false, error: 'server_error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};

const buildUrl = (targetPath, params, isLangSwitch, baseDomain) => {
    const newParams = new URLSearchParams();
    const currentLang = params.lang;
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    
    if (isLangSwitch) {
        newParams.append('lang', newLang);
        if (params.encodedData) newParams.append('data', params.encodedData);
        if (params.content) newParams.append('content', params.content);
    } else {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') newParams.set(key, value.toString());
        });
    }

    const query = newParams.toString();
    return `${baseDomain}${targetPath}${query ? '?' + query : ''}`;
};

const generatePage = (title, content, styles, lang, scripts, langSwitchType, pageState) => {
    const langSwitchHtml = langSwitchType === 'js'
        ? `<button class="lang-switch">${lang === 'zh' ? 'EN' : '中'}</button>`
        : `<a href="${buildUrl(pageState.path, pageState, true, pageState.baseDomain)}" class="lang-switch">${lang === 'zh' ? 'EN' : '中'}</a>`;

    return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <style>${commonStyles}${styles}</style>
</head>
<body>
    <div class="container">
        <h1 class="title">${escapeHtml(title)}</h1>
        ${langSwitchHtml}
        ${content}
    </div>
    <script>
        const i18n = ${JSON.stringify(i18n)};
        ${scripts}
    </script>
</body>
</html>
    `;
};

const getEncoderPageContent = (t, baseDomain, pageState) => {
    const savedContent = pageState.content || '';
    const iframeCode = pageState.iframeCode || '';
    const styles = `.container { max-width: 600px; } #input { min-height: 150px; resize: vertical; } .action-buttons { display: flex; gap: 10px; margin-bottom: 16px; } .separator { text-align: center; margin: 16px 0; color: var(--hint); font-size: 12px; } .iframe-code { font-family: monospace; font-size: 13px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 6px; word-break: break-all; white-space: pre-wrap; overflow-x: auto; max-height: 200px; overflow-y: auto; margin-bottom: 16px; } .loading { text-align: center; padding: 20px; color: var(--hint); display: none; }`;
    const content = `
        <div class="input-container">
            <textarea id="input" placeholder="${escapeHtml(t.encodeInputHint)}">${escapeHtml(savedContent)}</textarea>
            <div class="action-buttons">
                <button class="action-btn encode-btn" id="processBtn">${escapeHtml(t.encodeBtn)}</button>
                <button class="action-btn clear-btn" id="clearBtn">${escapeHtml(t.clearBtn)}</button>
            </div>
        </div>
        <div class="separator">↓ ${escapeHtml(t.resultSeparator)} ↓</div>
        <div class="result-container">
            <div class="iframe-code" id="iframeCode">${escapeHtml(iframeCode)}</div>
            <div class="loading" id="loading">${escapeHtml(t.encoding)}</div>
            <div class="action-buttons">
                <button class="action-btn copy-btn" id="copyBtn" ${iframeCode ? '' : 'disabled'}>${escapeHtml(t.copyBtn)}</button>
            </div>
            <div class="status" id="status">${pageState.iframeCopied ? escapeHtml(t.iframeSuccess) : (pageState.copied ? escapeHtml(t.copySuccess) : '')}</div>
        </div>
    `;
    const scripts = `
        (function() {
            ${copyScript}
            const baseDomain = '${escapeHtml(baseDomain)}';
            const els = ['processBtn', 'clearBtn', 'copyBtn', 'input', 'iframeCode', 'status', 'loading'].reduce((acc, id) => ({ ...acc, [id]: document.getElementById(id) }), {});
            let currentLang = '${pageState.lang}';
            
            const updateText = () => {
                const t = i18n[currentLang];
                els.title = els.title || document.querySelector('.title');
                if (els.title) els.title.textContent = t.homeTitle;
                if (els.processBtn) els.processBtn.textContent = t.encodeBtn;
                if (els.clearBtn) els.clearBtn.textContent = t.clearBtn;
                if (els.copyBtn) els.copyBtn.textContent = t.copyBtn;
                const langSwitchEl = document.querySelector('.lang-switch');
                if (langSwitchEl) langSwitchEl.textContent = currentLang === 'zh' ? 'EN' : '中';
                if (els.resultSeparator) els.resultSeparator.textContent = '↓ ' + t.resultSeparator + ' ↓';
                if (els.input) els.input.placeholder = t.encodeInputHint;
                if (els.status) {
                    const statusText = els.status.textContent;
                    if (statusText.includes('✅')) els.status.textContent = t.iframeSuccess;
                    else if (statusText.includes('❌')) els.status.textContent = t.iframeFailed;
                }
            };

            const updateStatus = (el, msg, isSuccess) => {
                el.textContent = msg;
                el.className = \`status \${isSuccess ? 'success' : 'error'}\`;
            };

            const setLanguage = (newLang) => {
                currentLang = newLang;
                document.documentElement.lang = newLang;
                try { localStorage.setItem('preferredLang', newLang); } catch {}
                updateText();
            };

            document.addEventListener('DOMContentLoaded', () => {
                try { 
                    const savedLang = localStorage.getItem('preferredLang');
                    if (savedLang && i18n[savedLang]) setLanguage(savedLang);
                } catch {}
                updateText();
                if (!window.crypto || !window.crypto.subtle) { updateStatus(els.status, i18n[currentLang].errorCryptoNotSupported, false); els.processBtn.disabled = true; }
            });

            const langSwitchEl = document.querySelector('.lang-switch');
            if (langSwitchEl) langSwitchEl.addEventListener('click', () => setLanguage(currentLang === 'zh' ? 'en' : 'zh'));
            if (els.input) els.input.addEventListener('input', () => { try { localStorage.setItem('savedContent_${pageState.path}_${pageState.lang}', els.input.value); } catch {} });
            
            if (els.processBtn) els.processBtn.addEventListener('click', async () => {
                const inputText = els.input.value;
                if (!inputText.trim()) { updateStatus(els.status, i18n[currentLang].noContentForIframe, false); return; }
                try {
                    els.loading.style.display = 'block';
                    els.iframeCode.textContent = '';
                    els.status.textContent = '';
                    [els.processBtn, els.copyBtn].forEach(el => el.disabled = true);
                    const response = await fetch(\`\${baseDomain}/api/encode\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: inputText }) });
                    if (!response.ok) throw new Error(\`Server error: \${response.status}\`);
                    const { success, encodedData, error } = await response.json();
                    if (success && encodedData) {
                        const iframeCode = \`<iframe src="\${baseDomain}/decode?data=\${encodeURIComponent(encodedData)}" style="width: 100%; height: 420px; border: none; overflow: auto;"></iframe>\`;
                        els.iframeCode.textContent = iframeCode;
                        updateStatus(els.status, i18n[currentLang].iframeSuccess, true);
                        els.copyBtn.disabled = false;
                        navigator.clipboard.writeText(iframeCode).catch(() => {});
                    } else {
                        throw new Error(error || i18n[currentLang].iframeFailed);
                    }
                } catch (e) {
                    const message = (e.message.includes('key_derivation_failed') ? i18n[currentLang].errorKeyDerivation : (e.message.includes('hmac_failed') ? i18n[currentLang].errorHmacFailed : (e.message || i18n[currentLang].iframeFailed)));
                    updateStatus(els.status, message, false);
                    els.copyBtn.disabled = true;
                } finally {
                    els.loading.style.display = 'none';
                    els.processBtn.disabled = false;
                }
            });
            if (els.clearBtn) els.clearBtn.addEventListener('click', () => { els.input.value = ''; els.iframeCode.textContent = ''; els.status.textContent = ''; els.copyBtn.disabled = true; try { localStorage.removeItem('savedContent_${pageState.path}_${pageState.lang}'); } catch {} });
            if (els.copyBtn) els.copyBtn.addEventListener('click', () => {
                const code = els.iframeCode.textContent;
                if (!code) { updateStatus(els.status, i18n[currentLang].noContentToCopy, false); return; }
                copyToClipboard(code, els.status, i18n[currentLang]);
            });
            if (els.input) els.input.addEventListener('input', () => { els.copyBtn.disabled = !els.iframeCode.textContent.trim(); });
        })();
    `;
    return { content, styles, scripts };
};

const getDecoderPageContent = async (t, lang, pageState) => {
    const styles = `
        .container { 
            min-width: 300px;
            width: 100%; 
            height: 100%; 
            padding: 16px; 
            overflow: visible; 
            box-sizing: border-box; 
            background: transparent;
            display: flex;
            flex-direction: column; 
            justify-content: center; 
            align-items: center;
        }
        .title { 
            font-size: 18px; 
            width: 100%; 
            text-align: center;
        }
        .lang-switch { 
            border-radius: 50%; 
            width: 28px; 
            height: 28px; 
            font-size: 12px; 
            font-weight: bold; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
        .js-disabled-alert { 
            background: var(--js-disabled-bg); 
            color: var(--js-disabled-text); 
            padding: 8px; 
            border-radius: 6px; 
            margin-bottom: 16px; 
            font-size: 12px; 
            text-align: center; 
            width: 100%; /* 确保宽度一致 */
        }
        #content { 
            width: 100%; 
            min-height: 150px; 
            height: auto; 
            max-height: 400px;
            user-select: text; 
            overflow-y: auto; 
            box-sizing: border-box; 
        }
        .js-disabled-hint { 
            display: none; 
            width: 100%;
        }
        .question-container { 
            margin-bottom: 25px; 
            width: 100%;
            box-sizing: border-box;
        }
        .question-text { 
            margin-bottom: 8px; 
            font-weight: 500; 
            width: 100%;
        }
        .answer-input { 
            width: 100%; 
            max-width: 100%;
            padding: 10px; 
            border: 1px solid var(--border); 
            border-radius: 6px; 
            margin-bottom: 16px; 
            font-size: 14px; 
            background: transparent; 
            color: inherit; 
            box-sizing: border-box;
        }
        .decode-btn { 
            width: 100%; 
            max-width: 100%;
            padding: 10px 0; 
            border: none; 
            border-radius: 6px; 
            color: white; 
            cursor: pointer; 
            font-size: 15px; 
            font-weight: 500; 
            margin-bottom: 12px; 
            background: var(--primary); 
        }
        .wrong-answer { 
            color: var(--danger); 
            text-align: center; 
            margin-bottom: 12px; 
            width: 100%; /* 确保宽度一致 */
        }
        noscript .container {
            min-height: 500px;
        }
        noscript #content {
            min-height: 300px;
            white-space: pre-wrap;
            word-break: break-all;
        }
        noscript .js-disabled-hint {
            display: block;
            margin-top: 10px;
            color: var(--js-disabled-text);
        }
        @media (max-width: 600px) {
            .container { 
                padding: 10px; 
                height: 100%; /* 保持填充 iframe */
            }
            noscript .container { 
                min-height: 350px; 
            }
            .title { 
                font-size: 16px; 
            }
            #content { 
                min-height: 120px; 
            }
            noscript #content { 
                min-height: 180px; 
            }
        }
    `;
    let contentParts = [];
    let scripts = '';
    
    if (pageState.isDecodeResult) {
        contentParts = [
            `<noscript><div class="js-disabled-alert">${escapeHtml(t.jsDisabledAlert)}</div></noscript>`,
            `<textarea id="content" readonly>${escapeHtml(pageState.content)}</textarea>`,
            `<div class="status"></div>`,
            '<noscript><style>.js-only { display: none !important; }</style></noscript>',
            `<button class="action-btn copy-btn js-only" id="copyBtn">${escapeHtml(t.copyBtn)}</button>`,
            `<div class="hint">${escapeHtml(t.resultHint)}</div>`,
            `<div class="hint js-disabled-hint">${escapeHtml(t.jsDisabledHint)}</div>`
        ];
        scripts = `
            (function() {
                ${copyScript}
                const contentEl = document.getElementById('content');
                const statusEl = document.querySelector('.status');
                const container = document.querySelector('.container');
                const adjustHeights = () => {
                    contentEl.style.height = 'auto';
                    const contentHeight = contentEl.scrollHeight;
                    const adjustedHeight = Math.min(contentHeight + 20, 400);
                    contentEl.style.height = \`\${adjustedHeight}px\`;
                    container.style.height = 'auto';
                    const containerHeight = container.scrollHeight + 20;
                    container.style.height = \`\${containerHeight}px\`;
                    if (window.parent && window.parent !== window) {
                        try { window.parent.postMessage({ type: 'iframeHeight', height: containerHeight }, '*'); } catch (e) { console.log('无法通知父窗口调整高度:', e); }
                    }
                };
                const updateStatus = (msg, isSuccess) => { statusEl.textContent = msg; statusEl.className = \`status \${isSuccess ? 'success' : 'error'}\`; };
                document.addEventListener('DOMContentLoaded', adjustHeights);
                window.addEventListener('resize', adjustHeights);
                if (document.getElementById('copyBtn')) { document.getElementById('copyBtn').addEventListener('click', () => { const content = contentEl.value; if (!content) { updateStatus(i18n['${lang}'].noContentToCopy, false); return; } copyToClipboard(content, statusEl, i18n['${lang}']); }); }
                document.querySelector('.js-disabled-hint').style.display = 'none';
            })();
        `;
    } else if (pageState.encodedData) {
        const question = getRandomQuestion(lang);
        const questionId = await generateQuestionId(question.question, question.answer);
        questionStore.set(questionId, question.answer);
        const csrfToken = await generateCsrfToken();
        contentParts = [
            pageState.isWrongAnswer ? `<div class="wrong-answer">${escapeHtml(t.wrongAnswer)}</div>` : '',
            `<div class="question-container">`,
            `<div class="question-text">${escapeHtml(t.questionPrompt)}</div>`,
            `<div>${escapeHtml(question.question)}</div>`,
            `</div>`,
            `<form action="${buildUrl('/decode', { action: 'decode', lang, encodedData: pageState.encodedData }, false, pageState.baseDomain)}" method="POST">`,
            `<input type="hidden" name="data" value="${encodeURIComponent(pageState.encodedData)}">`,
            `<input type="hidden" name="questionId" value="${questionId}">`,
            `<input type="hidden" name="csrfToken" value="${csrfToken}">`,
            `<input type="hidden" name="lang" value="${lang}">`,
            `<input type="text" name="userAnswer" placeholder="${escapeHtml(t.answerPlaceholder)}" required class="answer-input">`,
            `<button type="submit" class="action-btn decode-btn">${escapeHtml(t.decodeBtn)}</button>`,
            '</form>',
            `<div class="hint">${escapeHtml(t.hint)}</div>`
        ];
    } else {
        contentParts = [
            `<textarea id="content" readonly>${escapeHtml(t.errorNoData)}</textarea>`,
            `<div class="status error">${escapeHtml(t.errorNoData)}</div>`,
            `<button class="action-btn decode-btn" onclick="window.location.href='${buildUrl('/decode', { lang }, false, pageState.baseDomain)}'">${escapeHtml(t.decodeBtn)}</button>`,
            `<div class="hint">${escapeHtml(t.hint)}</div>`
        ];
    }
    return { content: contentParts.join(''), styles, scripts };
};

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

const handleRequest = async request => {
    const url = new URL(request.url);
    const { pathname: path, searchParams } = url;
    
    if (path === '/api/encode') return handleEncodeRequest(request);

    let encodedData = searchParams.get('data') || '';
    let content = searchParams.get('content') || '';
    let lang = searchParams.get('lang') || (request.headers.get('Accept-Language')?.includes('zh') ? 'zh' : 'en');
    const copied = searchParams.get('copied') === 'true';
    const iframeCopied = searchParams.get('iframeCopied') === 'true';
    const baseDomain = getOriginFromRequest(request);

    try { content = decodeURIComponent(content); } catch {}
    encodedData = encodedData.replace(/\s+|%20|%2B/g, '+');
    try { encodedData = decodeURIComponent(encodedData); } catch {}

    const t = i18n[lang];
    const pageState = { lang, baseDomain, encodedData, content, copied, iframeCopied, path };

    let pageTitle, pageContent, pageStyle, pageScript, langSwitchType;
    
    if (['/', '/index.html', '/encode'].includes(path)) {
        pageTitle = t.homeTitle;
        langSwitchType = 'js';
        if (content) {
            const tempEncodedData = await encodeWithAdvancedSalt(content);
            if (tempEncodedData) {
                pageState.isEncodeResult = true;
                pageState.iframeCode = `<iframe src="${baseDomain}/decode?data=${encodeURIComponent(tempEncodedData)}" style="width: 95%; height: 420px; border: none; overflow: auto;" frameborder="0"></iframe>`;
            }
        }
        ({ content: pageContent, styles: pageStyle, scripts: pageScript } = getEncoderPageContent(t, baseDomain, pageState));
    } else if (path === '/decode') {
        pageTitle = t.title;
        langSwitchType = 'url';
        if (request.method === 'POST' && searchParams.get('action') === 'decode') {
            const formData = await request.formData();
            const userAnswer = formData.get('userAnswer') || '';
            const questionId = formData.get('questionId') || '';
            encodedData = formData.get('data') || '';
            const csrfToken = formData.get('csrfToken') || '';
            const isCsrfValid = await verifyCsrfToken(csrfToken);
            const correctAnswer = questionStore.get(questionId);
            if (isCsrfValid && correctAnswer && validateAnswer(userAnswer, correctAnswer)) {
                questionStore.delete(questionId);
                const decodeResult = await decodeWithAdvancedSalt(encodedData);
                const message = decodeResult.success ? decodeResult.message : (i18n[lang][`error${decodeResult.message.charAt(0).toUpperCase() + decodeResult.message.slice(1)}`] || t.errorFail);
                pageState.isDecodeResult = true;
                pageState.content = message;
            } else {
                pageState.isWrongAnswer = true;
                pageState.encodedData = encodedData;
            }
        } else if (encodedData && !content) {
            pageState.encodedData = encodedData;
        } else if (content) {
            pageState.isDecodeResult = true;
            pageState.content = content;
        }
        ({ content: pageContent, styles: pageStyle, scripts: pageScript } = await getDecoderPageContent(t, lang, pageState));
    } else {
        return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Frame-Options': 'ALLOWALL' } });
    }
    const html = generatePage(pageTitle, pageContent, pageStyle, lang, pageScript, langSwitchType, pageState);
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'X-Frame-Options': 'ALLOWALL', 'Permissions-Policy': 'clipboard-write=(self)' } });
};
