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
  private dailyNoteModifier: DailyNoteModifier;

  constructor(app: App, settings: MemosSettings) {
    this.app = app;
    this.settings = settings;
    this.apiClient = new MemosAPIClient(settings.apiUrl, settings.apiToken, settings.apiVersion);
    this.dailyNoteModifier = new DailyNoteModifier(settings.dailyMemoHeader);
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
    const paginator = new SimpleMemosPaginator(this.apiClient, '', this.settings.useCalloutFormat, this.settings.useListCalloutFormat, this.settings.syncDaysLimit);

    const newLastTime = await this.processMemos(paginator);
    localStorage.setItem('yams-last-sync-time', newLastTime);
    localStorage.setItem('yams-last-sync-date', new Date().toDateString());
  }

  /**
   * Process memos and update daily notes
   */
  private async processMemos(paginator: SimpleMemosPaginator): Promise<string> {
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
        const modifiedContent = this.dailyNoteModifier.modifyDailyNote(
          currentContent,
          dateStr,
          memos
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
