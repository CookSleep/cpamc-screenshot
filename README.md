# CPAMC 额度截图复制

![Version](https://img.shields.io/badge/version-1.2-blue) ![License](https://img.shields.io/badge/license-GPLv3-brightgreen)

为 [CPAMC](https://github.com/router-for-me/CLIProxyAPI) 配额管理页面添加 **一键截图复制/分享** 功能，支持 **移动端适配**、**脱敏**、**非安全上下文降级**、**多地址配置**，方便快速分享配额状态。

## ✨ 功能特性

### 1. 📸 一键截图复制/分享
- **双模式支持**：
  - **`M` (Mail)**：点击圆角方形 `M` 按钮，截取包含邮箱等完整信息的配额图。
  - **`Copy` (Hidden)**：点击纯复制图标按钮，自动隐藏邮箱文件名，仅保留配额数值，保护隐私。
- **跨端适配与降级逻辑**：
  - **移动端**：智能触发系统 **分享 API**，一键发送截图给好友或保存到相册。
  - **PC 端**：在 HTTPS 或 localhost 环境下，自动复制高清截图到剪贴板。
  - **非安全上下文降级**：在 HTTP 非本地环境下（如内网 IP 访问），由于浏览器安全限制无法使用剪贴板 API，脚本会自动改为 **下载图片文件**，确保功能始终可用。
- **自动清理**：截图时会自动移除页面上的按钮、描述文字、刷新链接以及无认证的空卡片，确保画面纯净。

### 2. ⚙️ 多控制台支持
- **自定义 URL**：支持配置多个 CPAMC 地址，适用于本地、服务器或自定义域名。
- **设置菜单**：通过篡改猴菜单打开设置弹窗，随时修改 CPAMC 地址。
- **智能识别**：仅在配置的 URL 页面中激活，无感运行。

## 📸 效果预览

<img width="315" height="175" alt="image" src="https://github.com/user-attachments/assets/10c79f91-61fb-4a05-b856-f245d5493e44" />

<img width="2896" height="2570" alt="image" src="https://github.com/user-attachments/assets/d68dd970-3efb-48ba-8b21-625ef9777bb5" />

## 🚀 安装方法

你需要先在浏览器中安装脚本管理器，如 **Tampermonkey** (篡改猴)。

1. 安装 Tampermonkey 插件 ([Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) / [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) / [Firefox](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/))。

2. 点击下方链接直接安装脚本：
   
   👉 **[点击安装 CPAMC 额度截图复制](https://github.com/CookSleep/cpamc-screenshot/raw/main/cpamc-screenshot.user.js)**

3. **参考下方“设置说明”**，完成设置。

4. 打开/刷新你的 CPAMC 配额管理页面，功能将自动生效。

## 🛠️ 设置说明

脚本默认使用 `http://127.0.0.1:8317` 作为 CPAMC 地址。

**配置方式：**
1. 点击浏览器工具栏中的篡改猴图标。
2. 选择「⚙️ 设置 CPAMC 地址」打开设置弹窗。
3. 添加或修改你的 CPAMC URL，保存后页面将自动刷新。

## 🤝 贡献

欢迎提交 Issue 或 Pull Request 来改进代码！
