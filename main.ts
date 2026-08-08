import { Plugin, Setting, PluginSettingTab, Notice, App, Modal, ButtonComponent, SettingDefinitionItem } from 'obsidian';
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
			.setDestructive()
			.onClick(() => {
				this.close();
				this.onConfirm();
			});
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

class ErrorLogModal extends Modal {
	constructor(app: App, private content: string) {
		super(app);
	}

	onOpen(): void {
		this.titleEl.setText(t.t('VIEW_ERROR_LOG'));
		const pre = this.contentEl.createEl('pre', { cls: 'yams-error-log' });
		pre.setText(this.content);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

class ProfileEditModal extends Modal {
	private draft: MemosProfile;

	constructor(
		app: App,
		private plugin: YetAnotherMemosSyncPlugin,
		private profile: MemosProfile | null,
		private onSaved: () => void,
	) {
		super(app);
		this.draft = profile ? { ...profile } : defaultProfile();
	}

	onOpen(): void {
		const { contentEl } = this;
		contentEl.empty();
		this.titleEl.setText(this.profile ? t.t('PROFILE_EDIT_TITLE') : t.t('PROFILE_ADD_TITLE'));

		new Setting(contentEl)
			.setName(t.t('PROFILE_NAME_LABEL'))
			.setDesc(t.t('PROFILE_NAME_DESC'))
			.addText(text => text
				.setValue(this.draft.name)
				.onChange(value => { this.draft.name = value; }));

		new Setting(contentEl)
			.setName(t.t('PROFILE_ENABLED_LABEL'))
			.addToggle(toggle => toggle
				.setValue(this.draft.enabled)
				.onChange(value => { this.draft.enabled = value; }));

		new Setting(contentEl)
			.setName(t.t('API_URL_NAME'))
			.setDesc(t.t('API_URL_DESC'))
			.addText(text => text
				.setPlaceholder('https://memos.example.com')
				.setValue(this.draft.apiUrl)
				.onChange(value => { this.draft.apiUrl = value; }));

		new Setting(contentEl)
			.setName(t.t('API_TOKEN_NAME'))
			.setDesc(t.t('API_TOKEN_DESC'))
			.addText(text => text
				.setPlaceholder('Enter your API token')
				.setValue(this.draft.apiToken)
				.onChange(value => { this.draft.apiToken = value; }));

		new Setting(contentEl)
			.setName(t.t('DAILY_HEADER_NAME'))
			.setDesc(t.t('DAILY_HEADER_DESC'))
			.addText(text => text
				.setPlaceholder('## 📓 Memos')
				.setValue(this.draft.dailyMemoHeader)
				.onChange(value => { this.draft.dailyMemoHeader = value; }));

		new Setting(contentEl)
			.setName(t.t('SYNC_DAYS_LIMIT_NAME'))
			.setDesc(t.t('SYNC_DAYS_LIMIT_DESC'))
			.addText(text => text
				.setPlaceholder('30')
				.setValue(String(this.draft.syncDaysLimit))
				.onChange(value => { this.draft.syncDaysLimit = Number(value) || 0; }));

		const buttons = contentEl.createDiv({ cls: 'modal-button-container' });
		new ButtonComponent(buttons)
			.setButtonText(t.t('CONFIRM_CANCEL'))
			.onClick(() => this.close());
		new ButtonComponent(buttons)
			.setButtonText(t.t('PROFILE_SAVE'))
			.setCta()
			.onClick(async () => {
				if (this.profile) {
					Object.assign(this.profile, this.draft);
				} else {
					Object.assign(this.plugin.addProfile(), this.draft);
				}
				await this.plugin.saveSettings();
				this.close();
				this.onSaved();
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

		this.registerDomEvent(window, 'error', (event: ErrorEvent) => {
			const detail = event.error instanceof Error ? event.error.stack || event.error.message : event.message;
			void this.appendErrorLog(`\n[${new Date().toISOString()}] window.onerror\n${detail}`);
		});
		this.registerDomEvent(window, 'unhandledrejection', (event: PromiseRejectionEvent) => {
			const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
			void this.appendErrorLog(`\n[${new Date().toISOString()}] unhandledrejection\n${reason.stack || reason.message}`);
		});

		this.addCommand({
			id: 'view-sync-error-log',
			name: t.t('VIEW_ERROR_LOG'),
			callback: () => {
				void (async () => {
					const path = this.errorLogPath();
					const content = await this.app.vault.adapter.read(path).catch(() => t.t('VIEW_ERROR_LOG_EMPTY'));
					new ErrorLogModal(this.app, content).open();
				})();
			},
		});

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

	private errorLogPath(): string {
		const pluginId = (this.manifest && this.manifest.id) || 'yet-another-memos-sync';
		return `${this.app.vault.configDir}/plugins/${pluginId}/yams-sync-error.log`;
	}

	private async appendErrorLog(entry: string): Promise<void> {
		try {
			const path = this.errorLogPath();
			const adapter = this.app.vault.adapter;
			const existing = await adapter.read(path).catch(() => '');
			await adapter.write(path, existing + entry);
		} catch (error) {
			console.error('Failed to write YAMS error log:', error);
		}
	}

	private async runSync(mode: SyncMode): Promise<void> {
		const force = mode === 'force';
		try {
			new Notice(force ? t.t('FORCE_SYNC_STARTING') : t.t('SYNC_STARTING'));
			await this.dailyNoteManager.syncAll(mode);
			new Notice(force ? t.t('FORCE_SYNC_SUCCESS') : t.t('SYNC_SUCCESS'));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			const stack = error instanceof Error && error.stack ? error.stack : '';
			console.error(`Sync (${mode}) failed:`, error);
			void this.appendErrorLog(`\n[${new Date().toISOString()}] Sync mode=${mode}\n${message}\n${stack}`);
			new Notice(`${force ? t.t('FORCE_SYNC_FAILED') : t.t('SYNC_FAILED')}: ${message}`, 10000);
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

	getSettingDefinitions(): SettingDefinitionItem[] {
		const settings = this.plugin.settings;
		return [
			{
				name: '',
				render: (setting) => {
					setting.descEl.setText(t.t('PROFILES_DESC'));
				},
			},
			{
				type: 'list',
				heading: t.t('PROFILES_TITLE'),
				emptyState: t.t('NO_PROFILES_HINT'),
				addItem: {
					name: t.t('ADD_PROFILE'),
					action: () => this.openProfileModal(null),
				},
				onDelete: (index) => this.confirmRemoveProfile(index),
				items: settings.profiles.map(profile => ({
					name: profile.name || 'Unnamed',
					desc: `${profile.enabled ? t.t('PROFILE_ENABLED_LABEL') : t.t('PROFILE_DISABLED_LABEL')} · ${profile.apiUrl || t.t('PROFILE_NO_URL')}`,
					searchable: false,
					action: () => this.openProfileModal(profile),
				})),
			},
			{
				type: 'group',
				heading: t.t('SYNC_CONFIG_TITLE'),
				items: [
					{
						name: t.t('ATTACHMENT_FOLDER_NAME'),
						desc: t.t('ATTACHMENT_FOLDER_DESC'),
						control: { type: 'text', key: 'attachmentFolderPath', placeholder: 'Attachments' },
					},
					{
						name: t.t('CREATE_MISSING_NOTES_NAME'),
						desc: t.t('CREATE_MISSING_NOTES_DESC'),
						control: { type: 'toggle', key: 'createMissingDailyNotes' },
					},
					{
						name: t.t('USE_CALLOUT_FORMAT_NAME'),
						desc: t.t('USE_CALLOUT_FORMAT_DESC'),
						control: { type: 'toggle', key: 'useCalloutFormat' },
					},
					{
						name: t.t('USE_LIST_CALLOUT_FORMAT_NAME'),
						desc: t.t('USE_LIST_CALLOUT_FORMAT_DESC'),
						control: { type: 'toggle', key: 'useListCalloutFormat' },
					},
					{
						name: '',
						render: (setting) => {
							setting.descEl.setText(t.t('LIST_CALLOUT_HINT'));
							setting.descEl.addClass('yet-another-memos-sync-callout-note');
						},
						visible: () => settings.useListCalloutFormat,
					},
					{
						name: t.t('SKIP_IMAGES_NAME'),
						desc: t.t('SKIP_IMAGES_DESC'),
						control: { type: 'toggle', key: 'skipImages' },
					},
				],
			},
			{
				type: 'group',
				heading: t.t('AUTO_SYNC_TITLE'),
				items: [
					{
						name: t.t('AUTO_SYNC_STARTUP_NAME'),
						desc: t.t('AUTO_SYNC_STARTUP_DESC'),
						control: { type: 'toggle', key: 'enableAutoSyncOnStartup' },
					},
					{
						name: t.t('STARTUP_DELAY_NAME'),
						desc: t.t('STARTUP_DELAY_DESC'),
						control: { type: 'number', key: 'startupSyncDelay' },
					},
					{
						name: t.t('SKIP_IF_SYNCED_NAME'),
						desc: t.t('SKIP_IF_SYNCED_DESC'),
						control: { type: 'toggle', key: 'skipIfSyncedToday' },
					},
					{
						name: t.t('PERIODIC_SYNC_NAME'),
						desc: t.t('PERIODIC_SYNC_DESC'),
						control: { type: 'number', key: 'periodicSyncInterval' },
					},
				],
			},
		];
	}

	getControlValue(key: string): unknown {
		const settings = this.plugin.settings;
		switch (key) {
			case 'attachmentFolderPath': return settings.attachmentFolderPath;
			case 'createMissingDailyNotes': return settings.createMissingDailyNotes;
			case 'useCalloutFormat': return settings.useCalloutFormat;
			case 'useListCalloutFormat': return settings.useListCalloutFormat;
			case 'skipImages': return settings.skipImages;
			case 'enableAutoSyncOnStartup': return settings.enableAutoSyncOnStartup;
			case 'startupSyncDelay': return settings.startupSyncDelay;
			case 'skipIfSyncedToday': return settings.skipIfSyncedToday;
			case 'periodicSyncInterval': return settings.periodicSyncInterval;
			default: return undefined;
		}
	}

	setControlValue(key: string, value: unknown): void | Promise<void> {
		const settings = this.plugin.settings;
		switch (key) {
			case 'attachmentFolderPath':
				settings.attachmentFolderPath = String(value);
				break;
			case 'createMissingDailyNotes':
				settings.createMissingDailyNotes = value === true;
				break;
			case 'useCalloutFormat':
				settings.useCalloutFormat = value === true;
				if (value === true) settings.useListCalloutFormat = false;
				break;
			case 'useListCalloutFormat':
				settings.useListCalloutFormat = value === true;
				if (value === true) settings.useCalloutFormat = false;
				break;
			case 'skipImages':
				settings.skipImages = value === true;
				break;
			case 'enableAutoSyncOnStartup':
				settings.enableAutoSyncOnStartup = value === true;
				break;
			case 'startupSyncDelay':
				settings.startupSyncDelay = Number(value) || 3;
				break;
			case 'skipIfSyncedToday':
				settings.skipIfSyncedToday = value === true;
				break;
			case 'periodicSyncInterval':
				settings.periodicSyncInterval = Number(value) || 0;
				break;
			default:
				return;
		}
		const needsRefresh = key === 'useCalloutFormat' || key === 'useListCalloutFormat';
		return this.plugin.saveSettings().then(() => {
			if (needsRefresh) this.update();
		});
	}

	private openProfileModal(profile: MemosProfile | null): void {
		new ProfileEditModal(this.app, this.plugin, profile, () => this.update()).open();
	}

	private confirmRemoveProfile(index: number): void {
		const profile = this.plugin.settings.profiles[index];
		if (!profile) return;
		new ConfirmModal(this.app, t.t('REMOVE_PROFILE_CONFIRM'), () => {
			this.plugin.removeProfile(profile.id);
			void this.plugin.saveSettings().then(() => this.update());
		}).open();
	}
}
