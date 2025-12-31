// ==UserScript==
// @name         CPAMC 额度截图复制
// @namespace    https://github.com/CookSleep
// @homepageURL  https://github.com/CookSleep/cpamc-screenshot
// @version      1.2.1
// @description  在 CPAMC 配额管理页面添加复制按钮，截图（可选择是否脱敏）后复制到剪贴板
// @author       Cook Sleep
// @match        *://*/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @license      GPLv3
// @downloadURL  https://github.com/CookSleep/cpamc-screenshot/raw/main/cpamc-screenshot.user.js
// @updateURL    https://github.com/CookSleep/cpamc-screenshot/raw/main/cpamc-screenshot.user.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'cpamc_urls';
    const DEFAULT_URL = 'http://127.0.0.1:8317';
    const MIN_SCREENSHOT_WIDTH = 1200;

    const ICONS = {
        COPY: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`,
        VISIBLE: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
            <text x="12" y="16" text-anchor="middle" font-size="12" font-weight="bold" fill="currentColor" stroke="none">M</text>
        </svg>`,
        CLOSE: `<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>`,
        QUESTION: `<svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" stroke="currentColor" stroke-width="1" d="M11 18h2v-2h-2v2zm1-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z"/></svg>`
    };

    const STYLES = `
        :root {
            --cpamc-modal-bg: #202020;
            --cpamc-modal-border: #3a3a44;
            --cpamc-modal-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
            --cpamc-modal-title: #FAFAFA;
            --cpamc-modal-label: #A3A3A3;
            --cpamc-input-bg: #191919;
            --cpamc-input-border: #3a3a44;
            --cpamc-input-text: #FAFAFA;
            --cpamc-btn-border: #4C4C52;
            --cpamc-btn-text: #A3A3A3;
            --cpamc-btn-hover-border: #10B981;
            --cpamc-btn-hover-text: #10B981;
            --cpamc-btn-hover-bg: rgba(16, 185, 129, 0.08);
            --cpamc-btn-radius: 6px;
            --cpamc-primary: #10B981;
            --cpamc-primary-hover: #059669;
            --cpamc-primary-bg: rgba(16, 185, 129, 0.08);
            --cpamc-primary-bg-hover: rgba(16, 185, 129, 0.15);
            --cpamc-primary-border: rgba(16, 185, 129, 0.4);
            --cpamc-scrollbar-thumb: #4a4a52;
            --cpamc-scrollbar-hover: #5a5a62;
            --cpamc-hint-color: #666;
            --cpamc-screenshot-bg: #191919;
        }

        @media (prefers-color-scheme: light) {
            :root {
                --cpamc-modal-bg: #FFFFFF;
                --cpamc-modal-border: #e0e0e0;
                --cpamc-modal-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                --cpamc-modal-title: #1F2937;
                --cpamc-modal-label: #6B7280;
                --cpamc-input-bg: #F3F4F6;
                --cpamc-input-border: #C8C9CC;
                --cpamc-input-text: #1F2937;
                --cpamc-btn-border: #C8C9CC;
                --cpamc-btn-text: #6B7280;
                --cpamc-btn-hover-border: #10B981;
                --cpamc-btn-hover-text: #10B981;
                --cpamc-btn-hover-bg: rgba(16, 185, 129, 0.08);
                --cpamc-scrollbar-thumb: #c0c0c0;
                --cpamc-scrollbar-hover: #a0a0a0;
                --cpamc-hint-color: #999;
                --cpamc-screenshot-bg: #F3F4F6;
            }
        }

        #cpamc-settings-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 16px;
            box-sizing: border-box;
        }

        #cpamc-settings-modal .modal-content {
            background: var(--cpamc-modal-bg);
            border: 1px solid var(--cpamc-modal-border);
            border-radius: 12px;
            padding: 24px;
            width: 100%;
            max-width: 420px;
            box-shadow: var(--cpamc-modal-shadow);
        }

        #cpamc-settings-modal h3 {
            margin: 0 0 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: var(--cpamc-modal-title);
        }

        #cpamc-settings-modal .form-group {
            margin-bottom: 20px;
        }

        #cpamc-settings-modal label {
            display: block;
            margin-bottom: 8px;
            font-size: 13px;
            color: var(--cpamc-modal-label);
            font-weight: 500;
        }

        #cpamc-settings-modal .url-list {
            max-height: 240px;
            overflow-y: auto;
            margin-bottom: 12px;
            padding-right: 4px;
        }

        #cpamc-settings-modal .url-list::-webkit-scrollbar {
            width: 4px;
        }

        #cpamc-settings-modal .url-list::-webkit-scrollbar-track {
            background: transparent;
        }

        #cpamc-settings-modal .url-list::-webkit-scrollbar-thumb {
            background: var(--cpamc-scrollbar-thumb);
            border-radius: 2px;
        }

        #cpamc-settings-modal .url-list::-webkit-scrollbar-thumb:hover {
            background: var(--cpamc-scrollbar-hover);
        }

        #cpamc-settings-modal .url-item {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        #cpamc-settings-modal .url-item input {
            flex: 1;
        }

        #cpamc-settings-modal .btn-remove {
            position: relative;
            width: 38px;
            height: 38px;
            padding: 0;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--cpamc-input-bg);
            border: 1px solid var(--cpamc-input-border);
            border-radius: var(--cpamc-btn-radius);
            color: var(--cpamc-modal-label);
            cursor: pointer;
            transition: all 0.2s;
        }

        #cpamc-settings-modal .btn-remove:hover {
            background: rgba(245, 108, 108, 0.1);
            border-color: #F56C6C;
            color: #F56C6C;
        }

        #cpamc-settings-modal .btn-remove .confirm-badge {
            display: none;
            position: absolute;
            bottom: -5px;
            right: -5px;
            width: 18px;
            height: 18px;
            background: #F56C6C;
            border-radius: 50%;
            color: #fff;
            align-items: center;
            justify-content: center;
        }

        #cpamc-settings-modal .btn-remove.confirm .confirm-badge {
            display: flex;
        }

        #cpamc-settings-modal .btn-remove.confirm {
            border-color: #F56C6C;
            color: #F56C6C;
        }

        #cpamc-settings-modal .btn-add {
            width: 100%;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--cpamc-primary-bg);
            border: 1px dashed var(--cpamc-primary-border);
            border-radius: var(--cpamc-btn-radius);
            color: var(--cpamc-primary);
            cursor: pointer;
            transition: all 0.2s;
            font-size: 13px;
            font-weight: 500;
        }

        #cpamc-settings-modal .btn-add:hover {
            background: var(--cpamc-primary-bg-hover);
            border-color: var(--cpamc-primary);
        }

        #cpamc-settings-modal input {
            width: 100%;
            height: 38px;
            padding: 0 12px;
            font-size: 14px;
            border: 1px solid var(--cpamc-input-border);
            border-radius: var(--cpamc-btn-radius);
            background: var(--cpamc-input-bg);
            color: var(--cpamc-input-text);
            box-sizing: border-box;
            transition: border-color 0.2s;
        }

        #cpamc-settings-modal input:focus {
            outline: none;
            border-color: var(--cpamc-btn-hover-border);
        }

        #cpamc-settings-modal .modal-buttons {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }

        #cpamc-settings-modal button {
            height: 38px;
            padding: 0 20px;
            font-size: 14px;
            font-weight: 500;
            border-radius: var(--cpamc-btn-radius);
            cursor: pointer;
            transition: all 0.2s;
        }

        #cpamc-settings-modal .modal-buttons button {
            flex: 1;
        }

        #cpamc-settings-modal .btn-cancel {
            background: transparent;
            border: 1px solid var(--cpamc-btn-border);
            color: var(--cpamc-modal-label);
        }

        #cpamc-settings-modal .btn-cancel:hover {
            border-color: var(--cpamc-btn-hover-border);
            color: var(--cpamc-btn-hover-text);
            background-color: var(--cpamc-btn-hover-bg);
        }

        #cpamc-settings-modal .btn-save {
            background: var(--cpamc-primary);
            border: none;
            color: #fff;
        }

        #cpamc-settings-modal .btn-save:hover {
            background: var(--cpamc-primary-hover);
        }

        #cpamc-settings-modal .hint {
            margin-top: 4px;
            font-size: 11px;
            color: var(--cpamc-hint-color);
        }

        .cpamc-preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            padding: 20px;
            box-sizing: border-box;
        }

        .cpamc-preview-content {
            background: var(--cpamc-modal-bg);
            border: 1px solid var(--cpamc-modal-border);
            border-radius: 12px;
            padding: 20px;
            max-width: 90%;
            max-height: 90%;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: var(--cpamc-modal-shadow);
            position: relative;
        }

        .cpamc-preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: var(--cpamc-modal-title);
        }

        .cpamc-preview-header h3 {
            margin: 0;
            font-size: 16px;
        }

        .cpamc-preview-img-container {
            overflow: auto;
            border-radius: 8px;
            border: 1px solid var(--cpamc-modal-border);
            background: var(--cpamc-screenshot-bg);
        }

        .cpamc-preview-img-container img {
            display: block;
            max-width: 100%;
            height: auto;
        }

        .cpamc-preview-hint {
            font-size: 13px;
            color: var(--cpamc-primary);
            text-align: center;
            background: var(--cpamc-primary-bg);
            padding: 8px;
            border-radius: 6px;
        }

        .cpamc-preview-close {
            background: transparent;
            border: none;
            color: var(--cpamc-modal-label);
            cursor: pointer;
            padding: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s;
        }

        .cpamc-preview-close:hover {
            color: #F56C6C;
        }

        .cpamc-btn-group {
            display: flex;
            gap: 4px;
        }

        .cpamc-screenshot-btn {
            position: relative;
        }

        .cpamc-screenshot-btn .btn-badge {
            position: absolute;
            bottom: 2px;
            left: 2px;
            width: 10px;
            height: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .cpamc-screenshot-btn .btn-badge svg {
            width: 10px;
            height: 10px;
        }

        .cpamc-toast {
            position: fixed;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--cpamc-modal-bg);
            border: 1px solid var(--cpamc-modal-border);
            border-radius: 12px;
            padding: 12px 24px;
            font-size: 14px;
            font-weight: 500;
            color: var(--cpamc-modal-title);
            box-shadow: var(--cpamc-modal-shadow);
            z-index: 10001;
            transition: top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            white-space: nowrap;
        }

        .cpamc-toast.show {
            top: 20px;
        }

        .cpamc-toast.success {
            border-color: var(--cpamc-primary);
        }

        .cpamc-toast.error {
            border-color: #F56C6C;
        }
    `;

    function injectStyles() {
        if (document.getElementById('cpamc-enhanced-style')) return;
        const style = document.createElement('style');
        style.id = 'cpamc-enhanced-style';
        style.textContent = STYLES;
        document.head.appendChild(style);
    }

    function getEffectiveUrls() {
        const urls = GM_getValue(STORAGE_KEY, []);
        return urls.length > 0 ? urls : [DEFAULT_URL];
    }

    function isTargetUrl() {
        const urls = getEffectiveUrls();
        return urls.some(url => location.href.startsWith(url));
    }

    function showSettingsModal() {
        injectStyles();
        if (document.getElementById('cpamc-settings-modal')) return;
        let urls = GM_getValue(STORAGE_KEY, []);
        if (urls.length === 0) urls = [DEFAULT_URL];

        const modal = document.createElement('div');
        modal.id = 'cpamc-settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>CPAMC 额度截图设置</h3>
                <div class="form-group">
                    <label>CPAMC 地址</label>
                    <div class="url-list" id="cpamc-url-list"></div>
                    <button type="button" class="btn-add" id="cpamc-add-url">+ 添加地址</button>
                    <div class="hint">留空保存则使用默认值 ${DEFAULT_URL}</div>
                </div>
                <div class="modal-buttons">
                    <button class="btn-cancel">取消</button>
                    <button class="btn-save">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const urlList = document.getElementById('cpamc-url-list');
        const addUrlBtn = document.getElementById('cpamc-add-url');

        function createUrlItem(value = '') {
            const item = document.createElement('div');
            item.className = 'url-item';
            item.innerHTML = `
                <input type="text" value="${value}" placeholder="http://localhost:5140 或 https://cpamc.example.com">
                <button type="button" class="btn-remove">${ICONS.CLOSE}<span class="confirm-badge">${ICONS.QUESTION}</span></button>
            `;
            item.querySelector('input').addEventListener('blur', (e) => {
                let val = e.target.value.trim();
                try {
                    const url = new URL(val);
                    val = url.origin;
                } catch {}
                e.target.value = val.replace(/\/+$/, '');
            });
            const removeBtn = item.querySelector('.btn-remove');
            removeBtn.onclick = () => {
                if (urlList.children.length <= 1) return;
                if (removeBtn.classList.contains('confirm')) {
                    item.remove();
                } else {
                    removeBtn.classList.add('confirm');
                    setTimeout(() => removeBtn.classList.remove('confirm'), 2000);
                }
            };
            return item;
        }

        urls.forEach(url => urlList.appendChild(createUrlItem(url)));
        addUrlBtn.onclick = () => urlList.appendChild(createUrlItem());

        modal.querySelector('.btn-cancel').onclick = () => modal.remove();
        modal.querySelector('.btn-save').onclick = () => {
            const inputs = urlList.querySelectorAll('input');
            const newUrls = Array.from(inputs)
                .map(input => input.value.trim().replace(/\/+$/, ''))
                .filter(url => url);
            GM_setValue(STORAGE_KEY, newUrls);
            modal.remove();
            location.reload();
        };
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    }

    GM_registerMenuCommand('⚙️ 设置 CPAMC 地址', showSettingsModal);

    function showPreviewModal(blob) {
        injectStyles();
        const url = URL.createObjectURL(blob);
        const modal = document.createElement('div');
        modal.className = 'cpamc-preview-modal';
        modal.innerHTML = `
            <div class="cpamc-preview-content">
                <div class="cpamc-preview-header">
                    <h3>截图预览</h3>
                    <button class="cpamc-preview-close">${ICONS.CLOSE}</button>
                </div>
                <div class="cpamc-preview-hint">由于浏览器安全限制，请右键点击图片选择“复制图像”</div>
                <div class="cpamc-preview-img-container">
                    <img src="${url}" alt="screenshot preview">
                </div>
            </div>
        `;

        const closeModal = () => {
            modal.remove();
            URL.revokeObjectURL(url);
        };

        modal.querySelector('.cpamc-preview-close').onclick = closeModal;
        modal.onclick = (e) => { if (e.target === modal) closeModal(); };
        document.body.appendChild(modal);
    }

    function showToast(message, type = 'success') {
        const existing = document.querySelector('.cpamc-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `cpamc-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    function isDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function getBackgroundColor() {
        return isDarkMode() ? '#191919' : '#F3F4F6';
    }

    async function captureScreenshot(hideEmails = true) {
        const container = document.querySelector('.QuotaPage-module__container___CkTNE');
        if (!container) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        const hiddenElements = [];
        const cards = container.querySelectorAll('.card');
        const fileNameElements = container.querySelectorAll('.QuotaPage-module__fileName___ATlvN');
        const antigravityControls = container.querySelectorAll('.QuotaPage-module__antigravityControls___jdhuf');
        const geminiCliControls = container.querySelectorAll('.QuotaPage-module__geminiCliControls___aWZsx');
        const pageDescription = container.querySelector('.QuotaPage-module__description___qDPuI');
        const pageHeaderActions = container.querySelector('.QuotaPage-module__pageHeader___7RVAE .QuotaPage-module__headerActions___Jfu3A');
        const cardHeaderActions = container.querySelectorAll('.card .card-header .QuotaPage-module__headerActions___Jfu3A');

        cards.forEach(card => {
            if (card.querySelector('.empty-state')) {
                hiddenElements.push({ el: card, originalDisplay: card.style.display });
                card.style.display = 'none';
            }
        });

        [...antigravityControls, ...geminiCliControls].forEach(el => {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.display = 'none';
        });

        if (hideEmails) {
            fileNameElements.forEach(el => {
                hiddenElements.push({ el, originalVisibility: el.style.visibility });
                el.style.visibility = 'hidden';
            });
        }

        if (pageDescription) {
            hiddenElements.push({ el: pageDescription, originalDisplay: pageDescription.style.display });
            pageDescription.style.display = 'none';
        }

        if (pageHeaderActions) {
            hiddenElements.push({ el: pageHeaderActions, originalDisplay: pageHeaderActions.style.display });
            pageHeaderActions.style.display = 'none';
        }

        cardHeaderActions.forEach(el => {
            hiddenElements.push({ el, originalDisplay: el.style.display });
            el.style.display = 'none';
        });

        const btnGroup = document.querySelector('.cpamc-btn-group');
        if (btnGroup) btnGroup.style.visibility = 'hidden';

        // 临时给容器添加 padding 以确保截图有边距
        const originalPadding = container.style.padding;
        container.style.padding = '24px';

        try {
            const containerWidth = container.offsetWidth;
            const targetWidth = isMobile ? MIN_SCREENSHOT_WIDTH * 1.2 : MIN_SCREENSHOT_WIDTH;
            const scale = containerWidth < targetWidth ? (targetWidth / containerWidth) * 2 : 2;
            const bgColor = getBackgroundColor();

            const canvas = await html2canvas(container, {
                backgroundColor: bgColor,
                scale: scale,
                logging: false,
                useCORS: true,
                windowWidth: Math.max(containerWidth, targetWidth)
            });

            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        if (isMobile && navigator.share) {
                            const file = new File([blob], `cpamc-screenshot-${new Date().getTime()}.png`, { type: 'image/png' });
                            await navigator.share({
                                files: [file],
                                title: 'CPAMC 额度截图',
                            });
                            showToast(hideEmails ? '截图已触发分享（已隐藏邮箱）' : '截图已触发分享（显示邮箱）', 'success');
                        } else if (typeof ClipboardItem !== 'undefined') {
                            const item = new ClipboardItem({ "image/png": blob });
                            await navigator.clipboard.write([item]);
                            showToast(hideEmails ? '截图已复制（已隐藏邮箱）' : '截图已复制（显示邮箱）', 'success');
                        } else {
                            showPreviewModal(blob);
                            showToast('请在预览窗中手动复制', 'success');
                        }
                    } catch (err) {
                        console.error('Share/Clipboard API failed:', err);
                        if (err.name !== 'AbortError') {
                            showToast('操作失败，请重试', 'error');
                        }
                    }
                }
            }, 'image/png');

        } catch (err) {
            console.error('html2canvas failed:', err);
        } finally {
            // 恢复容器原始 padding
            container.style.padding = originalPadding;
            if (btnGroup) btnGroup.style.visibility = 'visible';
            hiddenElements.forEach(({ el, originalDisplay, originalVisibility }) => {
                if (originalDisplay !== undefined) el.style.display = originalDisplay;
                if (originalVisibility !== undefined) el.style.visibility = originalVisibility;
            });
        }
    }

    function createCopyButtons() {
        const pageHeaderActions = document.querySelector('.QuotaPage-module__pageHeader___7RVAE .QuotaPage-module__headerActions___Jfu3A');
        if (!pageHeaderActions || document.querySelector('.cpamc-btn-group')) return;

        const btnGroup = document.createElement('div');
        btnGroup.className = 'cpamc-btn-group';

        const btnVisible = document.createElement('button');
        btnVisible.className = 'btn btn-secondary btn-sm cpamc-screenshot-btn';
        btnVisible.style.marginRight = '4px';
        btnVisible.innerHTML = ICONS.VISIBLE;
        btnVisible.title = '复制截图（显示邮箱）';
        btnVisible.onclick = () => captureScreenshot(false);

        const btnHidden = document.createElement('button');
        btnHidden.className = 'btn btn-secondary btn-sm';
        btnHidden.style.marginRight = '8px';
        btnHidden.innerHTML = ICONS.COPY;
        btnHidden.title = '复制截图（隐藏邮箱）';
        btnHidden.onclick = () => captureScreenshot(true);

        btnGroup.appendChild(btnVisible);
        btnGroup.appendChild(btnHidden);
        pageHeaderActions.insertBefore(btnGroup, pageHeaderActions.firstChild);
    }

    function init() {
        injectStyles();
        const observer = new MutationObserver(() => {
            createCopyButtons();
        });
        observer.observe(document.body, { childList: true, subtree: true });
        createCopyButtons();
    }

    if (isTargetUrl()) {
        init();
    }
})();
