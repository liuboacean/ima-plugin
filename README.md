# Ima Vault

Integrate [IMA](https://ima.qq.com) knowledge base and notes seamlessly into [Obsidian](https://obsidian.md).

[![GitHub release](https://img.shields.io/github/v/release/liuboacean/ima-plugin)](https://github.com/liuboacean/ima-plugin/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

将腾讯 IMA 知识库和笔记无缝集成到 Obsidian，支持搜索、浏览、导入和阅读。

---

## ✨ Features / 功能

- 🔍 **Search Notes** — Search IMA notes by title or content, with pagination support
- 📁 **Browse Notebooks** — Browse IMA notebook directories, drill into notes
- 📖 **View Notes** — Render notes in Obsidian sidebar with native Markdown rendering
- 📥 **Import to Vault** — One-click import of IMA notes as .md files into your vault
- 🧭 **Navigation Stack** — Forward/back navigation between multiple pages
- ⌨️ **Command Palette** — Cmd/Ctrl+P to open IMA panel or search directly

## 📦 Installation / 安装

### From Community Plugins (recommended) / 从社区插件市场安装（推荐）

1. Open Obsidian → Settings → Community plugins
2. Search for "Ima Vault"
3. Click Install, then Enable

### Manual Install / 手动安装

1. Download the latest `main.js`, `manifest.json`, and `styles.css` from [Releases](https://github.com/liuboacean/ima-plugin/releases)
2. Copy them to `your-vault/.obsidian/plugins/ima/`
3. Restart Obsidian
4. Enable in **Settings → Community plugins**

## ⚙️ Configuration / 配置

### Get IMA Credentials / 获取 IMA 凭证

1. Visit [ima.qq.com](https://ima.qq.com) Open Platform / 开放平台
2. Create an app to get your **Client ID** and **API Key**

### Plugin Setup / 插件设置

1. Obsidian → Settings → Community plugins → **Ima Vault**
2. Enter your **Client ID** and **API Key**
3. Save — you're ready to go

## 🚀 Usage / 使用

### Method 1: Sidebar Panel

Click the 🔍 icon in the left ribbon to open the IMA panel:

| Tab | Description |
|-----|-------------|
| **🔍 Search** | Search notes by keyword (title/body) |
| **📁 Notebooks** | Browse all notebooks, view notes inside |

### Method 2: Command Palette

`Cmd/Ctrl + P` → type `IMA`:

- **Open IMA Panel** — Open sidebar panel
- **Search IMA Notes** — Open search directly
- **Browse IMA Folders** — Browse notebooks directly

### Import Notes

On note detail page, click **📥 Import to Vault** to save as Markdown and open in your vault.

## 🛠️ Technical Notes / 技术实现

- Pure JavaScript (no TypeScript compilation dependency)
- Uses Obsidian `requestUrl` API for IMA OpenAPI calls
- `MarkdownRenderer` for native note rendering
- Event binding: `innerHTML` + `getElementById` + `onclick`

### API Endpoints

| Endpoint | Usage |
|----------|-------|
| `/openapi/note/v1/search_note_book` | Search notes |
| `/openapi/note/v1/list_note_folder_by_cursor` | List notebooks |
| `/openapi/note/v1/list_note_by_folder_id` | List notes in notebook |
| `/openapi/note/v1/get_doc_content` | Get note content |
| `/openapi/note/v1/import_doc` | Create note |
| `/openapi/note/v1/append_doc` | Append to note |

## 📝 Changelog

### v0.9.0
- 📁 Browse notebooks
- 🧭 Navigation stack
- 🔍 Title/body search toggle
- ⌨️ New command palette commands
- 📄 Pagination for search results

### v0.8.1
- 🐛 Fix MarkdownRenderer API call
- 🎨 Native Markdown rendering

## 📄 License

[MIT](LICENSE)

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md)
- [IMA](https://ima.qq.com)

---

**Made by [Liu Bo](https://github.com/liuboacean)**
