import { App, TFile, moment } from 'obsidian';
import { getDailyNote, createDailyNote, getAllDailyNotes, getDateFromFile } from 'obsidian-daily-notes-interface';

type MomentInstance = ReturnType<typeof moment>;
import { MemosAPIClient } from '../api/memosClient';
import { SimpleMemosPaginator } from '../api/memosPaginator';
import { DailyNoteModifier } from '../utils/dailyNoteModifier';
import { headingTitle } from '../utils/markdownSections';
import { t } from '../i18n/translationManager';
import { MemosProfile, MemosSettings } from '../types';

export interface SyncStateStore {
  markSyncedToday(): Promise<void>;
}

export type SyncMode = 'smart' | 'incremental' | 'force';

export class DailyNoteManager {
  constructor(
    private app: App,
    private settings: MemosSettings,
    private state: SyncStateStore,
  ) {}

  updateSettings(settings: MemosSettings): void {
    this.settings = settings;
  }

  async syncAll(mode: SyncMode): Promise<void> {
    const profiles = (this.settings.profiles || []).filter(p => p.enabled && p.apiUrl && p.apiToken);
    if (profiles.length === 0) {
      console.warn('No enabled profiles configured');
      return;
    }
    for (const profile of profiles) {
      try {
        await this.syncProfile(profile, mode);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Sync failed for profile "${profile.name}":`, error);
        throw new Error(`Profile "${profile.name}": ${message}`);
      }
    }
    await this.state.markSyncedToday();
  }

  private async syncProfile(profile: MemosProfile, mode: SyncMode): Promise<void> {
    if (this.settings.timelineHeader.trim() && headingTitle(this.settings.timelineHeader) === headingTitle(profile.dailyMemoHeader)) {
      throw new Error(t.t('TIMELINE_CONFLICT'));
    }
    const client = new MemosAPIClient(profile.apiUrl, profile.apiToken);

    // 'force' ignores syncDaysLimit and reconciles the entire history.
    // 'smart' and 'incremental' both reconcile the full syncDaysLimit window
    // on every run - see SimpleMemosPaginator for why cursor-based
    // incremental fetching was dropped (it broke permanently on any
    // out-of-order memo timestamp, backdated or future-dated).
    const effectiveSyncDaysLimit = mode === 'force' ? 0 : profile.syncDaysLimit;

    const paginator = new SimpleMemosPaginator(
      client,
      this.settings.useCalloutFormat,
      this.settings.useListCalloutFormat,
      this.settings.skipImages,
      effectiveSyncDaysLimit,
    );

    await this.processMemos(paginator, profile);
  }

  private async processMemos(
    paginator: SimpleMemosPaginator,
    profile: MemosProfile,
  ): Promise<void> {
    const modifier = new DailyNoteModifier(profile.dailyMemoHeader);
    const { dailyMemosByDay, cutoffTimestamp } = await paginator.collect();

    // A day whose memos were all deleted remotely never appears in
    // dailyMemosByDay (there's nothing fetched for it), so without this it
    // would be silently skipped and its stale entries would never be
    // cleaned up. Add an empty bucket for every existing daily note inside
    // the sync window so modifyDailyNote still runs deletion detection
    // against it.
    for (const file of Object.values(getAllDailyNotes())) {
      const day = getDateFromFile(file, 'day');
      if (!day) continue;
      if (cutoffTimestamp > 0 && day.unix() < cutoffTimestamp) continue;
      const dateStr = day.format('YYYY-MM-DD');
      if (!(dateStr in dailyMemosByDay)) {
        dailyMemosByDay[dateStr] = {};
      }
    }

    for (const [dateStr, memos] of Object.entries(dailyMemosByDay)) {
      try {
        const momentDay = moment(dateStr);
        if (!momentDay.isValid()) {
          console.warn(`Invalid date: ${dateStr}`);
          continue;
        }

        const dailyNote = await this.getOrCreateDailyNote(momentDay);
        if (!dailyNote) {
          continue;
        }

        await this.app.vault.process(dailyNote, currentContent =>
          modifier.modifyDailyNote(currentContent, dateStr, memos) ?? currentContent
        );
      } catch (error) {
        console.error(`Failed to process memos for ${dateStr}:`, error);
      }
    }
  }

  private async getOrCreateDailyNote(momentDay: MomentInstance): Promise<TFile | null> {
    try {
      // obsidian-daily-notes-interface bundles its own (older) obsidian.d.ts,
      // so use instanceof to narrow against the project's TFile class.
      const existing = getDailyNote(momentDay, getAllDailyNotes());
      if (existing instanceof TFile) {
        return existing;
      }
      if (this.settings.createMissingDailyNotes) {
        const created = await createDailyNote(momentDay);
        if (created instanceof TFile) {
          return created;
        }
      }
      return null;
    } catch (error) {
      console.error('Failed to get/create daily note:', error);
      return null;
    }
  }
}
