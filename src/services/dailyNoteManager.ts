import { App, TFile } from 'obsidian';
import { getDailyNote, createDailyNote, getAllDailyNotes } from 'obsidian-daily-notes-interface';
import { MemosAPIClient } from '../api/memosClient';
import { SimpleMemosPaginator } from '../api/memosPaginator';
import { DailyNoteModifier } from '../utils/dailyNoteModifier';
import { MemosProfile, MemosSettings } from '../types';

export interface SyncStateStore {
  getLastSync(profileId: string): string;
  setLastSync(profileId: string, value: string): Promise<void>;
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
        console.error(`Sync failed for profile "${profile.name}":`, error);
        throw error;
      }
    }
    await this.state.markSyncedToday();
  }

  private async syncProfile(profile: MemosProfile, mode: SyncMode): Promise<void> {
    const client = new MemosAPIClient(profile.apiUrl, profile.apiToken);
    const lastTime = this.state.getLastSync(profile.id);

    let effectiveLastTime: string;
    let isIncrementalSync: boolean;

    if (mode === 'force') {
      effectiveLastTime = '';
      isIncrementalSync = false;
    } else if (mode === 'incremental') {
      effectiveLastTime = lastTime;
      isIncrementalSync = true;
    } else {
      // smart: full sync if never synced before, otherwise incremental
      if (!lastTime) {
        effectiveLastTime = '';
        isIncrementalSync = false;
      } else {
        effectiveLastTime = lastTime;
        isIncrementalSync = true;
      }
    }

    const paginator = new SimpleMemosPaginator(
      client,
      effectiveLastTime,
      this.settings.useCalloutFormat,
      this.settings.useListCalloutFormat,
      this.settings.skipImages,
      profile.syncDaysLimit,
    );

    const newLastTime = await this.processMemos(paginator, profile, isIncrementalSync);
    if (newLastTime && newLastTime !== lastTime) {
      await this.state.setLastSync(profile.id, newLastTime);
    }
  }

  private async processMemos(
    paginator: SimpleMemosPaginator,
    profile: MemosProfile,
    isIncrementalSync: boolean,
  ): Promise<string> {
    const modifier = new DailyNoteModifier(profile.dailyMemoHeader);
    let lastTime = '';

    await paginator.foreach(async ([dateStr, memos]) => {
      try {
        const momentDay = window.moment(dateStr);
        if (!momentDay.isValid()) {
          console.warn(`Invalid date: ${dateStr}`);
          return;
        }

        const dailyNote = await this.getOrCreateDailyNote(momentDay);
        if (!dailyNote) {
          console.warn(`Could not create daily note for ${dateStr}`);
          return;
        }

        const currentContent = await this.app.vault.read(dailyNote);
        const modifiedContent = modifier.modifyDailyNote(currentContent, dateStr, memos, isIncrementalSync);

        if (modifiedContent && modifiedContent !== currentContent) {
          await this.app.vault.modify(dailyNote, modifiedContent);
          console.log(`[${profile.name}] Updated ${dateStr} with ${Object.keys(memos).length} memos`);
        }

        const timestamps = Object.keys(memos);
        if (timestamps.length > 0) {
          const latest = Math.max(...timestamps.map(t => parseInt(t))).toString();
          if (!lastTime || parseInt(latest) > parseInt(lastTime)) {
            lastTime = latest;
          }
        }
      } catch (error) {
        console.error(`Failed to process memos for ${dateStr}:`, error);
      }
    });

    return lastTime;
  }

  private async getOrCreateDailyNote(momentDay: any): Promise<TFile | null> {
    try {
      let dailyNote = getDailyNote(momentDay, getAllDailyNotes());
      if (!dailyNote && this.settings.createMissingDailyNotes) {
        dailyNote = await createDailyNote(momentDay);
      }
      return dailyNote;
    } catch (error) {
      console.error('Failed to get/create daily note:', error);
      return null;
    }
  }
}
