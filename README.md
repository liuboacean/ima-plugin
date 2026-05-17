# Obsidian IMA Plugin

将 [IMA](https://ima.qq.com) 知识库和笔记无缝集成到 [Obsidian](https://obsidian.md)。

[![GitHub release](https://img.shields.io/github/v/release/liuboacean/obsidian-ima-plugin)](https://github.com/liuboacean/obsidian-ima-plugin/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

![v0.9 Screenshot](https://img.shields.io/badge/version-0.9.0-blue)

## ✨ 功能

- 🔍 **搜索笔记** — 按标题或正文搜索 IMA 笔记，支持分页加载
- 📁 **浏览笔记本** — 直接浏览 IMA 笔记本目录，逐级查看笔记
- 📖 **查看笔记** — 在 Obsidian 侧边栏中渲染 Markdown 格式查看笔记内容
- 📥 **导入到 Vault** — 一键将 IMA 笔记导入为 Obsidian 的 .md 文件
- 🧭 **导航栈** — 多层页面间自由前进/后退
- ⌨️ **命令面板** — 快捷键 Cmd/Ctrl+P 唤出 IMA 面板或直接搜索

## 📦 安装

### 手动安装

1. 从 [Releases](https://github.com/liuboacean/obsidian-ima-plugin/releases) 下载最新版本
2. 解压到 vault 的 `.obsidian/plugins/obsidian-ima-plugin/` 目录
3. 完全退出 Obsidian 后重新打开
4. 在 **Settings → Community plugins** 中启用

### 从源码

```bash
git clone https://github.com/liuboacean/obsidian-ima-plugin.git
# 将 main.js, manifest.json, styles.css 复制到
# your-vault/.obsidian/plugins/obsidian-ima-plugin/
```

## ⚙️ 配置

### 获取 IMA 凭证

1. 访问 [ima.qq.com](https://ima.qq.com) 开放平台
2. 创建应用，获取 **Client ID** 和 **API Key**

### 插件设置

1. Obsidian → Settings → Community plugins → **IMA Plugin**
2. 填入 **Client ID** 和 **API Key**
3. 保存即可

## 🚀 使用

### 方式 1：侧边栏面板

点击左侧 Ribbon 的 🔍 图标，打开 IMA 面板：

| Tab | 功能 |
|-----|------|
| **🔍 搜索** | 输入关键词搜索笔记，支持标题/正文搜索 |
| **📁 笔记本** | 浏览所有笔记本，点击进入查看笔记列表 |

### 方式 2：命令面板

`Cmd/Ctrl + P` → 输入 `IMA`：

- **Open IMA Panel** — 打开侧边栏面板
- **Search IMA Notes** — 直接打开搜索
- **Browse IMA Folders** — 直接浏览笔记本

### 导入笔记

在笔记详情页点击 **📥 导入到 Vault**，自动以 Markdown 格式保存到 Vault 并打开。

## 🛠️ 技术实现

- 纯 JavaScript（无 TypeScript 编译依赖）
- 使用 Obsidian `requestUrl` API 调用 IMA OpenAPI
- `MarkdownRenderer` 原生渲染笔记内容
- 事件绑定使用 `innerHTML` + `getElementById` + `onclick`（兼容性最佳）

### API 端点

| 端点 | 用途 |
|------|------|
| `/openapi/note/v1/search_note_book` | 搜索笔记 |
| `/openapi/note/v1/list_note_folder_by_cursor` | 列出笔记本 |
| `/openapi/note/v1/list_note_by_folder_id` | 列出笔记本内的笔记 |
| `/openapi/note/v1/get_doc_content` | 获取笔记内容 |
| `/openapi/note/v1/import_doc` | 新建笔记 |
| `/openapi/note/v1/append_doc` | 追加内容到笔记 |

## 📝 Changelog

### v0.9.0
- 📁 笔记本浏览功能
- 🧭 导航栈（多层返回）
- 🔍 标题/正文搜索切换
- ⌨️ 新增命令面板命令
- 📄 搜索结果分页加载

### v0.8.1
- 🐛 修复 MarkdownRenderer API 调用
- 🎨 内容使用 Obsidian 原生 Markdown 渲染

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md)
- [IMA](https://ima.qq.com)

---

**Made by [Liu Bo](https://github.com/liuboacean)**
