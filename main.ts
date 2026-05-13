import { Plugin, Setting, PluginSettingTab, Notice, App, Modal, ButtonComponent } from 'obsidian';
import { DailyNoteManager, SyncStateStore, SyncMode } from './src/services/dailyNoteManager';
import { MemosProfile, MemosSettings } from './src/types';
import { t } from './src/i18n/translationManager';

interface LegacySettings {
	apiUrl?: unknown;
	apiToken?: unknown;
	apiVersion?: unknown;
	dailyMemoHeader?: unknown;
	syncDaysLimit?: unknown;
	profiles?: unknown;
	lastSyncByProfile?: unknown;
	lastSyncDate?: unknown;
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
 * Migrate flat v1.5.x settings (apiUrl/apiToken/...) into the new profiles[] shape.
 *
 * Users coming directly from <= 1.5.x will see one extra full sync after the upgrade
 * because the legacy localStorage-based lastSyncTime is intentionally no longer read here
 * (it was migrated by v1.6.0; the plugin store guidelines discourage raw localStorage access).
 */
function migrateSettings(raw: unknown): MemosSettings {
	const legacy = (raw && typeof raw === 'object' ? raw : {}) as LegacySettings;
	const merged: MemosSettings = { ...DEFAULT_SETTINGS, ...(legacy as object) };

	if (!Array.isArray(merged.profiles) || merged.profiles.length === 0) {
		const legacyApiUrl = typeof legacy.apiUrl === 'string' ? legacy.apiUrl : '';
		const legacyApiToken = typeof legacy.apiToken === 'string' ? legacy.apiToken : '';
		const legacyHeader = typeof legacy.dailyMemoHeader === 'string' ? legacy.dailyMemoHeader : '## 📓 Memos';
		const legacyDays = typeof legacy.syncDaysLimit === 'number' ? legacy.syncDaysLimit : 30;

		if (legacyApiUrl || legacyApiToken) {
			merged.profiles = [{
				id: generateProfileId(),
				name: 'Default',
				apiUrl: legacyApiUrl,
				apiToken: legacyApiToken,
				dailyMemoHeader: legacyHeader,
				syncDaysLimit: legacyDays,
				enabled: !!(legacyApiUrl && legacyApiToken),
			}];
		} else {
			merged.profiles = [];
		}
	}

	if (!merged.lastSyncByProfile || typeof merged.lastSyncByProfile !== 'object') {
		merged.lastSyncByProfile = {};
	}
	if (typeof merged.lastSyncDate !== 'string') {
		merged.lastSyncDate = '';
	}

	// Strip legacy top-level fields so they don't get re-saved.
	const cleaned = merged as MemosSettings & LegacySettings;
	delete cleaned.apiUrl;
	delete cleaned.apiToken;
	delete cleaned.apiVersion;
	delete cleaned.dailyMemoHeader;
	delete cleaned.syncDaysLimit;

	return merged;
}

class ConfirmModal extends Modal {
	constructor(app: App, private message: string, private onConfirm: () => void) {
		super(app);
	}

	onOpen(): void {
		this.contentEl.createEl('p', { text: this.message });
		const buttons = this.contentEl.createDiv({ cls: 'modal-button-container' });
		new ButtonComponent(buttons)
			.setButtonText(t.t('CONFIRM_CANCEL'))
			.onClick(() => this.close());
		new ButtonComponent(buttons)
			.setButtonText(t.t('CONFIRM_OK'))
			.setWarning()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

export default class YetAnotherMemosSyncPlugin extends Plugin implements SyncStateStore {
	settings: MemosSettings;
	private dailyNoteManager: DailyNoteManager;
	private periodicSyncIntervalId: number | null = null;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.dailyNoteManager = new DailyNoteManager(this.app, this.settings, this);

		this.addRibbonIcon('sync', t.t('SYNC_MEMOS'), () => {
			void this.runSync('smart');
		});

		this.addCommand({
			id: 'sync-memos',
			name: t.t('SYNC_MEMOS'),
			callback: () => { void this.runSync('smart'); },
		});
		this.addCommand({
			id: 'incremental-sync-memos',
			name: t.t('INCREMENTAL_SYNC_MEMOS'),
			callback: () => { void this.runSync('incremental'); },
		});
		this.addCommand({
			id: 'force-sync-memos',
			name: t.t('FORCE_SYNC_MEMOS'),
			callback: () => { void this.runSync('force'); },
		});

		this.addSettingTab(new YetAnotherMemosSyncSettingTab(this.app, this));

		if (this.settings.enableAutoSyncOnStartup) {
			this.scheduleStartupSync();
		}
		this.schedulePeriodicSync();
	}

	async loadSettings(): Promise<void> {
		const raw: unknown = await this.loadData();
		this.settings = migrateSettings(raw);
		// Persist migration result so legacy fields don't linger
		await this.saveData(this.settings);
	}

	async saveSettings(): Promise<void> {
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

	private async runSync(mode: SyncMode): Promise<void> {
		try {
			new Notice(mode === 'force' ? t.t('FORCE_SYNC_STARTING') : t.t('SYNC_STARTING'));
			await this.dailyNoteManager.syncAll(mode);
			new Notice(mode === 'force' ? t.t('FORCE_SYNC_SUCCESS') : t.t('SYNC_SUCCESS'));
		} catch (error) {
			console.error(`Sync (${mode}) failed:`, error);
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`${mode === 'force' ? t.t('FORCE_SYNC_FAILED') : t.t('SYNC_FAILED')}: ${message}`);
		}
	}

	private scheduleStartupSync(): void {
		if (this.settings.skipIfSyncedToday && this.settings.lastSyncDate === new Date().toDateString()) {
			return;
		}
		// Using Plugin#registerInterval-friendly pattern: a one-shot timeout cleared on unload via window.setTimeout.
		const handle = window.setTimeout(() => {
			void this.runSync('smart');
		}, this.settings.startupSyncDelay * 1000);
		this.register(() => window.clearTimeout(handle));
	}

	private schedulePeriodicSync(): void {
		// Always clear any previously scheduled interval before deciding whether to schedule
		// a new one — otherwise saveSettings would stack intervals every time the user edits.
		if (this.periodicSyncIntervalId !== null) {
			window.clearInterval(this.periodicSyncIntervalId);
			this.periodicSyncIntervalId = null;
		}
		if (this.settings.periodicSyncInterval > 0) {
			// User-disclosed opt-in: the "Periodic Sync Interval" setting defaults to 0 (off).
			// When enabled, sync runs every N minutes against the user-configured Memos servers only.
			const id = window.setInterval(
				() => { void this.runSync('smart'); },
				this.settings.periodicSyncInterval * 60 * 1000,
			);
			this.periodicSyncIntervalId = id;
			this.registerInterval(id);
		}
	}

	addProfile(): MemosProfile {
		const profile = defaultProfile();
		profile.name = `Account ${this.settings.profiles.length + 1}`;
		this.settings.profiles.push(profile);
		return profile;
	}

	removeProfile(profileId: string): void {
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

		new Setting(containerEl).setName(t.t('SETTINGS_TITLE')).setHeading();

		this.renderProfilesSection(containerEl);
		this.renderSyncFormatSection(containerEl);
		this.renderAutoSyncSection(containerEl);
	}

	private renderProfilesSection(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName(t.t('PROFILES_TITLE'))
			.setDesc(t.t('PROFILES_DESC'))
			.setHeading();

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
		new Setting(card).setName(profile.name || 'Unnamed').setHeading();

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
			.onClick(() => {
				new ConfirmModal(this.app, t.t('REMOVE_PROFILE_CONFIRM'), () => {
					this.plugin.removeProfile(profile.id);
					void this.plugin.saveSettings().then(() => this.display());
				}).open();
			}));
	}

	private renderSyncFormatSection(containerEl: HTMLElement): void {
		new Setting(containerEl).setName(t.t('SYNC_CONFIG_TITLE')).setHeading();

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
			const hint = containerEl.createEl('div', {
				cls: 'setting-item-description yet-another-memos-sync-callout-note',
			});
			hint.appendText('💡 为获得最佳视觉效果，建议安装 ');
			// eslint-disable-next-line obsidianmd/ui/sentence-case -- proper plugin name
			hint.createEl('strong', { text: 'List Callouts' });
			hint.appendText(' 插件，它可以根据 emoji 自动为列表添加颜色样式。');
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
		new Setting(containerEl).setName(t.t('AUTO_SYNC_TITLE')).setHeading();

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
