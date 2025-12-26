/**
 * Status Bar Manager - Invisible Interface Edition
 * Minimal, content-first display. The data speaks for itself.
 */

import * as vscode from 'vscode';
import { ModelQuota } from './quotaService';
import { SnapshotWithInsights, ModelWithInsights } from './insights';

export type DisplayStyle = 'percentage' | 'progressBar' | 'dots';

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private lastSnapshot: SnapshotWithInsights | undefined;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'workbench.view.extension.antigravity-usage-container';
    this.statusBarItem.text = 'AG';
    this.statusBarItem.tooltip = 'Antigravity Usage - Loading...';
    this.statusBarItem.show();
  }

  public showDetecting() {
    this.statusBarItem.text = 'AG...';
    this.statusBarItem.tooltip = 'Detecting Antigravity...';
    this.statusBarItem.backgroundColor = undefined;
  }

  public showInitializing() {
    this.statusBarItem.text = 'AG...';
    this.statusBarItem.tooltip = 'Initializing...';
    this.statusBarItem.backgroundColor = undefined;
  }

  public showFetching() {
    this.statusBarItem.text = 'AG...';
    this.statusBarItem.tooltip = 'Syncing...';
    this.statusBarItem.backgroundColor = undefined;
  }

  public showRetrying(attempt: number, maxAttempts: number) {
    this.statusBarItem.text = `AG $(sync~spin) ${attempt}/${maxAttempts}`;
    this.statusBarItem.tooltip = `Retrying... (${attempt}/${maxAttempts})`;
    this.statusBarItem.backgroundColor = undefined;
  }

  public showRefreshing() {
    this.statusBarItem.text = 'AG $(sync~spin)';
    this.statusBarItem.tooltip = 'Refreshing...';
    this.statusBarItem.backgroundColor = undefined;
  }

  public showError(message: string) {
    this.statusBarItem.text = 'AG';
    this.statusBarItem.tooltip = `Error: ${message}\n\nClick to retry`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  /**
   * Main update with insights data - minimal display
   */
  public updateWithInsights(snapshot: SnapshotWithInsights) {
    this.lastSnapshot = snapshot;

    const models = snapshot.modelsWithInsights;
    if (!models || models.length === 0) {
      this.statusBarItem.text = 'AG —';
      this.statusBarItem.tooltip = 'No data available';
      this.statusBarItem.backgroundColor = undefined;
      return;
    }

    // Find primary model (sorted by priority: Pinned > Active > Lowest)
    const primary = models[0];
    const shortName = this.getShortName(primary.label);

    // Clean, minimal display based on configured style
    const config = vscode.workspace.getConfiguration('antigravity');
    const style = config.get<DisplayStyle>('displayStyle', 'percentage');
    this.statusBarItem.text = this.formatDisplay(shortName, primary.remainingPercent, style);

    // Background only for critical situations
    if (primary.isExhausted || primary.remainingPercent < 15) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (primary.remainingPercent < 25) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }

    this.statusBarItem.tooltip = this.buildMarkdownTooltip(snapshot);
  }

  /**
   * Fallback for basic quota data (without insights)
   */
  public update(quotas: ModelQuota[]) {
    if (!quotas || quotas.length === 0) {
      this.statusBarItem.text = 'AG —';
      this.statusBarItem.tooltip = 'No data available';
      this.statusBarItem.backgroundColor = undefined;
      return;
    }

    // Find most used model
    const sorted = [...quotas].sort((a, b) => a.remainingPercent - b.remainingPercent);
    const primary = sorted[0];
    const shortName = this.getShortName(primary.label);

    this.statusBarItem.text = `${shortName} ${primary.remainingPercent}%`;

    if (primary.isExhausted || primary.remainingPercent < 15) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (primary.remainingPercent < 25) {
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    } else {
      this.statusBarItem.backgroundColor = undefined;
    }

    // Simple tooltip
    const lines = quotas.map(q => {
      const reset = q.timeUntilReset ? ` · ${q.timeUntilReset}` : '';
      return `${q.label}: ${q.remainingPercent}%${reset}`;
    });
    this.statusBarItem.tooltip = lines.join('\n');
  }

  private getShortName(label: string): string {
    if (label.includes('Claude')) {
      if (label.includes('Sonnet')) return 'Sonnet';
      if (label.includes('Opus')) return 'Opus';
      if (label.includes('Haiku')) return 'Haiku';
      return 'Claude';
    }
    if (label.includes('Gemini')) {
      if (label.includes('Pro')) return 'Pro';
      if (label.includes('Flash')) return 'Flash';
      return 'Gemini';
    }
    if (label.includes('GPT') || label.includes('O3') || label.includes('O1')) {
      return 'GPT';
    }
    // First word, max 6 chars
    return label.split(' ')[0].substring(0, 6);
  }

  /**
   * Format display based on style preference
   */
  private formatDisplay(name: string, percent: number, style: DisplayStyle): string {
    switch (style) {
      case 'progressBar':
        return `${name} ${this.buildProgressBar(percent)}`;
      case 'dots':
        return `${name} ${this.buildDots(percent)}`;
      case 'percentage':
      default:
        return `${name} ${percent}%`;
    }
  }

  private buildProgressBar(percent: number): string {
    const filled = Math.round(percent / 20);
    const empty = 5 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private buildDots(percent: number): string {
    const filled = Math.round(percent / 20);
    const empty = 5 - filled;
    return '●'.repeat(filled) + '○'.repeat(empty);
  }

  /**
   * Build rich markdown tooltip with credits and models
   */
  private buildMarkdownTooltip(snapshot: SnapshotWithInsights): vscode.MarkdownString {
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.supportHtml = true;

    // Credits section
    const config = vscode.workspace.getConfiguration('antigravity');
    const showFlow = config.get<boolean>('showFlowCredits', true);

    if (snapshot.promptCredits || snapshot.flowCredits) {
      md.appendMarkdown('### Credits\n');
      if (snapshot.promptCredits) {
        const p = snapshot.promptCredits;
        md.appendMarkdown(`**Prompt** (reasoning): ${p.available.toLocaleString()} / ${p.monthly.toLocaleString()} (${p.remainingPercent}%)\n\n`);
      }
      if (showFlow && snapshot.flowCredits) {
        const f = snapshot.flowCredits;
        md.appendMarkdown(`**Flow** (execution): ${f.available.toLocaleString()} / ${f.monthly.toLocaleString()} (${f.remainingPercent}%)\n\n`);
      }
      md.appendMarkdown('---\n');
    }

    // Model table
    md.appendMarkdown('### Models\n\n');
    md.appendMarkdown('| Model | Quota | Reset |\n');
    md.appendMarkdown('|-------|-------|-------|\n');

    for (const model of snapshot.modelsWithInsights) {
      const status = model.isExhausted ? '🔴' : (model.remainingPercent < 25 ? '🟡' : '🟢');
      const reset = model.timeUntilReset || '—';
      md.appendMarkdown(`| ${status} ${model.label} | ${model.remainingPercent}% | ${reset} |\n`);
    }

    md.appendMarkdown('\n*Click for dashboard*');
    return md;
  }

  private buildMinimalTooltip(snapshot: SnapshotWithInsights): string {
    const lines: string[] = [];

    // Just the model list with percentages
    for (const model of snapshot.modelsWithInsights) {
      const active = model.insights.isActive ? '› ' : '  ';
      const reset = model.timeUntilReset ? ` · ${model.timeUntilReset}` : '';
      lines.push(`${active}${model.label}: ${model.remainingPercent}%${reset}`);
    }

    // Credits if available
    if (snapshot.promptCredits) {
      lines.push('');
      lines.push(`Credits: ${snapshot.promptCredits.available.toLocaleString()} / ${snapshot.promptCredits.monthly.toLocaleString()}`);
    }

    lines.push('');
    lines.push('Click for details');

    return lines.join('\n');
  }

  public getSnapshot(): SnapshotWithInsights | undefined {
    return this.lastSnapshot;
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
