import { Plugin, Setting, PluginSettingTab, Notice } from 'obsidian';
import { DailyNoteManager } from './src/services/dailyNoteManager';
import { MemosAPIClient } from './src/api/memosClient';
import { SimpleMemosPaginator } from './src/api/memosPaginator';
import { MemosSettings } from './src/types';
import { t } from './src/i18n/translationManager';

interface YetAnotherMemosSyncSettings extends MemosSettings {
	// Plugin-specific settings can be added here
}

const DEFAULT_SETTINGS: MemosSettings = {
  // API Configuration
  apiUrl: 'https://demo.usememos.com',
  apiToken: '',
  apiVersion: 'v0.25.1',

  // Sync Settings
  dailyMemoHeader: '## 📓 Memos',
  attachmentFolderPath: 'attachments',
  createMissingDailyNotes: true,
  useCalloutFormat: false,
  useListCalloutFormat: false,
  syncDaysLimit: 30, // 默认只同步最近30天

  // Auto Sync Settings
  enableAutoSyncOnStartup: false,
  startupSyncDelay: 5,
  skipIfSyncedToday: true,
  periodicSyncInterval: 0,
};

export default class YetAnotherMemosSyncPlugin extends Plugin {
	settings: YetAnotherMemosSyncSettings;
	private dailyNoteManager: DailyNoteManager;
	private periodicSyncInterval: number;

	async onload() {
		await this.loadSettings();

		// Initialize services
		this.dailyNoteManager = new DailyNoteManager(this.app, this.settings);

		// Add ribbon icon
		this.addRibbonIcon('sync', t.t('SYNC_MEMOS'), () => {
			this.smartSyncMemos();
		});

		// Add commands
		this.addCommand({
			id: 'sync-memos',
			name: t.t('SYNC_MEMOS'),
			callback: () => this.smartSyncMemos()
		});

		this.addCommand({
			id: 'incremental-sync-memos',
			name: t.t('INCREMENTAL_SYNC_MEMOS'),
			callback: () => this.syncMemos()
		});

		this.addCommand({
			id: 'force-sync-memos',
			name: t.t('FORCE_SYNC_MEMOS'),
			callback: () => this.forceSyncMemos()
		});

		// Add settings tab
		this.addSettingTab(new YetAnotherMemosSyncSettingTab(this.app, this));

		// Schedule startup sync
		if (this.settings.enableAutoSyncOnStartup) {
			this.scheduleStartupSync();
		}

		// Schedule periodic sync
		this.schedulePeriodicSync();
	}

	onunload() {
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// Update the daily note manager with new settings
		this.dailyNoteManager.updateSettings(this.settings);
		this.schedulePeriodicSync(); // Reschedule periodic sync when settings change
	}

	private async smartSyncMemos() {
		try {
			new Notice(t.t('SYNC_STARTING'));
			await this.dailyNoteManager.smartSync();
			new Notice(t.t('SYNC_SUCCESS'));
		} catch (error) {
			console.error('Smart sync failed:', error);
			new Notice(`${t.t('SYNC_FAILED')}: ${error.message}`);
		}
	}

	private async syncMemos() {
		try {
			new Notice(t.t('SYNC_STARTING'));
			await this.dailyNoteManager.sync();
			new Notice(t.t('SYNC_SUCCESS'));
		} catch (error) {
			console.error('Sync failed:', error);
			new Notice(`${t.t('SYNC_FAILED')}: ${error.message}`);
		}
	}

	private async forceSyncMemos() {
		try {
			new Notice(t.t('FORCE_SYNC_STARTING'));
			await this.dailyNoteManager.forceSync();
			new Notice(t.t('FORCE_SYNC_SUCCESS'));
		} catch (error) {
			console.error('Force sync failed:', error);
			new Notice(`${t.t('FORCE_SYNC_FAILED')}: ${error.message}`);
		}
	}

	private scheduleStartupSync() {
		if (this.settings.skipIfSyncedToday) {
			const lastSyncDate = localStorage.getItem('yams-last-sync-date');
			const today = new Date().toDateString();
			if (lastSyncDate === today) {
				return; // Skip if already synced today
			}
		}

		setTimeout(() => {
			this.smartSyncMemos();
		}, this.settings.startupSyncDelay * 1000);
	}

	private schedulePeriodicSync() {
		if (this.periodicSyncInterval) {
			window.clearInterval(this.periodicSyncInterval);
		}

		if (this.settings.periodicSyncInterval > 0) {
			this.periodicSyncInterval = window.setInterval(() => {
				this.smartSyncMemos();
			}, this.settings.periodicSyncInterval * 60 * 1000);
		}
	}
}

class YetAnotherMemosSyncSettingTab extends PluginSettingTab {
	plugin: YetAnotherMemosSyncPlugin;

	constructor(app: any, plugin: YetAnotherMemosSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: t.t('SETTINGS_TITLE') });

		// API配置
		containerEl.createEl('h3', { text: t.t('API_CONFIG_TITLE') });

		new Setting(containerEl)
			.setName(t.t('API_URL_NAME'))
			.setDesc(t.t('API_URL_DESC'))
			.addText(text => text
				.setPlaceholder('https://usememos.com')
				.setValue(this.plugin.settings.apiUrl)
				.onChange(async (value) => {
					this.plugin.settings.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('API_TOKEN_NAME'))
			.setDesc(t.t('API_TOKEN_DESC'))
			.addText(text => text
				.setPlaceholder('Enter your API token')
				.setValue(this.plugin.settings.apiToken)
				.onChange(async (value) => {
					this.plugin.settings.apiToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('API_VERSION_NAME'))
			.setDesc(t.t('API_VERSION_DESC'))
			.addDropdown(dropdown => dropdown
				.addOption('v0.25.1', 'v0.25.1 (Latest)')
				.addOption('v0.24.0', 'v0.24.0')
				.addOption('v0.23.0', 'v0.23.0')
				.addOption('v0.22.0', 'v0.22.0')
				.addOption('v0.21.0', 'v0.21.0')
				.addOption('legacy', 'Legacy (v0.20 and below)')
				.setValue(this.plugin.settings.apiVersion)
				.onChange(async (value) => {
					this.plugin.settings.apiVersion = value;
					await this.plugin.saveSettings();
				}));

		// 同步设置
		containerEl.createEl('h3', { text: t.t('SYNC_CONFIG_TITLE') });

		new Setting(containerEl)
			.setName(t.t('DAILY_HEADER_NAME'))
			.setDesc(t.t('DAILY_HEADER_DESC'))
			.addText(text => text
				.setPlaceholder('Memos')
				.setValue(this.plugin.settings.dailyMemoHeader)
				.onChange(async (value) => {
					this.plugin.settings.dailyMemoHeader = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('ATTACHMENT_FOLDER_NAME'))
			.setDesc(t.t('ATTACHMENT_FOLDER_DESC'))
			.addText(text => text
				.setPlaceholder('Attachments')
				.setValue(this.plugin.settings.attachmentFolderPath)
				.onChange(async (value) => {
					this.plugin.settings.attachmentFolderPath = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('CREATE_MISSING_NOTES_NAME'))
			.setDesc(t.t('CREATE_MISSING_NOTES_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.createMissingDailyNotes)
				.onChange(async (value) => {
					this.plugin.settings.createMissingDailyNotes = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('USE_CALLOUT_FORMAT_NAME'))
			.setDesc(t.t('USE_CALLOUT_FORMAT_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCalloutFormat)
				.onChange(async (value) => {
					this.plugin.settings.useCalloutFormat = value;
					if (value) {
						// Disable list callout format when callout is enabled
						this.plugin.settings.useListCalloutFormat = false;
					}
					await this.plugin.saveSettings();
					this.display(); // Refresh display
				}));

		new Setting(containerEl)
			.setName(t.t('USE_LIST_CALLOUT_FORMAT_NAME'))
			.setDesc(t.t('USE_LIST_CALLOUT_FORMAT_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useListCalloutFormat)
				.onChange(async (value) => {
					this.plugin.settings.useListCalloutFormat = value;
					if (value) {
						// Disable callout format when list callout is enabled
						this.plugin.settings.useCalloutFormat = false;
					}
					await this.plugin.saveSettings();
					this.display(); // Refresh display
				}));

		// Add a helpful note about List Callouts plugin
		if (this.plugin.settings.useListCalloutFormat) {
			const listCalloutNote = containerEl.createEl('div', {
				cls: 'setting-item-description yet-another-memos-sync-callout-note',
				text: '💡 为获得最佳视觉效果，建议安装 "List Callouts" 插件，它可以根据 emoji 自动为列表添加颜色样式。'
			});
		}

		new Setting(containerEl)
			.setName(t.t('SYNC_DAYS_LIMIT_NAME'))
			.setDesc(t.t('SYNC_DAYS_LIMIT_DESC'))
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(this.plugin.settings.syncDaysLimit))
				.onChange(async (value) => {
					this.plugin.settings.syncDaysLimit = Number(value) || 30;
					await this.plugin.saveSettings();
				}));

		// 自动同步设置
		containerEl.createEl('h3', { text: t.t('AUTO_SYNC_TITLE') });

		new Setting(containerEl)
			.setName(t.t('AUTO_SYNC_STARTUP_NAME'))
			.setDesc(t.t('AUTO_SYNC_STARTUP_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.enableAutoSyncOnStartup)
				.onChange(async (value) => {
					this.plugin.settings.enableAutoSyncOnStartup = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('STARTUP_DELAY_NAME'))
			.setDesc(t.t('STARTUP_DELAY_DESC'))
			.addText(text => text
				.setPlaceholder('3')
				.setValue(String(this.plugin.settings.startupSyncDelay))
				.onChange(async (value) => {
					this.plugin.settings.startupSyncDelay = Number(value) || 3;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('SKIP_IF_SYNCED_NAME'))
			.setDesc(t.t('SKIP_IF_SYNCED_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.skipIfSyncedToday)
				.onChange(async (value) => {
					this.plugin.settings.skipIfSyncedToday = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName(t.t('PERIODIC_SYNC_NAME'))
			.setDesc(t.t('PERIODIC_SYNC_DESC'))
			.addText(text => text
				.setPlaceholder('0')
				.setValue(String(this.plugin.settings.periodicSyncInterval))
				.onChange(async (value) => {
					this.plugin.settings.periodicSyncInterval = Number(value) || 0;
					await this.plugin.saveSettings();
				}));
	}
}
