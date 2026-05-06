import { Plugin, Setting, PluginSettingTab, Notice, App } from 'obsidian';
import { DailyNoteManager, SyncStateStore } from './src/services/dailyNoteManager';
import { MemosProfile, MemosSettings } from './src/types';
import { t } from './src/i18n/translationManager';

interface PersistedData extends MemosSettings {
	// Reserved for future fields stored in plugin data
}

const DEFAULT_SETTINGS: MemosSettings = {
	profiles: [],

	attachmentFolderPath: 'attachments',
	createMissingDailyNotes: true,
	useCalloutFormat: false,
	useListCalloutFormat: false,
	skipImages: false,

	enableAutoSyncOnStartup: false,
	startupSyncDelay: 5,
	skipIfSyncedToday: true,
	periodicSyncInterval: 0,

	lastSyncByProfile: {},
	lastSyncDate: '',
};

function generateProfileId(): string {
	return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function defaultProfile(): MemosProfile {
	return {
		id: generateProfileId(),
		name: 'Default',
		apiUrl: '',
		apiToken: '',
		dailyMemoHeader: '## 📓 Memos',
		syncDaysLimit: 30,
		enabled: true,
	};
}

/**
 * Migrate flat v1.5.x settings into the new profiles[] shape.
 * Also adopts old localStorage sync state if present.
 */
function migrateSettings(raw: any): MemosSettings {
	const merged: any = Object.assign({}, DEFAULT_SETTINGS, raw || {});

	if (!Array.isArray(merged.profiles) || merged.profiles.length === 0) {
		const legacyApiUrl = (raw && typeof raw.apiUrl === 'string') ? raw.apiUrl : '';
		const legacyApiToken = (raw && typeof raw.apiToken === 'string') ? raw.apiToken : '';
		const legacyHeader = (raw && typeof raw.dailyMemoHeader === 'string') ? raw.dailyMemoHeader : '## 📓 Memos';
		const legacyDays = (raw && typeof raw.syncDaysLimit === 'number') ? raw.syncDaysLimit : 30;

		const profile: MemosProfile = {
			id: generateProfileId(),
			name: 'Default',
			apiUrl: legacyApiUrl,
			apiToken: legacyApiToken,
			dailyMemoHeader: legacyHeader,
			syncDaysLimit: legacyDays,
			enabled: !!(legacyApiUrl && legacyApiToken),
		};
		merged.profiles = legacyApiUrl || legacyApiToken ? [profile] : [];
	}

	if (!merged.lastSyncByProfile || typeof merged.lastSyncByProfile !== 'object') {
		merged.lastSyncByProfile = {};
	}

	// Adopt localStorage sync state into the first profile (one-time migration)
	if (merged.profiles.length > 0) {
		const firstId = merged.profiles[0].id;
		if (!merged.lastSyncByProfile[firstId]) {
			const legacyLastSync = localStorage.getItem('yams-last-sync-time');
			if (legacyLastSync) {
				merged.lastSyncByProfile[firstId] = legacyLastSync;
			}
		}
	}
	if (!merged.lastSyncDate) {
		merged.lastSyncDate = localStorage.getItem('yams-last-sync-date') || '';
	}

	// Strip legacy top-level fields so they don't get re-saved
	delete merged.apiUrl;
	delete merged.apiToken;
	delete merged.apiVersion;
	delete merged.dailyMemoHeader;
	delete merged.syncDaysLimit;

	return merged as MemosSettings;
}

export default class YetAnotherMemosSyncPlugin extends Plugin implements SyncStateStore {
	settings: MemosSettings;
	private dailyNoteManager: DailyNoteManager;
	private periodicSyncIntervalId: number | null = null;
	private startupTimeoutId: number | null = null;

	async onload() {
		await this.loadSettings();

		this.dailyNoteManager = new DailyNoteManager(this.app, this.settings, this);

		this.addRibbonIcon('sync', t.t('SYNC_MEMOS'), () => this.runSync('smart'));

		this.addCommand({
			id: 'sync-memos',
			name: t.t('SYNC_MEMOS'),
			callback: () => this.runSync('smart'),
		});
		this.addCommand({
			id: 'incremental-sync-memos',
			name: t.t('INCREMENTAL_SYNC_MEMOS'),
			callback: () => this.runSync('incremental'),
		});
		this.addCommand({
			id: 'force-sync-memos',
			name: t.t('FORCE_SYNC_MEMOS'),
			callback: () => this.runSync('force'),
		});

		this.addSettingTab(new YetAnotherMemosSyncSettingTab(this.app, this));

		if (this.settings.enableAutoSyncOnStartup) {
			this.scheduleStartupSync();
		}
		this.schedulePeriodicSync();
	}

	onunload() {
		if (this.periodicSyncIntervalId !== null) window.clearInterval(this.periodicSyncIntervalId);
		if (this.startupTimeoutId !== null) window.clearTimeout(this.startupTimeoutId);
	}

	async loadSettings() {
		const raw = await this.loadData();
		this.settings = migrateSettings(raw);
		// Persist migration result so legacy fields don't linger
		await this.saveData(this.settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.dailyNoteManager.updateSettings(this.settings);
		this.schedulePeriodicSync();
	}

	// SyncStateStore impl
	getLastSync(profileId: string): string {
		return this.settings.lastSyncByProfile[profileId] || '';
	}
	async setLastSync(profileId: string, value: string): Promise<void> {
		this.settings.lastSyncByProfile[profileId] = value;
		await this.saveData(this.settings);
	}
	async markSyncedToday(): Promise<void> {
		this.settings.lastSyncDate = new Date().toDateString();
		await this.saveData(this.settings);
	}

	private async runSync(mode: 'smart' | 'incremental' | 'force') {
		try {
			new Notice(mode === 'force' ? t.t('FORCE_SYNC_STARTING') : t.t('SYNC_STARTING'));
			await this.dailyNoteManager.syncAll(mode);
			new Notice(mode === 'force' ? t.t('FORCE_SYNC_SUCCESS') : t.t('SYNC_SUCCESS'));
		} catch (error: any) {
			console.error(`Sync (${mode}) failed:`, error);
			new Notice(`${mode === 'force' ? t.t('FORCE_SYNC_FAILED') : t.t('SYNC_FAILED')}: ${error.message}`);
		}
	}

	private scheduleStartupSync() {
		if (this.settings.skipIfSyncedToday && this.settings.lastSyncDate === new Date().toDateString()) {
			return;
		}
		this.startupTimeoutId = window.setTimeout(() => {
			this.startupTimeoutId = null;
			this.runSync('smart');
		}, this.settings.startupSyncDelay * 1000);
	}

	private schedulePeriodicSync() {
		if (this.periodicSyncIntervalId !== null) {
			window.clearInterval(this.periodicSyncIntervalId);
			this.periodicSyncIntervalId = null;
		}
		if (this.settings.periodicSyncInterval > 0) {
			this.periodicSyncIntervalId = window.setInterval(
				() => this.runSync('smart'),
				this.settings.periodicSyncInterval * 60 * 1000,
			);
		}
	}

	addProfile(): MemosProfile {
		const profile = defaultProfile();
		profile.name = `Account ${this.settings.profiles.length + 1}`;
		this.settings.profiles.push(profile);
		return profile;
	}

	removeProfile(profileId: string) {
		this.settings.profiles = this.settings.profiles.filter(p => p.id !== profileId);
		delete this.settings.lastSyncByProfile[profileId];
	}
}

class YetAnotherMemosSyncSettingTab extends PluginSettingTab {
	plugin: YetAnotherMemosSyncPlugin;

	constructor(app: App, plugin: YetAnotherMemosSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: t.t('SETTINGS_TITLE') });

		this.renderProfilesSection(containerEl);
		this.renderSyncFormatSection(containerEl);
		this.renderAutoSyncSection(containerEl);
	}

	private renderProfilesSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: t.t('PROFILES_TITLE') });
		containerEl.createEl('p', {
			text: t.t('PROFILES_DESC'),
			cls: 'setting-item-description',
		});

		const profiles = this.plugin.settings.profiles;
		if (profiles.length === 0) {
			containerEl.createEl('p', {
				text: t.t('NO_PROFILES_HINT'),
				cls: 'setting-item-description',
			});
		}

		for (const profile of profiles) {
			this.renderProfile(containerEl, profile);
		}

		new Setting(containerEl).addButton(btn => btn
			.setButtonText(t.t('ADD_PROFILE'))
			.setCta()
			.onClick(async () => {
				this.plugin.addProfile();
				await this.plugin.saveSettings();
				this.display();
			}));
	}

	private renderProfile(containerEl: HTMLElement, profile: MemosProfile): void {
		const card = containerEl.createDiv({ cls: 'yams-profile-card' });
		card.createEl('h4', { text: profile.name || 'Unnamed' });

		new Setting(card)
			.setName(t.t('PROFILE_NAME_LABEL'))
			.setDesc(t.t('PROFILE_NAME_DESC'))
			.addText(text => text
				.setValue(profile.name)
				.onChange(async (value) => {
					profile.name = value;
					await this.plugin.saveSettings();
				}));

		new Setting(card)
			.setName(t.t('PROFILE_ENABLED_LABEL'))
			.addToggle(toggle => toggle
				.setValue(profile.enabled)
				.onChange(async (value) => {
					profile.enabled = value;
					await this.plugin.saveSettings();
				}));

		new Setting(card)
			.setName(t.t('API_URL_NAME'))
			.setDesc(t.t('API_URL_DESC'))
			.addText(text => text
				.setPlaceholder('https://memos.example.com')
				.setValue(profile.apiUrl)
				.onChange(async (value) => {
					profile.apiUrl = value;
					await this.plugin.saveSettings();
				}));

		new Setting(card)
			.setName(t.t('API_TOKEN_NAME'))
			.setDesc(t.t('API_TOKEN_DESC'))
			.addText(text => text
				.setPlaceholder('Enter your API token')
				.setValue(profile.apiToken)
				.onChange(async (value) => {
					profile.apiToken = value;
					await this.plugin.saveSettings();
				}));

		new Setting(card)
			.setName(t.t('DAILY_HEADER_NAME'))
			.setDesc(t.t('DAILY_HEADER_DESC'))
			.addText(text => text
				.setPlaceholder('## 📓 Memos')
				.setValue(profile.dailyMemoHeader)
				.onChange(async (value) => {
					profile.dailyMemoHeader = value;
					await this.plugin.saveSettings();
				}));

		new Setting(card)
			.setName(t.t('SYNC_DAYS_LIMIT_NAME'))
			.setDesc(t.t('SYNC_DAYS_LIMIT_DESC'))
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(profile.syncDaysLimit))
				.onChange(async (value) => {
					profile.syncDaysLimit = Number(value) || 0;
					await this.plugin.saveSettings();
				}));

		new Setting(card).addButton(btn => btn
			.setButtonText(t.t('REMOVE_PROFILE'))
			.setWarning()
			.onClick(async () => {
				if (!confirm(t.t('REMOVE_PROFILE_CONFIRM'))) return;
				this.plugin.removeProfile(profile.id);
				await this.plugin.saveSettings();
				this.display();
			}));
	}

	private renderSyncFormatSection(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: t.t('SYNC_CONFIG_TITLE') });

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
					if (value) this.plugin.settings.useListCalloutFormat = false;
					await this.plugin.saveSettings();
					this.display();
				}));

		new Setting(containerEl)
			.setName(t.t('USE_LIST_CALLOUT_FORMAT_NAME'))
			.setDesc(t.t('USE_LIST_CALLOUT_FORMAT_DESC'))
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useListCalloutFormat)
				.onChange(async (value) => {
					this.plugin.settings.useListCalloutFormat = value;
					if (value) this.plugin.settings.useCalloutFormat = false;
					await this.plugin.saveSettings();
					this.display();
				}));

		if (this.plugin.settings.useListCalloutFormat) {
			containerEl.createEl('div', {
				cls: 'setting-item-description yet-another-memos-sync-callout-note',
				text: '💡 为获得最佳视觉效果，建议安装 "List Callouts" 插件，它可以根据 emoji 自动为列表添加颜色样式。',
			});
		}

		new Setting(containerEl)
			.setName('跳过图片')
			.setDesc('同步时不包含图片资源，避免图片污染 Obsidian 库')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.skipImages)
				.onChange(async (value) => {
					this.plugin.settings.skipImages = value;
					await this.plugin.saveSettings();
				}));
	}

	private renderAutoSyncSection(containerEl: HTMLElement): void {
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
