import { Plugin } from 'obsidian';

export default class IMAPlugin extends Plugin {
  async onload() {
    // 添加 ribbon 图标
    this.addRibbonIcon('database', 'IMA Plugin', () => {
      // 点击图标时显示通知
      // @ts-ignore
      new window.Notice('IMA Plugin is working! 🎉');
    });

    // 添加命令：搜索 IMA 笔记
    this.addCommand({
      id: 'search-ima-notes',
      name: 'Search IMA Notes',
      callback: () => {
        // @ts-ignore
        new window.Notice('Search IMA Notes - Coming Soon!');
      }
    });

    // 添加命令：导入 IMA 笔记
    this.addCommand({
      id: 'import-ima-note',
      name: 'Import IMA Note to Obsidian',
      callback: () => {
        // @ts-ignore
        new window.Notice('Import IMA Note - Coming Soon!');
      }
    });

    // 添加命令：列出知识库
    this.addCommand({
      id: 'list-knowledge-bases',
      name: 'List IMA Knowledge Bases',
      callback: () => {
        // @ts-ignore
        new window.Notice('List Knowledge Bases - Coming Soon!');
      }
    });

    // 状态栏显示
    const statusBarItem = this.addStatusBarItem();
    statusBarItem.setText('IMA: Ready');

    console.log('IMA Plugin loaded successfully!');
  }

  onunload() {
    console.log('IMA Plugin unloaded!');
  }
}
