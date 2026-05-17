import { PluginSettingTab, App, Setting, Plugin } from 'obsidian';

export interface IMAPluginSettings {
  clientId: string;
  apiKey: string;
}

export const DEFAULT_SETTINGS: IMAPluginSettings = {
  clientId: '',
  apiKey: '',
};

export class IMASettingTab extends PluginSettingTab {
  plugin: any;

  constructor(app: App, plugin: any) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'IMA Plugin Settings' });

    new Setting(containerEl)
      .setName('Client ID')
      .setDesc('Enter your IMA OpenAPI Client ID')
      .addText((text) =>
        text
          .setPlaceholder('Enter your Client ID')
          .setValue(this.plugin.settings.clientId)
          .onChange(async (value) => {
            this.plugin.settings.clientId = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your IMA OpenAPI API Key')
      .addText((text) =>
        text
          .setPlaceholder('Enter your API Key')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl('p', {
      text: 'Get your credentials from IMA OpenAPI settings: https://ima.qq.com',
    });
  }
}
