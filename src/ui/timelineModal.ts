import { App, Modal, Notice, Setting } from 'obsidian';
import { t } from '../i18n/translationManager';

export class TimelineModal extends Modal {
  private submitting = false;

  constructor(app: App, private submit: (text: string) => Promise<() => void>, private closed: () => void) {
    super(app);
  }

  onOpen(): void {
    this.titleEl.setText(t.t('TIMELINE_ADD'));
    this.contentEl.createEl('p', { text: t.t('TIMELINE_INPUT_HINT') });
    const input = this.contentEl.createEl('textarea', { cls: 'yams-timeline-input' });
    input.setAttribute('aria-label', t.t('TIMELINE_ADD'));
    input.rows = 6;
    const send = async (): Promise<void> => {
      if (this.submitting || !input.value.trim()) return;
      this.submitting = true;
      input.disabled = true;
      button.setDisabled(true);
      try {
        const focus = await this.submit(input.value);
        this.close();
        focus();
      } catch (error) {
        const message = error instanceof Error && error.message === 'duplicate'
          ? t.t('TIMELINE_DUPLICATE') : error instanceof Error ? error.message : String(error);
        new Notice(`${t.t('TIMELINE_FAILED')}: ${message}`);
        this.submitting = false;
        input.disabled = false;
        button.setDisabled(false);
        input.focus();
      }
    };
    let button: import('obsidian').ButtonComponent;
    new Setting(this.contentEl)
      .addButton(cancel => cancel.setButtonText(t.t('CONFIRM_CANCEL')).onClick(() => this.close()))
      .addButton(add => {
        button = add;
        add.setButtonText(t.t('TIMELINE_SUBMIT')).setCta().onClick(() => { void send(); });
      });
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.isComposing) {
        event.preventDefault();
        void send();
      }
    });
    input.focus();
  }

  onClose(): void {
    this.contentEl.empty();
    this.closed();
  }
}
