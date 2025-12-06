/**
 * Antigravity Usage Extension
 * Main entry point
 */

import * as vscode from 'vscode';
import { QuotaService } from './quotaService';
import { StatusBarManager } from './statusBar';
import { PortDetector } from './portDetector';

let intervalId: NodeJS.Timeout | undefined;
let quotaService: QuotaService;
let statusBarManager: StatusBarManager;
let portDetector: PortDetector;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Antigravity Usage is starting...');

  quotaService = new QuotaService();
  statusBarManager = new StatusBarManager();
  portDetector = new PortDetector();

  // Command to show the menu (QuickPick)
  let menuCommand = vscode.commands.registerCommand('antigravity-quota.showMenu', async () => {
    const quotas = quotaService.getQuota();
    const items = quotas.map(q => ({
      label: q.modelName,
      description: `${q.usagePercent}% Used`,
      detail: q.isPinned ? '$(pin) Pinned' : '',
      original: q
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a model to view details'
    });

    if (selected) {
      vscode.window.showInformationMessage(`Model: ${selected.label} - ${selected.description}`);
    }
  });

  // Command to refresh quota
  let refreshCommand = vscode.commands.registerCommand('antigravity-quota.refresh', async () => {
    vscode.window.showInformationMessage('Refreshing quota...');
    await detectAndPoll();
  });

  // Command to re-detect port
  let detectCommand = vscode.commands.registerCommand('antigravity-quota.detectPort', async () => {
    vscode.window.showInformationMessage('Re-detecting port...');
    const result = await portDetector.detect();
    if (result) {
      quotaService.setConnection(result.connectPort, result.csrfToken);
      vscode.window.showInformationMessage(`Port detected: ${result.connectPort}`);
      await quotaService.poll().then(data => statusBarManager.update(data));
    } else {
      vscode.window.showErrorMessage('Port detection failed. Is Antigravity running?');
    }
  });

  context.subscriptions.push(statusBarManager);
  context.subscriptions.push(menuCommand);
  context.subscriptions.push(refreshCommand);
  context.subscriptions.push(detectCommand);

  // Initial detection and polling
  await detectAndPoll();

  // Start polling loop
  intervalId = setInterval(async () => {
    const data = await quotaService.poll();
    statusBarManager.update(data);
  }, 60 * 1000);
}

async function detectAndPoll() {
  statusBarManager.showDetecting();

  try {
    const result = await portDetector.detect();

    if (result) {
      quotaService.setConnection(result.connectPort, result.csrfToken);
      vscode.window.showInformationMessage(`AntiGravity detected! Port: ${result.connectPort}`);

      const data = await quotaService.poll();
      statusBarManager.update(data);
    } else {
      statusBarManager.showError('Port detection failed');
      vscode.window.showWarningMessage(
        'Antigravity Usage: Could not detect Antigravity process.',
        'Retry'
      ).then(action => {
        if (action === 'Retry') {
          detectAndPoll();
        }
      });
    }
  } catch (error: any) {
    console.error('Detection error:', error);
    statusBarManager.showError(error.message);
  }
}

export function deactivate() {
  if (intervalId) {
    clearInterval(intervalId);
  }
}
