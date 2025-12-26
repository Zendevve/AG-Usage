/**
 * Sidebar View Provider - Premium Dashboard Edition
 * Modern Dark + Native Minimal theme support.
 */

import * as vscode from 'vscode';
import { SnapshotWithInsights, ModelWithInsights, UsageBucket } from './insights';
import { CacheInfo } from './cacheService';

export type DashboardTheme = 'modern' | 'minimal';

export class QuotaViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'antigravity-usage.quotaView';

  private _view?: vscode.WebviewView;
  private lastSnapshot?: SnapshotWithInsights;
  private lastCacheInfo?: CacheInfo;
  private showInsights = false;

  constructor(
    private readonly _extensionUri: vscode.Uri,
  ) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.onDidReceiveMessage(data => {
      switch (data.command) {
        case 'toggleInsights':
          this.showInsights = !this.showInsights;
          if (this.lastSnapshot) {
            this.update(this.lastSnapshot, this.lastCacheInfo);
          }
          break;
        case 'cleanCache':
          vscode.commands.executeCommand('antigravity-quota.cleanCache');
          break;
        case 'manageCache':
          vscode.commands.executeCommand('antigravity-quota.manageCache');
          break;
        case 'refresh':
          vscode.commands.executeCommand('antigravity-quota.refresh');
          break;
      }
    });

    if (this.lastSnapshot) {
      this.update(this.lastSnapshot);
    }
  }

  private getTheme(): DashboardTheme {
    const config = vscode.workspace.getConfiguration('antigravity');
    return config.get<DashboardTheme>('dashboardTheme', 'modern');
  }

  public update(snapshot: SnapshotWithInsights, cacheInfo?: CacheInfo) {
    this.lastSnapshot = snapshot;
    if (cacheInfo) {
      this.lastCacheInfo = cacheInfo;
    }
    if (this._view) {
      const theme = this.getTheme();
      this._view.webview.html = theme === 'modern'
        ? this.getModernHtml(snapshot, this.lastCacheInfo)
        : this.getMinimalHtml(snapshot, this.lastCacheInfo);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MODERN DARK THEME
  // ═══════════════════════════════════════════════════════════════════════════

  private getModernHtml(snapshot: SnapshotWithInsights, cacheInfo?: CacheInfo): string {
    const timestamp = snapshot.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Calculate overall health for the gauge
    const primary = snapshot.modelsWithInsights[0];
    const gaugePercent = primary?.remainingPercent ?? 100;
    const gaugeColor = this.getGaugeColor(gaugePercent);

    const modelsHtml = snapshot.modelsWithInsights
      .map(model => this.renderModernModelRow(model))
      .join('');

    const creditsHtml = this.renderModernCredits(snapshot);
    const historyHtml = this.renderModernHistory(snapshot.usageBuckets);
    const cacheHtml = cacheInfo ? this.renderModernCache(cacheInfo) : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quota Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 16px;
      line-height: 1.5;
    }

    /* Modern Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .header h1 {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
    }

    .time {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      opacity: 0.7;
    }

    /* Semi-Arc Gauge */
    .gauge-container {
      display: flex;
      justify-content: center;
      margin-bottom: 24px;
    }

    .gauge {
      position: relative;
      width: 160px;
      height: 90px;
      overflow: hidden;
    }

    .gauge-bg {
      position: absolute;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: conic-gradient(
        from 180deg,
        var(--vscode-editor-background) 0deg,
        var(--vscode-editor-background) 180deg,
        rgba(255,255,255,0.05) 180deg,
        rgba(255,255,255,0.05) 360deg
      );
      clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
    }

    .gauge-fill {
      position: absolute;
      width: 160px;
      height: 160px;
      border-radius: 50%;
      background: conic-gradient(
        from 180deg,
        transparent 0deg,
        transparent 180deg,
        ${gaugeColor} 180deg,
        ${gaugeColor} ${180 + (gaugePercent * 1.8)}deg,
        transparent ${180 + (gaugePercent * 1.8)}deg
      );
      clip-path: polygon(0 0, 100% 0, 100% 50%, 0 50%);
    }

    .gauge-inner {
      position: absolute;
      top: 10px;
      left: 10px;
      width: 140px;
      height: 140px;
      border-radius: 50%;
      background: var(--vscode-editor-background);
    }

    .gauge-value {
      position: absolute;
      bottom: 8px;
      left: 0;
      right: 0;
      text-align: center;
    }

    .gauge-percent {
      font-size: 32px;
      font-weight: 300;
      color: ${gaugeColor};
    }

    .gauge-label {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Model List - Modern */
    .model-list {
      margin-bottom: 20px;
    }

    .model-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      margin-bottom: 6px;
      background: rgba(255,255,255,0.03);
      border-radius: 6px;
      border-left: 3px solid transparent;
      transition: all 0.15s ease;
    }

    .model-row:hover {
      background: rgba(255,255,255,0.06);
    }

    .model-row.active {
      border-left-color: var(--vscode-textLink-foreground);
    }

    .model-row.pinned {
      border-left-color: var(--vscode-editorWarning-foreground);
    }

    .model-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .model-name {
      font-size: 13px;
      font-weight: 500;
    }

    .model-meta {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
    }

    .model-stats {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .model-percent {
      font-size: 14px;
      font-weight: 600;
      min-width: 45px;
      text-align: right;
    }

    .model-percent.critical { color: #f85149; }
    .model-percent.warning { color: #d29922; }
    .model-percent.good { color: #3fb950; }

    /* Sparkline */
    .sparkline {
      width: 50px;
      height: 20px;
      opacity: 0.6;
    }

    .sparkline polyline {
      fill: none;
      stroke: var(--vscode-textLink-foreground);
      stroke-width: 1.5;
      stroke-linecap: round;
    }

    /* Credits Section - Modern */
    .credits-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
      padding: 14px;
      background: rgba(255,255,255,0.02);
      border-radius: 8px;
    }

    .credit-item {
      text-align: center;
    }

    .credit-value {
      font-size: 18px;
      font-weight: 300;
    }

    .credit-label {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* History Section */
    .section {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    .chart-container {
      display: flex;
      align-items: flex-end;
      height: 50px;
      gap: 2px;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, var(--vscode-textLink-foreground), rgba(88,166,255,0.3));
      min-height: 2px;
      border-radius: 2px 2px 0 0;
      transition: opacity 0.15s;
    }

    .chart-bar:hover {
      opacity: 0.8;
    }

    /* Cache Section */
    .cache-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .cache-stat {
      padding: 10px;
      background: rgba(255,255,255,0.03);
      border-radius: 6px;
      text-align: center;
    }

    .cache-value {
      font-size: 16px;
      font-weight: 500;
    }

    .cache-label {
      font-size: 10px;
      color: var(--vscode-descriptionForeground);
    }

    /* Buttons */
    .btn-group {
      display: flex;
      gap: 8px;
    }

    .btn {
      flex: 1;
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.05);
      color: var(--vscode-foreground);
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.1);
    }

    /* Footer */
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }

    .link-btn {
      background: none;
      border: none;
      color: var(--vscode-textLink-foreground);
      font-size: 11px;
      cursor: pointer;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .refresh-btn {
      background: none;
      border: none;
      color: var(--vscode-descriptionForeground);
      font-size: 14px;
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.15s;
    }

    .refresh-btn:hover {
      opacity: 1;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Quota Dashboard</h1>
    <span class="time">${timestamp}</span>
  </div>

  <div class="gauge-container">
    <div class="gauge">
      <div class="gauge-bg"></div>
      <div class="gauge-fill"></div>
      <div class="gauge-inner"></div>
      <div class="gauge-value">
        <div class="gauge-percent">${gaugePercent}%</div>
        <div class="gauge-label">${primary?.label || 'Overall'}</div>
      </div>
    </div>
  </div>

  <div class="model-list">
    ${modelsHtml}
  </div>

  ${creditsHtml}
  ${historyHtml}
  ${cacheHtml}

  <div class="footer">
    <button class="link-btn" onclick="toggleInsights()">${this.showInsights ? 'Hide details' : 'Show details'}</button>
    <button class="refresh-btn" onclick="refresh()" title="Refresh">⟳</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    function toggleInsights() { vscode.postMessage({ command: 'toggleInsights' }); }
    function cleanCache() { vscode.postMessage({ command: 'cleanCache' }); }
    function manageCache() { vscode.postMessage({ command: 'manageCache' }); }
    function refresh() { vscode.postMessage({ command: 'refresh' }); }
  </script>
</body>
</html>`;
  }

  private getGaugeColor(percent: number): string {
    if (percent < 15) return '#f85149';
    if (percent < 30) return '#d29922';
    if (percent < 50) return '#58a6ff';
    return '#3fb950';
  }

  private renderModernModelRow(model: ModelWithInsights): string {
    const activeClass = model.insights.isActive ? 'active' : '';
    const pinnedClass = model.insights.isPinned ? 'pinned' : '';
    const percentClass = model.remainingPercent < 15 ? 'critical' :
      model.remainingPercent < 30 ? 'warning' : 'good';

    const meta = this.showInsights
      ? `Burn: ${model.insights.burnRateLabel} · ETA: ${model.insights.predictedExhaustionLabel || '—'}`
      : model.timeUntilReset || '';

    return `
      <div class="model-row ${activeClass} ${pinnedClass}">
        <div class="model-info">
          <span class="model-name">${model.label}</span>
          <span class="model-meta">${meta}</span>
        </div>
        <div class="model-stats">
          ${this.renderSparkline(model.insights.historyData)}
          <span class="model-percent ${percentClass}">${model.remainingPercent}%</span>
        </div>
      </div>
    `;
  }

  private renderSparkline(data: number[]): string {
    if (!data || data.length < 2) return '';

    const width = 50;
    const height = 20;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return `<svg class="sparkline" viewBox="0 0 ${width} ${height}"><polyline points="${points}"/></svg>`;
  }

  private renderModernCredits(snapshot: SnapshotWithInsights): string {
    if (!snapshot.promptCredits && !snapshot.flowCredits) return '';

    const config = vscode.workspace.getConfiguration('antigravity');
    const showFlow = config.get<boolean>('showFlowCredits', true);

    let html = '<div class="credits-section">';

    if (snapshot.promptCredits) {
      const p = snapshot.promptCredits;
      html += `
        <div class="credit-item">
          <div class="credit-value">${this.formatCredits(p.available)}</div>
          <div class="credit-label">Prompt Credits</div>
        </div>
      `;
    }

    if (showFlow && snapshot.flowCredits) {
      const f = snapshot.flowCredits;
      html += `
        <div class="credit-item">
          <div class="credit-value">${this.formatCredits(f.available)}</div>
          <div class="credit-label">Flow Credits</div>
        </div>
      `;
    }

    html += '</div>';
    return html;
  }

  private formatCredits(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  }

  private renderModernHistory(buckets: UsageBucket[]): string {
    if (!buckets || buckets.length < 2) return '';

    const maxUsage = Math.max(...buckets.map(b => b.items.reduce((sum, item) => sum + item.usage, 0)), 5);

    const barsHtml = buckets.map(bucket => {
      const totalUsage = bucket.items.reduce((sum, item) => sum + item.usage, 0);
      const heightPercent = Math.min((totalUsage / maxUsage) * 100, 100);
      return `<div class="chart-bar" style="height: ${Math.max(heightPercent, 4)}%;"></div>`;
    }).join('');

    return `
      <div class="section">
        <div class="section-title">24h Usage</div>
        <div class="chart-container">${barsHtml}</div>
      </div>
    `;
  }

  private renderModernCache(info: CacheInfo): string {
    const sizeMB = (info.totalSize / 1024 / 1024).toFixed(1);
    return `
      <div class="section">
        <div class="section-title">Cache</div>
        <div class="cache-grid">
          <div class="cache-stat">
            <div class="cache-value">${sizeMB} MB</div>
            <div class="cache-label">Total Size</div>
          </div>
          <div class="cache-stat">
            <div class="cache-value">${info.brainCount}</div>
            <div class="cache-label">Brain Tasks</div>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="manageCache()">Manage</button>
          <button class="btn btn-secondary" onclick="cleanCache()">Clean</button>
        </div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NATIVE MINIMAL THEME (Fallback)
  // ═══════════════════════════════════════════════════════════════════════════

  private getMinimalHtml(snapshot: SnapshotWithInsights, cacheInfo?: CacheInfo): string {
    const timestamp = snapshot.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const modelsHtml = snapshot.modelsWithInsights
      .map(model => this.renderMinimalModelRow(model))
      .join('');

    const creditsHtml = snapshot.promptCredits
      ? `<div style="font-size:12px;color:var(--vscode-descriptionForeground);padding:8px 0;border-top:1px solid var(--vscode-panel-border);">
          Credits: ${snapshot.promptCredits.available.toLocaleString()} / ${snapshot.promptCredits.monthly.toLocaleString()}
         </div>`
      : '';

    const cacheHtml = cacheInfo ? `
      <div style="font-size:12px;color:var(--vscode-descriptionForeground);padding:8px 0;border-top:1px solid var(--vscode-panel-border);">
        ${(cacheInfo.totalSize / 1024 / 1024).toFixed(1)} MB · ${cacheInfo.brainCount} tasks
        <button style="margin-left:8px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);border:none;padding:2px 6px;font-size:11px;cursor:pointer;" onclick="manageCache()">Manage</button>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      background: var(--vscode-editor-background);
      color: var(--vscode-editor-foreground);
      padding: 12px;
    }
    .header {
      display: flex; justify-content: space-between;
      margin-bottom: 8px; padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      font-size: 11px; color: var(--vscode-descriptionForeground);
    }
    .model { display: flex; justify-content: space-between; padding: 4px 0; }
    .model-name { font-size: 13px; }
    .model-name.active { font-weight: 600; }
    .model-percent { font-size: 13px; font-weight: 500; }
    .critical { color: var(--vscode-errorForeground); }
    .warning { color: var(--vscode-editorWarning-foreground); }
  </style>
</head>
<body>
  <div class="header">
    <span>Quota</span>
    <span>${timestamp}</span>
  </div>
  ${modelsHtml}
  ${creditsHtml}
  ${cacheHtml}
  <script>
    const vscode = acquireVsCodeApi();
    function manageCache() { vscode.postMessage({ command: 'manageCache' }); }
  </script>
</body>
</html>`;
  }

  private renderMinimalModelRow(model: ModelWithInsights): string {
    const activeClass = model.insights.isActive ? 'active' : '';
    const percentClass = model.remainingPercent < 15 ? 'critical' :
      model.remainingPercent < 30 ? 'warning' : '';
    const icon = model.remainingPercent < 15 ? '🔴' :
      model.remainingPercent < 30 ? '🟡' : '🟢';

    return `
      <div class="model">
        <span class="model-name ${activeClass}">${icon} ${model.label}</span>
        <span class="model-percent ${percentClass}">${model.remainingPercent}%</span>
      </div>
    `;
  }
}
