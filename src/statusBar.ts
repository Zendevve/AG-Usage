/**
 * Status Bar Manager
 * Displays quota information in the VS Code status bar
 */

import * as vscode from 'vscode';
import { ModelQuota } from './quotaService';

export class StatusBarManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'antigravity-quota.showMenu';
    this.statusBarItem.text = '$(sync~spin) AntiGravity';
    this.statusBarItem.tooltip = 'AntiGravity Quota - Loading...';
    this.statusBarItem.show();
  }

  public showDetecting() {
    this.statusBarItem.text = '$(sync~spin) Detecting...';
    this.statusBarItem.tooltip = 'Detecting AntiGravity process...';
    this.statusBarItem.backgroundColor = undefined;
  }

  public showError(message: string) {
    this.statusBarItem.text = '$(error) AntiGravity';
    this.statusBarItem.tooltip = `Error: ${message}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }

  public update(quotas: ModelQuota[]) {
    if (!quotas || quotas.length === 0) {
      this.statusBarItem.text = '$(warning) No Quota Data';
      this.statusBarItem.tooltip = 'No quota information available';
      return;
    }

    // Find pinned model or use first one
    const pinnedQuota = quotas.find(q => q.isPinned) || quotas[0];
    const usage = pinnedQuota.usagePercent;

    // Choose icon based on usage level
    let icon = '$(check)';
    let bgColor: vscode.ThemeColor | undefined = undefined;

    if (usage >= 90) {
      icon = '$(error)';
      bgColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    } else if (usage >= 70) {
      icon = '$(warning)';
      bgColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }

    // Build progress bar
    const progressBar = this.buildProgressBar(usage);

    this.statusBarItem.text = `${icon} ${progressBar} ${usage}%`;
    this.statusBarItem.backgroundColor = bgColor;

    // Build detailed tooltip
    const tooltipLines = quotas.map(q => {
      const bar = this.buildProgressBar(q.usagePercent);
      return `${q.modelName}: ${bar} ${q.usagePercent}%`;
    });
    this.statusBarItem.tooltip = tooltipLines.join('\n');
  }

  private buildProgressBar(percent: number): string {
    const filled = Math.round(percent / 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  public dispose() {
    this.statusBarItem.dispose();
  }
}
