const { Plugin, PluginSettingTab, Setting, Notice, ItemView, WorkspaceLeaf, MarkdownRenderer, Modal } = require('obsidian');

// ========== 新建笔记 Modal ==========
class CreateNoteModal extends Modal {
  constructor(app, plugin, defaultFolderId, onSuccess) {
    super(app);
    this.plugin = plugin;
    this.defaultFolderId = defaultFolderId || '';
    this.onSuccess = onSuccess || null;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.style.padding = '20px';
    contentEl.innerHTML = '';

    contentEl.createEl('h2', { text: '✏️ 新建 IMA 笔记' });

    new Setting(contentEl).setName('标题').addText(t => {
      t.setPlaceholder('笔记标题');
      this.titleInput = t;
      t.inputEl.style.width = '100%';
    });

    new Setting(contentEl).setName('笔记本').setDesc('可选，留空则保存到默认位置').addDropdown(d => {
      this.folderDropdown = d;
      d.addOption('', '默认位置');
      d.selectEl.style.width = '100%';
      // 异步加载笔记本列表
      this.plugin.listFolders().then(data => {
        const folders = data.note_book_folders || [];
        folders.forEach(f => {
          const b = f.folder && f.folder.basic_info ? f.folder.basic_info : f;
          if (b.folder_type === 0) { // 只显示用户自建笔记本
            d.addOption(b.folder_id, b.name || b.folder_id);
          }
        });
        if (this.defaultFolderId) d.setValue(this.defaultFolderId);
      }).catch(e => console.error('[IMA] load folders failed:', e));
    });

    contentEl.createEl('label', { text: '内容（Markdown）' });
    const textarea = contentEl.createEl('textarea', {
      cls: 'ima-create-textarea'
    });
    textarea.style.cssText = 'width:100%;min-height:200px;margin-top:6px;padding:8px;border:1px solid #ccc;border-radius:4px;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box;';
    this.contentInput = textarea;

    const btnDiv = contentEl.createDiv({ cls: 'ima-create-btns' });
    btnDiv.style.cssText = 'display:flex;gap:8px;margin-top:16px;justify-content:flex-end;';

    const cancelBtn = btnDiv.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'padding:8px 16px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;';
    cancelBtn.onclick = () => this.close();

    const saveBtn = btnDiv.createEl('button', { text: '✅ 创建笔记' });
    saveBtn.style.cssText = 'padding:8px 16px;cursor:pointer;background:#27ae60;color:#fff;border:none;border-radius:4px;font-weight:bold;';
    saveBtn.onclick = async () => {
      const title = this.titleInput.getValue().trim();
      const content = this.contentInput.value.trim();
      if (!content) { new Notice('请输入笔记内容'); return; }
      const folderId = this.folderDropdown.getValue();
      const fullContent = title ? `# ${title}\n\n${content}` : content;

      saveBtn.disabled = true;
      saveBtn.textContent = '⏳ 创建中...';

      try {
        const result = await this.plugin.createNote(title, fullContent, folderId);
        new Notice(`✅ 笔记已创建: ${title || '无标题'} (ID: ${result.doc_id || ''})`);
        this.close();
        if (this.onSuccess) { setTimeout(() => this.onSuccess(), 100); }
      } catch (e) {
        new Notice(`❌ 创建失败: ${e.message}`);
        saveBtn.disabled = false;
        saveBtn.textContent = '✅ 创建笔记';
      }
    };

    setTimeout(() => { if (this.titleInput) this.titleInput.inputEl.focus(); }, 100);
  }

  onClose() { this.contentEl.empty(); }
}

// ========== 追加内容 Modal ==========
class AppendNoteModal extends Modal {
  constructor(app, plugin, docId, docTitle, onSuccess) {
    super(app);
    this.plugin = plugin;
    this.docId = docId;
    this.docTitle = docTitle;
    this.onSuccess = onSuccess || null;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.style.padding = '20px';
    contentEl.innerHTML = '';

    contentEl.createEl('h2', { text: `📎 追加到「${this.docTitle}」` });
    contentEl.createEl('p', { text: '内容将追加到笔记末尾，此操作不可撤销。', cls: 'setting-item-description' });

    const textarea = contentEl.createEl('textarea', {
      cls: 'ima-append-textarea'
    });
    textarea.style.cssText = 'width:100%;min-height:200px;padding:8px;border:1px solid #ccc;border-radius:4px;font-family:monospace;font-size:13px;resize:vertical;box-sizing:border-box;';
    this.contentInput = textarea;

    const btnDiv = contentEl.createDiv();
    btnDiv.style.cssText = 'display:flex;gap:8px;margin-top:16px;justify-content:flex-end;';

    const cancelBtn = btnDiv.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'padding:8px 16px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;';
    cancelBtn.onclick = () => this.close();

    const appendBtn = btnDiv.createEl('button', { text: '📎 追加内容' });
    appendBtn.style.cssText = 'padding:8px 16px;cursor:pointer;background:#e67e22;color:#fff;border:none;border-radius:4px;font-weight:bold;';
    appendBtn.onclick = async () => {
      const content = this.contentInput.value.trim();
      if (!content) { new Notice('请输入要追加的内容'); return; }

      appendBtn.disabled = true;
      appendBtn.textContent = '⏳ 追加中...';

      try {
        await this.plugin.appendNote(this.docId, '\n\n' + content);
        new Notice(`✅ 已追加到「${this.docTitle}」`);
        this.close();
        if (this.onSuccess) { setTimeout(() => this.onSuccess(), 100); }
      } catch (e) {
        new Notice(`❌ 追加失败: ${e.message}`);
        appendBtn.disabled = false;
        appendBtn.textContent = '📎 追加内容';
      }
    };

    setTimeout(() => textarea.focus(), 100);
  }

  onClose() { this.contentEl.empty(); }
}

// ========== IMA 侧边栏视图 ==========
class IMAView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.mode = 'search';
    this.navStack = [];
  }

  getViewType() { return 'ima-view'; }
  getDisplayText() { return 'IMA Notes'; }
  getIcon() { return 'search'; }

  async onOpen() { this.render(); }
  async onClose() {}

  pushNav(mode) {
    this.navStack.push({
      mode: this.mode, lastResult: this.lastResult, lastDocId: this.lastDocId,
      lastTitle: this.lastTitle, lastFolderName: this.lastFolderName, lastFolderId: this.lastFolderId,
      lastNotes: this.lastNotes
    });
  }

  popNav() {
    if (!this.navStack.length) return;
    const s = this.navStack.pop();
    this.mode = s.mode;
    if (s.lastResult !== undefined) this.lastResult = s.lastResult;
    if (s.lastDocId !== undefined) this.lastDocId = s.lastDocId;
    if (s.lastTitle !== undefined) this.lastTitle = s.lastTitle;
    if (s.lastFolderName !== undefined) this.lastFolderName = s.lastFolderName;
    if (s.lastFolderId !== undefined) this.lastFolderId = s.lastFolderId;
    if (s.lastNotes !== undefined) this.lastNotes = s.lastNotes;
    this.render();
  }


  // ====== 基础 Markdown → HTML 降级转换 ======
  _simpleMd(text) {
    if (!text) return '';
    return text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/^### (.+)$/gm,'<h3>$1</h3>')
      .replace(/^## (.+)$/gm,'<h2>$1</h2>')
      .replace(/^# (.+)$/gm,'<h1>$1</h1>')
      .replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,'<em>$1</em>')
      .replace(/^> (.+)$/gm,'<blockquote>$1</blockquote>')
      .replace(/^---$/gm,'<hr>')
      .replace(/\n/g,'<br>');
  }

  render() {
    const el = this.containerEl.children[1];
    if (!el) return;
    el.empty();
    el.style.cssText = 'padding:12px;font-size:13px;';

    this.renderTabs(el);

    if (this.mode === 'search' || this.mode === 'results' || this.mode === 'detail') {
      this.renderSearchMode(el);
    } else if (this.mode === 'folders' || this.mode === 'notes') {
      this.renderFolderMode(el);
    }
  }

  // ====== Tab 切换 ======
  renderTabs(el) {
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:0;margin-bottom:12px;border-bottom:2px solid #ddd;align-items:center;justify-content:space-between;';

    const tabsDiv = document.createElement('div');
    tabsDiv.style.cssText = 'display:flex;gap:0;';

    const tabs = [
      { id: 'search', label: '🔍 搜索', mode: 'search' },
      { id: 'folders', label: '📁 笔记本', mode: 'folders' }
    ];

    const activeTab = (this.mode === 'search' || this.mode === 'results' || this.mode === 'detail') ? 'search' : 'folders';

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.textContent = tab.label;
      btn.style.cssText = `padding:8px 16px;border:none;cursor:pointer;font-size:13px;border-radius:4px 4px 0 0;transition:all 0.2s;${
        activeTab === tab.id
          ? 'background:#0066cc;color:#fff;font-weight:bold;'
          : 'background:transparent;color:#666;'
      }`;
      btn.onmouseover = () => { if (activeTab !== tab.id) btn.style.background = '#f0f0f0'; };
      btn.onmouseout = () => { if (activeTab !== tab.id) btn.style.background = 'transparent'; };
      btn.onclick = () => {
        this.navStack = [];
        this.mode = tab.mode;
        this.render();
      };
      tabsDiv.appendChild(btn);
    });

    tabBar.appendChild(tabsDiv);

    // 新建按钮（右侧）
    const newBtn = document.createElement('button');
    newBtn.textContent = '✏️ 新建';
    newBtn.title = '新建 IMA 笔记';
    newBtn.style.cssText = 'padding:5px 12px;cursor:pointer;border:1px solid #27ae60;background:#27ae60;color:#fff;border-radius:4px;font-size:12px;font-weight:bold;';
    newBtn.onmouseover = () => newBtn.style.background = '#219a52';
    newBtn.onmouseout = () => newBtn.style.background = '#27ae60';
    newBtn.onclick = () => {
      const folderId = (this.mode === 'notes') ? this.lastFolderId : '';
      new CreateNoteModal(this.plugin.app, this.plugin, folderId, () => this.render()).open();
    };
    tabBar.appendChild(newBtn);

    el.appendChild(tabBar);
  }

  // ====== 搜索模式 ======
  renderSearchMode(el) {
    if (this.mode === 'search') this.renderSearch(el);
    else if (this.mode === 'results') this.renderResults(el);
    else if (this.mode === 'detail') this.renderDetail(el);
  }

  // ====== 文件夹模式 ======
  renderFolderMode(el) {
    if (this.mode === 'folders') this.renderFolders(el);
    else if (this.mode === 'notes') this.renderNotesList(el);
  }

  // ====== 搜索页 ======
  renderSearch(el) {
    el.insertAdjacentHTML('beforeend', '<h3 style="margin:0 0 12px;font-size:15px;">🔍 搜索笔记</h3>');

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = '输入关键词...';
    Object.assign(input.style, { width:'100%', padding:'8px', boxSizing:'border-box', border:'1px solid #ccc', borderRadius:'4px', marginBottom:'8px' });
    el.appendChild(input);

    const typeDiv = document.createElement('div');
    typeDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;align-items:center;';
    typeDiv.innerHTML = '<span style="color:#666;font-size:12px;">搜索范围：</span>';

    [{ label: '标题', value: '0' }, { label: '正文', value: '1' }].forEach((t, i) => {
      const radio = document.createElement('label');
      radio.style.cssText = 'font-size:12px;cursor:pointer;display:flex;align-items:center;gap:3px;';
      const chk = document.createElement('input');
      chk.type = 'radio'; chk.name = 'ima-search-type'; chk.value = t.value;
      if (i === 0) chk.checked = true;
      chk.style.margin = '0';
      radio.appendChild(chk);
      radio.appendChild(document.createTextNode(t.label));
      typeDiv.appendChild(radio);
    });
    el.appendChild(typeDiv);

    const btn = document.createElement('button');
    btn.textContent = '🔍 搜索';
    Object.assign(btn.style, { padding:'8px 20px', cursor:'pointer', background:'#0066cc', color:'#fff', border:'none', borderRadius:'4px', fontSize:'14px', width:'100%' });
    el.appendChild(btn);

    btn.addEventListener('click', async () => {
      const q = input.value.trim();
      if (!q) { new Notice('请输入关键词'); return; }
      const searchType = parseInt(typeDiv.querySelector('input[name="ima-search-type"]:checked')?.value || '0');
      btn.disabled = true; btn.textContent = '⏳ 搜索中...';
      try {
        this.lastResult = await this.plugin.searchNotes(q, searchType);
        this.pushNav('search');
        this.mode = 'results';
        this.render();
      } catch (e) {
        new Notice(`搜索失败: ${e.message}`);
        btn.disabled = false; btn.textContent = '🔍 搜索';
      }
    });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    setTimeout(() => input.focus(), 100);
  }

  // ====== 搜索结果页 ======
  renderResults(el) {
    el.insertAdjacentHTML('beforeend',
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <button id="ima-back" style="padding:6px 12px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:12px;">← 返回</button>
        <span style="color:#666;font-size:12px;">搜索结果</span>
      </div>`
    );
    document.getElementById('ima-back').onclick = () => this.popNav();

    const result = this.lastResult;
    if (!result || !result.docs || !result.docs.length) {
      el.insertAdjacentHTML('beforeend', '<p style="color:#888;padding:20px;text-align:center;">📭 没有找到相关笔记</p>');
      return;
    }

    el.insertAdjacentHTML('beforeend', `<p style="color:#666;margin-bottom:8px;font-size:12px;">找到 ${result.docs.length} 条结果（共 ${result.total_hit_num || '?'} 条）</p>`);

    for (let i = 0; i < result.docs.length; i++) {
      const doc = result.docs[i];
      const info = doc.doc.basic_info;
      const title = (info.title || '无标题').replace(/</g, '&lt;');
      const summary = (info.summary || '').replace(/</g, '&lt;');
      const folder = (info.folder_name || '').replace(/</g, '&lt;');
      const modTime = info.modify_time ? new Date(info.modify_time).toLocaleString('zh-CN') : '';

      const cardId = `ima-card-${i}`;
      el.insertAdjacentHTML('beforeend',
        `<div id="${cardId}" style="padding:10px 12px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:6px;cursor:pointer;transition:background 0.15s;">
          <div style="font-size:13px;font-weight:bold;color:#0066cc;margin-bottom:4px;">📄 ${title}</div>
          ${summary ? `<div style="font-size:12px;color:#555;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${summary}</div>` : ''}
          <div style="font-size:11px;color:#999;">📁 ${folder} · ${modTime}</div>
        </div>`
      );
      const cardEl = document.getElementById(cardId);
      if (cardEl) {
        cardEl.onmouseover = () => cardEl.style.background = '#f0f7ff';
        cardEl.onmouseout = () => cardEl.style.background = '#fff';
        cardEl.onclick = () => {
          this.lastDocId = info.docid;
          this.lastTitle = info.title || '无标题';
          this.pushNav('results');
          this.mode = 'detail';
          this.render();
        };
      }
    }

    if (!result.is_end) {
      el.insertAdjacentHTML('beforeend', '<button id="ima-more" style="padding:8px;width:100%;cursor:pointer;border:1px dashed #ccc;background:#fff;border-radius:4px;color:#666;font-size:12px;margin-top:6px;">加载更多...</button>');
      document.getElementById('ima-more').onclick = async () => {
        const btn = document.getElementById('ima-more');
        btn.textContent = '⏳ 加载中...'; btn.disabled = true;
        try {
          const more = await this.plugin.searchNotes(this.lastResult._query, this.lastResult._searchType, result.docs.length);
          this.lastResult.docs.push(...(more.docs || []));
          this.lastResult.is_end = more.is_end;
          this.lastResult.total_hit_num = more.total_hit_num || this.lastResult.total_hit_num;
          this.render();
        } catch (e) { new Notice(`加载失败: ${e.message}`); btn.textContent = '加载更多...'; btn.disabled = false; }
      };
    }
  }

  // ====== 详情页 ======
  async renderDetail(el) {
    el.insertAdjacentHTML('beforeend',
      `<div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;">
        <button id="ima-det-back" style="padding:6px 12px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:12px;">← 返回</button>
        <button id="ima-det-top" style="padding:6px 12px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:12px;">🏠 首页</button>
      </div>`
    );
    document.getElementById('ima-det-back').onclick = () => this.popNav();
    document.getElementById('ima-det-top').onclick = () => { this.navStack = []; this.mode = 'search'; this.render(); };

    const titleText = (this.lastTitle || '加载中...').replace(/</g, '&lt;');
    el.insertAdjacentHTML('beforeend', `<h3 style="margin:0 0 8px;font-size:15px;border-bottom:1px solid #eee;padding-bottom:8px;">${titleText}</h3>`);
    el.insertAdjacentHTML('beforeend', '<p id="ima-loading" style="color:#0066cc;padding:10px;text-align:center;">⏳ 正在加载内容...</p>');

    try {
      const data = await this.plugin.getNoteContent(this.lastDocId);
      let text = '';
      if (typeof data === 'string') text = data;
      else if (data && data.content) text = data.content;
      else if (data && data.note_content) text = data.note_content;
      else text = JSON.stringify(data, null, 2);

      const loading = document.getElementById('ima-loading');
      if (loading) loading.remove();

      // Markdown 渲染区
      const body = document.createElement('div');
      Object.assign(body.style, {
        maxHeight: '500px', overflowY: 'auto', padding: '12px',
        background: '#fafafa', borderRadius: '6px', fontSize: '13px',
        lineHeight: '1.7', border: '1px solid #eee'
      });
      el.appendChild(body);

      // 方案：renderMarkdown（最可靠）
      try {
        body.createDiv({ cls: 'ima-md-content' });
        const mdEl = body.querySelector('.ima-md-content');
        await MarkdownRenderer.renderMarkdown(this.plugin.app, text || '（空内容）', mdEl, '', this.plugin);
        // 给代码块加主题色
        mdEl.querySelectorAll('pre code').forEach(b => {
          b.parentElement.style.cssText = 'background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto;font-size:12px;';
        });
      } catch (e) {
        console.error('[IMA] MarkdownRenderer.renderMarkdown failed:', e);
        body.innerHTML = `<div class="ima-md-fallback">${this._simpleMd((text || '（空内容）'))}</div>`;
      }
      // Markdown 样式
      const style = document.createElement('style');
      style.textContent = `.ima-md-content{font-size:13px;line-height:1.7;}
        .ima-md-content h1,.ima-md-content h2,.ima-md-content h3{color:#333;margin:12px 0 6px;}
        .ima-md-content h1{font-size:16px;border-bottom:1px solid #eee;padding-bottom:6px;}
        .ima-md-content p{margin:6px 0;}
        .ima-md-content code{background:#f4f4f4;padding:1px 4px;border-radius:3px;font-size:12px;}
        .ima-md-content pre{background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto;}
        .ima-md-content blockquote{border-left:3px solid #ddd;margin:8px 0;padding-left:12px;color:#555;}
        .ima-md-content table{border-collapse:collapse;width:100%;}
        .ima-md-content th,.ima-md-content td{border:1px solid #eee;padding:6px 8px;}
        .ima-md-content th{background:#fafafa;}
        .ima-md-fallback{white-space:pre-wrap;word-break:break-all;font-size:13px;line-height:1.7;}`;
      body.prepend(style);

      // 操作按钮：导入 + 追加
      el.insertAdjacentHTML('beforeend',
        `<div style="margin-top:10px;display:flex;gap:8px;">
          <button id="ima-import-btn" style="padding:6px 14px;cursor:pointer;background:#27ae60;color:#fff;border:none;border-radius:4px;font-size:13px;">📥 导入到 Vault</button>
          <button id="ima-append-btn" style="padding:6px 14px;cursor:pointer;background:#e67e22;color:#fff;border:none;border-radius:4px;font-size:13px;">📎 追加内容</button>
        </div>`
      );
      document.getElementById('ima-import-btn').onclick = () => {
        this.plugin.showImportModal(this.lastDocId, this.lastTitle, null);
      };
      document.getElementById('ima-append-btn').onclick = () => {
        new AppendNoteModal(this.plugin.app, this.plugin, this.lastDocId, this.lastTitle, () => this.render()).open();
      };

    } catch (e) {
      const loading = document.getElementById('ima-loading');
      if (loading) { loading.textContent = `❌ 加载失败: ${e.message}`; loading.style.color = 'red'; }
    }
  }

  // ====== 笔记本列表页 ======
  async renderFolders(el) {
    el.insertAdjacentHTML('beforeend', '<h3 style="margin:0 0 12px;font-size:15px;">📁 笔记本</h3>');
    el.insertAdjacentHTML('beforeend', '<p id="ima-folders-loading" style="color:#0066cc;text-align:center;padding:10px;">⏳ 加载笔记本列表...</p>');

    try {
      const data = await this.plugin.listFolders();
      const loading = document.getElementById('ima-folders-loading');
      if (loading) loading.remove();

      const folders = data.note_book_folders || [];
      if (!folders.length) {
        el.insertAdjacentHTML('beforeend', '<p style="color:#888;text-align:center;padding:20px;">📭 没有笔记本</p>');
        return;
      }

      for (let i = 0; i < folders.length; i++) {
        const f = folders[i];
        const basic = f.folder && f.folder.basic_info ? f.folder.basic_info : f;
        const folderId = basic.folder_id;
        const name = (basic.name || '未命名').replace(/</g, '&lt;');
        const count = basic.note_number || 0;
        const modTime = basic.modify_time ? new Date(basic.modify_time).toLocaleString('zh-CN') : '';
        const folderType = basic.folder_type;
        const typeLabel = folderType === 1 ? '📋' : folderType === 2 ? '📂 未分类' : '📁';

        const cardId = `ima-folder-${i}`;
        el.insertAdjacentHTML('beforeend',
          `<div id="${cardId}" style="padding:10px 12px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:6px;cursor:pointer;transition:background 0.15s;">
            <div style="font-size:13px;font-weight:bold;color:#333;">${typeLabel} ${name}</div>
            <div style="font-size:11px;color:#999;margin-top:4px;">${count} 篇笔记 · ${modTime}</div>
          </div>`
        );
        const cardEl = document.getElementById(cardId);
        if (cardEl) {
          cardEl.onmouseover = () => cardEl.style.background = '#f0f7ff';
          cardEl.onmouseout = () => cardEl.style.background = '#fff';
          cardEl.onclick = () => {
            this.lastFolderId = folderId;
            this.lastFolderName = name;
            this.pushNav('folders');
            this.mode = 'notes';
            this.render();
          };
        }
      }
    } catch (e) {
      const loading = document.getElementById('ima-folders-loading');
      if (loading) { loading.textContent = `❌ 加载失败: ${e.message}`; loading.style.color = 'red'; }
    }
  }

  // ====== 笔记本内笔记列表页 ======
  async renderNotesList(el) {
    const folderName = (this.lastFolderName || '').replace(/</g, '&lt;');
    el.insertAdjacentHTML('beforeend',
      `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <button id="ima-notes-back" style="padding:6px 12px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;font-size:12px;">← 笔记本</button>
        <span style="color:#666;font-size:12px;font-weight:bold;">${folderName}</span>
      </div>`
    );
    document.getElementById('ima-notes-back').onclick = () => this.popNav();

    el.insertAdjacentHTML('beforeend', '<p id="ima-notes-loading" style="color:#0066cc;text-align:center;padding:10px;">⏳ 加载笔记列表...</p>');

    try {
      const data = await this.plugin.listNotesByFolder(this.lastFolderId);
      const loading = document.getElementById('ima-notes-loading');
      if (loading) loading.remove();

      const notes = data.note_book_list || [];
      if (!notes.length) {
        el.insertAdjacentHTML('beforeend', '<p style="color:#888;text-align:center;padding:20px;">📭 这个笔记本里没有笔记</p>');
        return;
      }

      for (let i = 0; i < notes.length; i++) {
        const n = notes[i];
        const info = n.basic_info && n.basic_info.basic_info ? n.basic_info.basic_info : (n.basic_info || n);
        const docid = info.docid;
        const title = (info.title || '无标题').replace(/</g, '&lt;');
        const summary = (info.summary || '').replace(/</g, '&lt;');
        const modTime = info.modify_time ? new Date(info.modify_time).toLocaleString('zh-CN') : '';

        const cardId = `ima-note-${i}`;
        el.insertAdjacentHTML('beforeend',
          `<div id="${cardId}" style="padding:10px 12px;border:1px solid #e0e0e0;border-radius:6px;margin-bottom:6px;cursor:pointer;transition:background 0.15s;">
            <div style="font-size:13px;font-weight:bold;color:#0066cc;margin-bottom:4px;">📄 ${title}</div>
            ${summary ? `<div style="font-size:12px;color:#555;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${summary}</div>` : ''}
            <div style="font-size:11px;color:#999;">${modTime}</div>
          </div>`
        );
        const cardEl = document.getElementById(cardId);
        if (cardEl) {
          cardEl.onmouseover = () => cardEl.style.background = '#f0f7ff';
          cardEl.onmouseout = () => cardEl.style.background = '#fff';
          cardEl.onclick = () => {
            this.lastDocId = docid;
            this.lastTitle = info.title || '无标题';
            this.pushNav('notes');
            this.mode = 'detail';
            this.render();
          };
        }
      }

      // 加载更多
      if (!data.is_end) {
        el.insertAdjacentHTML('beforeend', '<button id="ima-notes-more" style="padding:8px;width:100%;cursor:pointer;border:1px dashed #ccc;background:#fff;border-radius:4px;color:#666;font-size:12px;margin-top:6px;">加载更多...</button>');
        document.getElementById('ima-notes-more').onclick = async () => {
          const btn = document.getElementById('ima-notes-more');
          btn.textContent = '⏳ 加载中...'; btn.disabled = true;
          try {
            const more = await this.plugin.listNotesByFolder(this.lastFolderId, data.next_cursor);
            notes.push(...(more.note_book_list || []));
            data.next_cursor = more.next_cursor;
            data.is_end = more.is_end;
            this.render();
          } catch (e) { new Notice(`加载失败: ${e.message}`); btn.textContent = '加载更多...'; btn.disabled = false; }
        };
      }
    } catch (e) {
      const loading = document.getElementById('ima-notes-loading');
      if (loading) { loading.textContent = `❌ 加载失败: ${e.message}`; loading.style.color = 'red'; }
    }
  }
}

// ========== 插件主类 ==========
class IMAPlugin extends Plugin {
  async onload() {
    console.log('[IMA] v1.2 loading...');
    await this.loadSettings();

    this.registerView('ima-view', (leaf) => new IMAView(leaf, this));
    this.addSettingTab(new IMASettingTab(this.app, this));

    this.addRibbonIcon('search', 'IMA Notes', () => this.activateView());
    this.addCommand({ id: 'open-ima-panel', name: 'Open IMA Panel', callback: () => this.activateView() });
    this.addCommand({ id: 'search-ima-notes', name: 'Search IMA Notes', callback: () => this._openToMode('search') });
    this.addCommand({ id: 'browse-ima-folders', name: 'Browse IMA Folders', callback: () => this._openToMode('folders') });
    this.addCommand({ id: 'create-ima-note', name: 'Create IMA Note', callback: () => {
      const leaf = this.app.workspace.getLeavesOfType('ima-view')[0];
      const view = leaf ? this.app.workspace.getViewOfLeaf(leaf) : null;
      new CreateNoteModal(this.app, this, '', view ? () => view.render() : null).open();
    }});

    this.addStatusBarItem().setText('IMA v1.2');
    console.log('[IMA] v1.2 OK');
  }

  _openToMode(mode) {
    this.activateView().then(() => {
      const leaves = this.app.workspace.getLeavesOfType('ima-view');
      if (leaves.length && leaves[0].view) {
        leaves[0].view.mode = mode;
        leaves[0].view.navStack = [];
        leaves[0].view.render();
      }
    });
  }

  onunload() {}

  // ====== v1.2: 导入笔记到指定文件夹 ======
  showImportModal(docId, title, content) {
    new ImportNoteModal(this.app, this, docId, title, content).open();
  }

  async importNoteToVault(docId, title) {
    this.checkCreds();
    new Notice('⏳ 正在获取笔记内容...');
    try {
      const data = await this.getNoteContent(docId);
      let text = '';
      if (typeof data === 'string') text = data;
      else if (data && data.content) text = data.content;
      else if (data && data.note_content) text = data.note_content;
      else text = JSON.stringify(data, null, 2);
      this.showImportModal(docId, title, text);
    } catch (e) {
      new Notice(`❌ 获取笔记内容失败: ${e.message}`);
    }
  }

  async loadSettings() { this.settings = Object.assign({}, { clientId: '', apiKey: '' }, await this.loadData()); }
  async saveSettings() { await this.saveData(this.settings); }

  async activateView() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType('ima-view')[0];
    if (!leaf) { leaf = workspace.getRightLeaf(false); await leaf.setViewState({ type: 'ima-view' }); }
    workspace.revealLeaf(leaf);
  }

  checkCreds() {
    if (!this.settings.clientId || !this.settings.apiKey)
      throw new Error('请先在 Settings → IMA Plugin 中配置凭证');
  }
  hdrs() {
    return { 'ima-openapi-clientid': this.settings.clientId, 'ima-openapi-apikey': this.settings.apiKey, 'Content-Type': 'application/json' };
  }
  parse(r) {
    if (r.status < 200 || r.status >= 300) {
      if (r.status === 0) throw new Error('网络连接失败，请检查网络或代理设置');
      if (r.status === 401) throw new Error('认证失败，请检查 Client ID 和 API Key');
      if (r.status === 403) throw new Error('无权限，请检查凭证是否有对应权限');
      if (r.status === 429) throw new Error('请求过于频繁，请稍后再试');
      if (r.status >= 500) throw new Error('IMA 服务器异常，请稍后再试');
      throw new Error(`HTTP ${r.status}`);
    }
    const d = JSON.parse(r.text);
    if (d.error_code && d.error_code !== 0) {
      const msgs = {10001:'签名验证失败',10002:'参数错误',10003:'无权限',10004:'资源不存在',10005:'频率限制',10006:'服务不可用'};
      throw new Error(msgs[d.error_code] || `API ${d.error_code}: ${d.error_msg || '未知错误'}`);
    }
    return d.data;
  }

  async searchNotes(q, searchType, offset) {
    this.checkCreds();
    const start = offset || 0;
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/search_note_book',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ search_type: searchType || 0, query_info: { title: q }, start, end: start + 20 })
    });
    const data = this.parse(r);
    data._query = q; data._searchType = searchType || 0;
    return data;
  }

  async listFolders(cursor) {
    this.checkCreds();
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/list_note_folder_by_cursor',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ cursor: cursor || '0', limit: 50 })
    });
    return this.parse(r);
  }

  async listNotesByFolder(folderId, cursor) {
    this.checkCreds();
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/list_note_by_folder_id',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ folder_id: folderId || '', cursor: cursor || '', limit: 50 })
    });
    return this.parse(r);
  }

  async getNoteContent(docId) {
    this.checkCreds();
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/get_doc_content',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ doc_id: docId, target_content_format: 1 })
    });
    return this.parse(r);
  }

  async createNote(title, content, folderId) {
    this.checkCreds();
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/import_doc',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ content_format: 1, content: content, ...(folderId ? { folder_id: folderId } : {}) })
    });
    return this.parse(r);
  }

  async appendNote(docId, content) {
    this.checkCreds();
    const r = await requestUrl({
      url: 'https://ima.qq.com/openapi/note/v1/append_doc',
      method: 'POST', headers: this.hdrs(),
      body: JSON.stringify({ doc_id: docId, content_format: 1, content: content })
    });
    return this.parse(r);
  }

  // ========== v1.1: 测试连接 ==========
  async testConnection() {
    const { clientId, apiKey } = this.settings;
    if (!clientId || !apiKey) throw new Error('未配置凭证');
    const resp = await this.app.requestUrl({
      url: 'https://ima.qq.com/openapi/v2/folder/list',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cursor: '', limit: 5, client_id: clientId, api_key: apiKey })
    });
    return JSON.parse(resp.text);
  }

// ========== 设置 ==========
}

// ========== v1.2: 导入笔记 Modal ==========
class ImportNoteModal extends Modal {
  constructor(app, plugin, docId, title, content) {
    super(app);
    this.plugin = plugin;
    this.docId = docId;
    this.title = (title || 'IMA Note').replace(/</g, '&lt;');
    this.content = content || '';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.style.padding = '20px';
    contentEl.innerHTML = '';
    contentEl.createEl('h2', { text: '📥 导入笔记到 Vault' });
    contentEl.createEl('p', { text: `笔记：「${this.title}」`, cls: 'setting-item-description' });

    // 文件名输入
    const safeDefault = (this.title || 'IMA Note').replace(/[\\/:*?"<>|]/g, '_').slice(0, 50);
    new Setting(contentEl).setName('文件名').setDesc('自动添加 .md 后缀')
      .addText(t => { t.setValue(safeDefault).inputEl.style.width = '100%'; this.filenameInput = t; });

    // 文件夹选择
    new Setting(contentEl).setName('保存到').setDesc('选择 vault 文件夹（留空 = 根目录）')
      .addDropdown(d => {
        this.folderDropdown = d;
        d.addOption('', '📁 根目录');
        const collect = (folder, prefix) => {
          for (const child of folder.children) {
            try {
              if (child.children !== undefined) {
                const p = prefix ? prefix + '/' + child.name : child.name;
                d.addOption(p, '📂 ' + p);
                collect(child, p);
              }
            } catch(e) {}
          }
        };
        collect(this.plugin.app.vault.getRoot(), '');
      });

    // 按钮
    const btnDiv = contentEl.createDiv();
    btnDiv.style.cssText = 'display:flex;gap:8px;margin-top:16px;justify-content:flex-end;';
    const cancelBtn = btnDiv.createEl('button', { text: '取消' });
    cancelBtn.style.cssText = 'padding:8px 16px;cursor:pointer;border:1px solid #ddd;background:#fff;border-radius:4px;';
    cancelBtn.onclick = () => this.close();
    const importBtn = btnDiv.createEl('button', { text: '📥 导入' });
    importBtn.style.cssText = 'padding:8px 16px;cursor:pointer;background:#27ae60;color:#fff;border:none;border-radius:4px;font-weight:bold;';
    importBtn.onclick = async () => {
      const filename = (this.filenameInput.getValue() || this.title).replace(/[\\/:*?"<>|]/g, '_').trim();
      const folder = this.folderDropdown.getValue();
      const fullName = folder ? folder + '/' + filename + '.md' : filename + '.md';
      importBtn.disabled = true; importBtn.textContent = '⏳ 导入中...';
      try {
        // 确保父文件夹存在
        if (folder) {
          const parts = folder.split('/');
          let path = '';
          for (const part of parts) {
            path += (path ? '/' : '') + part;
            let f;
            try { f = this.plugin.app.vault.getAbstractFileByPath(path); } catch(e) { f = null; }
            if (!f) await this.plugin.app.vault.createFolder(path);
          }
        }
        const existing = this.plugin.app.vault.getAbstractFileByPath(fullName);
        if (existing) {
          if (!confirm(`文件 "${fullName}" 已存在，覆盖吗？`)) {
            importBtn.disabled = false; importBtn.textContent = '📥 导入'; return;
          }
          await this.plugin.app.vault.modify(existing, this.content);
          new Notice(`✅ 已覆盖: ${fullName}`);
        } else {
          const file = await this.plugin.app.vault.create(fullName, this.content);
          new Notice(`✅ 已导入: ${fullName}`);
          await this.plugin.app.workspace.getLeaf(false).openFile(file);
        }
        this.close();
      } catch (e) {
        new Notice(`❌ 导入失败: ${e.message}`);
        importBtn.disabled = false; importBtn.textContent = '📥 导入';
      }
    };
  }

  onClose() { this.contentEl.empty(); }
}

class IMASettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }
  display() {
    const el = this.containerEl; el.empty();
    el.createEl('h2', { text: '🔧 IMA Plugin v1.2' });
    el.createEl('p', { text: '在 ima.qq.com 上获取 OpenAPI 凭证', cls: 'setting-item-description' });

    new Setting(el).setName('Client ID').setDesc('IMA OpenAPI Client ID')
      .addText(t => t.setPlaceholder('Client ID').setValue(this.plugin.settings.clientId)
        .onChange(async v => { this.plugin.settings.clientId = v; await this.plugin.saveSettings(); }));
    new Setting(el).setName('API Key').setDesc('IMA OpenAPI API Key')
      .addText(t => t.setPlaceholder('API Key').setValue(this.plugin.settings.apiKey)
        .onChange(async v => { this.plugin.settings.apiKey = v; await this.plugin.saveSettings(); }));

    new Setting(el).setName('测试连接').setDesc('验证 Client ID 和 API Key 是否有效')
      .addButton(b => {
        b.setButtonText('🔗 测试连接');
        b.buttonEl.style.cssText = 'background:#0066cc;color:#fff;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;';
        b.onClick(async () => {
          const cid = this.plugin.settings.clientId.trim();
          const key = this.plugin.settings.apiKey.trim();
          if (!cid || !key) { new Notice('❌ 请先填写 Client ID 和 API Key'); return; }
          b.setButtonText('⏳ 测试中...');
          b.setDisabled(true);
          try {
            const resp = await this.plugin.testConnection();
            if (resp && resp.note_book_folders) {
              new Notice(`✅ 连接成功！发现 ${resp.note_book_folders.length} 个笔记本`);
            } else {
              new Notice('⚠️ 连接响应异常，请检查凭证');
            }
          } catch(e) {
            new Notice(`❌ 连接失败: ${e.message}`);
          } finally {
            b.setButtonText('🔗 测试连接');
            b.setDisabled(false);
          }
        });
      });
  }
}

module.exports = IMAPlugin;
