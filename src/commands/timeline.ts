import { MarkdownView, Notice, Plugin, TFile, moment } from 'obsidian';
import { createDailyNote, getAllDailyNotes, getDailyNote, appHasDailyNotesPluginLoaded } from 'obsidian-daily-notes-interface';
import { MemosSettings } from '../types';
import { t } from '../i18n/translationManager';
import { TimelineModal } from '../ui/timelineModal';
import { insertTimelineEntry, validateTimelineHeader } from '../utils/timelineEntry';

export function registerTimelineCommand(plugin: Plugin, settings: () => MemosSettings): void {
  let active = false;
  let currentModal: TimelineModal | undefined;
  plugin.register(() => currentModal?.close());
  plugin.addCommand({
    id: 'add-timeline-entry',
    name: t.t('TIMELINE_ADD'),
    callback: () => {
      if (active) return;
      const validate = (): string => {
        const config = settings();
        const error = validateTimelineHeader(config.timelineHeader, config.profiles.map(p => p.dailyMemoHeader));
        if (error) throw new Error(t.t(error === 'conflict' ? 'TIMELINE_CONFLICT' : 'TIMELINE_CONFIGURE'));
        return config.timelineHeader;
      };
      try {
        validate();
        if (!appHasDailyNotesPluginLoaded()) throw new Error(t.t('TIMELINE_DAILY_NOTES'));
      } catch (error) {
        new Notice(error instanceof Error ? error.message : String(error));
        return;
      }
      const started = new Date();
      active = true;
      let saved: { file: TFile; cursor: number } | undefined;
      const modal = new TimelineModal(plugin.app, async text => {
        // Keep successful writes across navigation retries, avoiding duplicate entries.
        if (!saved) {
          const header = validate();
          const day = moment(started);
          const candidate = getDailyNote(day, getAllDailyNotes()) ?? await createDailyNote(day);
          if (!(candidate instanceof TFile)) throw new Error(t.t('TIMELINE_FAILED'));
          let cursor = 0;
          await plugin.app.vault.process(candidate, content => {
            const result = insertTimelineEntry(content, header, text, started);
            cursor = result.cursor;
            return result.content;
          });
          saved = { file: candidate, cursor };
        }
        const leaf = plugin.app.workspace.getLeaf(false);
        await leaf.openFile(saved.file, { state: { mode: 'source' } });
        if (!(leaf.view instanceof MarkdownView)) throw new Error(t.t('TIMELINE_FAILED'));
        const editor = leaf.view.editor;
        const position = editor.offsetToPos(saved.cursor);
        editor.setCursor(position);
        editor.scrollIntoView({ from: position, to: position }, true);
        return () => editor.focus();
      }, () => { active = false; currentModal = undefined; });
      currentModal = modal;
      modal.open();
    },
  });
}
