import { Plugin, WorkspaceLeaf, ItemView } from 'obsidian';
import { IMAClient } from './ima-api';
import { IMAPluginSettings, DEFAULT_SETTINGS, IMASettingTab } from './settings';

export default class IMAPlugin extends Plugin {
  settings: IMAPluginSettings;
  client: IMAClient | null = null;

  async onload() {
    console.log('loading IMA plugin');

    await this.loadSettings();
    this.updateClient();

    // 注册视图
    this.registerView('ima-view', (leaf) => new IMAView(leaf, this));

    // 添加设置标签页
    this.addSettingTab(new IMASettingTab(this.app, this));

    // 添加侧边栏图标
    this.addRibbonIcon('search', 'Open IMA', () => {
      this.activateView();
    });

    // 添加命令：搜索 IMA 笔记
    this.addCommand({
      id: 'search-ima-notes',
      name: 'Search IMA Notes',
      callback: () => {
        this.searchNotes();
      },
    });

    // 添加命令：浏览 IMA 笔记本
    this.addCommand({
      id: 'browse-ima-notebooks',
      name: 'Browse IMA Notebooks',
      callback: () => {
        this.browseNotebooks();
      },
    });

    this.addStatusBarItem().setText('IMA loaded');
  }

  onunload() {
    console.log('unloading IMA plugin');
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateClient();
  }

  updateClient() {
    if (this.settings.clientId && this.settings.apiKey) {
      this.client = new IMAClient({
        clientId: this.settings.clientId,
        apiKey: this.settings.apiKey,
      });
    } else {
      this.client = null;
    }
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType('ima-view');

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      await leaf.setViewState({ type: 'ima-view' });
    }

    workspace.revealLeaf(leaf);
  }

  async searchNotes() {
    if (!this.client) {
      new Notice('Please configure IMA credentials in settings');
      return;
    }

    // TODO: 实现搜索 UI
    new Notice('Search notes - not implemented yet');
  }

  async browseNotebooks() {
    if (!this.client) {
      new Notice('Please configure IMA credentials in settings');
      return;
    }

    // TODO: 实现浏览笔记本 UI
    new Notice('Browse notebooks - not implemented yet');
  }
}

// 侧边栏视图
class IMAView extends ItemView {
  plugin: IMAPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: IMAPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return 'ima-view';
  }

  getDisplayText(): string {
    return 'IMA';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h2', { text: 'IMA Notes' });
    container.createEl('p', { text: 'Search and browse your IMA notes here.' });
  }

  async onClose() {
    // Nothing to clean up
  }
}
