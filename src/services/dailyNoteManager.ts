import { App, TFile } from 'obsidian';
import { getDailyNote, createDailyNote, getAllDailyNotes } from 'obsidian-daily-notes-interface';
import { MemosAPIClient } from '../api/memosClient';
import { SimpleMemosPaginator } from '../api/memosPaginator';
import { DailyNoteModifier } from '../utils/dailyNoteModifier';
import { MemosSettings } from '../types';

export class DailyNoteManager {
  private app: App;
  private settings: MemosSettings;
  private apiClient: MemosAPIClient;

  constructor(app: App, settings: MemosSettings) {
    this.app = app;
    this.settings = settings;
    this.updateAPIClient();
  }

  /**
   * Update settings and refresh dependent services
   */
  updateSettings(settings: MemosSettings): void {
    this.settings = settings;
    this.updateAPIClient();
  }

  /**
   * Update API client with current settings
   */
  private updateAPIClient(): void {
    this.apiClient = new MemosAPIClient(this.settings.apiUrl, this.settings.apiToken, this.settings.apiVersion);
  }

  /**
   * Get current daily note modifier with latest settings
   */
  private getDailyNoteModifier(): DailyNoteModifier {
    return new DailyNoteModifier(this.settings.dailyMemoHeader);
  }

  /**
   * Sync memos with deletion detection
   */
  async sync(): Promise<void> {
    const lastTime = localStorage.getItem('yams-last-sync-time') || '';
    const paginator = new SimpleMemosPaginator(this.apiClient, lastTime, this.settings.useCalloutFormat, this.settings.useListCalloutFormat, this.settings.syncDaysLimit);

    const newLastTime = await this.processMemos(paginator);
    localStorage.setItem('yams-last-sync-time', newLastTime);
    localStorage.setItem('yams-last-sync-date', new Date().toDateString());
  }

  /**
   * Force sync all memos (ignore last time)
   */
  async forceSync(): Promise<void> {
    console.log('Starting force sync - will overwrite all local content');
    const paginator = new SimpleMemosPaginator(this.apiClient, '', this.settings.useCalloutFormat, this.settings.useListCalloutFormat, this.settings.syncDaysLimit);

    const newLastTime = await this.processMemos(paginator);
    localStorage.setItem('yams-last-sync-time', newLastTime);
    localStorage.setItem('yams-last-sync-date', new Date().toDateString());
  }

  /**
   * Smart sync - detects if local content was modified and handles accordingly
   */
  async smartSync(): Promise<void> {
    const lastTime = localStorage.getItem('yams-last-sync-time') || '';

    if (!lastTime) {
      console.log('No previous sync found, performing full sync');
      await this.forceSync();
      return;
    }

    // First try incremental sync
    console.log('Attempting incremental sync from', new Date(parseInt(lastTime) * 1000));
    const paginator = new SimpleMemosPaginator(this.apiClient, lastTime, this.settings.useCalloutFormat, this.settings.useListCalloutFormat, this.settings.syncDaysLimit);

    const newLastTime = await this.processMemos(paginator, true); // true = incremental sync

    if (newLastTime && newLastTime !== lastTime) {
      localStorage.setItem('yams-last-sync-time', newLastTime);
      localStorage.setItem('yams-last-sync-date', new Date().toDateString());
      console.log('Incremental sync completed, updated lastTime to', new Date(parseInt(newLastTime) * 1000));
    } else {
      console.log('No new memos found since last sync');
    }
  }

  /**
   * Process memos and update daily notes
   */
  private async processMemos(paginator: SimpleMemosPaginator, isIncrementalSync: boolean = false): Promise<string> {
    let lastTime = '';

    await paginator.foreach(async ([dateStr, memos]) => {
      try {
        // Parse date and get/create daily note
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

        // Update the daily note content only if there are changes
        const currentContent = await this.app.vault.read(dailyNote);
        const modifiedContent = this.getDailyNoteModifier().modifyDailyNote(
          currentContent,
          dateStr,
          memos,
          isIncrementalSync
        );

        // Only write if there are actual changes
        if (modifiedContent && modifiedContent !== currentContent) {
          await this.app.vault.modify(dailyNote, modifiedContent);
          console.log(`Updated daily note for ${dateStr} with ${Object.keys(memos).length} memos`);
        }

        // Track the latest timestamp
        const timestamps = Object.keys(memos);
        if (timestamps.length > 0) {
          const latestTimestamp = Math.max(...timestamps.map(t => parseInt(t))).toString();
          if (!lastTime || parseInt(latestTimestamp) > parseInt(lastTime)) {
            lastTime = latestTimestamp;
          }
        }

      } catch (error) {
        console.error(`Failed to process memos for ${dateStr}:`, error);
      }
    });

    return lastTime;
  }

  /**
   * Get or create daily note for given date
   */
  private async getOrCreateDailyNote(momentDay: any): Promise<TFile | null> {
    try {
      // Try to get existing daily note
      let dailyNote = getDailyNote(momentDay, getAllDailyNotes());

      // Create if doesn't exist and setting allows it
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
