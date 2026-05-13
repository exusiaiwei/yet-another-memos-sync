import { Translations } from './index';

export const enTranslations: Translations = {
  // Plugin info
  PLUGIN_NAME: 'Yet Another Memos Sync',
  PLUGIN_DESCRIPTION: 'Sync Memos to daily notes with emoji timeline',

  // Settings interface
  SETTINGS_TITLE: 'Yet Another Memos Sync Settings',
  API_CONFIG_TITLE: 'API Configuration',
  SYNC_CONFIG_TITLE: 'Sync Settings',
  AUTO_SYNC_TITLE: 'Auto Sync',

  // API settings
  API_URL_NAME: 'Memos API URL',
  API_URL_DESC: 'Your Memos server URL',
  API_TOKEN_NAME: 'API Token',
  API_TOKEN_DESC: 'Your Memos API access token',
  API_VERSION_NAME: 'API Version',
  API_VERSION_DESC: 'Select your Memos server version',

  // Profiles
  PROFILES_TITLE: 'Profiles',
  PROFILES_DESC: 'Each profile maps a Memos account/instance to its own daily-note section. Add multiple to sync several members into the same vault.',
  PROFILE_NAME_LABEL: 'Profile Name',
  PROFILE_NAME_DESC: 'Display name; also used in the sync log',
  PROFILE_ENABLED_LABEL: 'Enabled',
  ADD_PROFILE: 'Add profile',
  REMOVE_PROFILE: 'Remove',
  REMOVE_PROFILE_CONFIRM: 'Remove this profile? Synced content stays in your vault.',
  NO_PROFILES_HINT: 'No profiles yet — click "Add profile" to configure your first Memos account.',

  // Sync settings
  DAILY_HEADER_NAME: 'Daily Notes Header',
  DAILY_HEADER_DESC: 'Header text for memos section in daily notes',
  ATTACHMENT_FOLDER_NAME: 'Attachment Folder',
  ATTACHMENT_FOLDER_DESC: 'Folder path to store Memos attachments',
  CREATE_MISSING_NOTES_NAME: 'Create Missing Daily Notes',
  CREATE_MISSING_NOTES_DESC: 'Automatically create daily note files if they don\'t exist',
  USE_CALLOUT_FORMAT_NAME: 'Use Callout Format',
  USE_CALLOUT_FORMAT_DESC: 'Display memos as colorful callouts with time-based themes',
  USE_LIST_CALLOUT_FORMAT_NAME: 'Use List Callout Style',
  USE_LIST_CALLOUT_FORMAT_DESC: 'Keep standard Markdown lists but recommend List Callouts plugin for enhanced visual styling',
  SYNC_DAYS_LIMIT_NAME: 'Sync Days Limit',
  SYNC_DAYS_LIMIT_DESC: 'Only sync memos from the last N days (0 = no limit)',

  // Auto sync settings
  AUTO_SYNC_STARTUP_NAME: 'Enable Auto Sync on Startup',
  AUTO_SYNC_STARTUP_DESC: 'Automatically sync memos when Obsidian starts',
  STARTUP_DELAY_NAME: 'Startup Sync Delay (seconds)',
  STARTUP_DELAY_DESC: 'Delay before auto sync on startup',
  SKIP_IF_SYNCED_NAME: 'Skip if Synced Today',
  SKIP_IF_SYNCED_DESC: 'Skip startup sync if already synced today',
  PERIODIC_SYNC_NAME: 'Periodic Sync Interval (minutes)',
  PERIODIC_SYNC_DESC: 'Set to 0 to disable periodic sync',

  // Buttons and commands
  SYNC_MEMOS: 'Smart Sync Memos',
  INCREMENTAL_SYNC_MEMOS: 'Incremental Sync (New Only)',
  FORCE_SYNC_MEMOS: 'Force Sync All Memos',

  // Notification messages
  SYNC_STARTING: '🌅 Starting memos sync...',
  SYNC_SUCCESS: '✅ Memos synced successfully!',
  SYNC_FAILED: '❌ Sync failed',
  FORCE_SYNC_STARTING: '🔄 Starting force sync...',
  FORCE_SYNC_SUCCESS: '✅ Force sync completed!',
  FORCE_SYNC_FAILED: '❌ Force sync failed',

  // Error messages
  NETWORK_ERROR: 'Network error: Unable to connect to',
  FETCH_MEMOS_ERROR: 'Unable to fetch memos',

  // Generic buttons
  CONFIRM_OK: 'OK',
  CONFIRM_CANCEL: 'Cancel',
};
