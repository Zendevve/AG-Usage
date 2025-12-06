/**
 * Quota Service
 * Fetches quota data from Antigravity API using proper headers and authentication.
 * Based on wusimpl/AntigravityQuotaWatcher implementation.
 */

import * as https from 'https';
import * as vscode from 'vscode';

export interface ModelQuota {
  modelName: string;
  usagePercent: number;
  resetTime?: string;
  isPinned: boolean;
}

export interface QuotaData {
  quotas: ModelQuota[];
  promptCredits?: {
    used: number;
    total: number;
  };
}

export class QuotaService {
  private _quotaData: ModelQuota[] = [];
  private _connectPort: number | undefined;
  private _csrfToken: string | undefined;

  constructor() { }

  public setConnection(port: number, csrfToken: string) {
    this._connectPort = port;
    this._csrfToken = csrfToken;
    console.log(`[QuotaService] Connection set: port=${port}, token=${csrfToken.substring(0, 8)}...`);
  }

  public async poll(): Promise<ModelQuota[]> {
    if (!this._connectPort || !this._csrfToken) {
      console.warn('[QuotaService] Missing port or CSRF token, using mock data');
      return this.getMockData();
    }

    try {
      console.log(`[QuotaService] Fetching quota from port ${this._connectPort}...`);
      const response = await this.makeRequest();

      console.log('[QuotaService] Response received:', JSON.stringify(response).substring(0, 500));
      vscode.window.showInformationMessage('Quota data received! Check logs for details.');

      // Parse the response
      const quotas = this.parseResponse(response);
      this._quotaData = quotas;
      return quotas;

    } catch (error: any) {
      console.error('[QuotaService] API Call Failed:', error.message);
      vscode.window.showErrorMessage(`API Failed: ${error.message}`);
      return this.getMockData();
    }
  }

  private makeRequest(): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestBody = JSON.stringify({});

      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: this._connectPort,
        path: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'Connect-Protocol-Version': '1',
          'X-Codeium-Csrf-Token': this._csrfToken
        },
        rejectUnauthorized: false,
        timeout: 10000
      };

      console.log(`[QuotaService] Request: https://127.0.0.1:${this._connectPort}${options.path}`);

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error: ${data.substring(0, 100)}`));
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.write(requestBody);
      req.end();
    });
  }

  private parseResponse(response: any): ModelQuota[] {
    // Try to extract quota info from the response
    // Structure may vary, so we handle multiple possible formats
    const quotas: ModelQuota[] = [];

    try {
      // Check for promptCreditsInfo
      if (response.promptCreditsInfo) {
        const credits = response.promptCreditsInfo;
        const used = parseInt(credits.used || '0', 10);
        const total = parseInt(credits.total || '1', 10);
        const percent = total > 0 ? Math.round((used / total) * 100) : 0;

        quotas.push({
          modelName: 'Prompt Credits',
          usagePercent: percent,
          isPinned: true
        });
      }

      // Check for modelQuotaInfo array
      if (response.modelQuotaInfo && Array.isArray(response.modelQuotaInfo)) {
        for (const model of response.modelQuotaInfo) {
          const name = model.modelName || model.modelId || 'Unknown Model';
          const used = parseInt(model.used || '0', 10);
          const total = parseInt(model.total || model.limit || '1', 10);
          const percent = total > 0 ? Math.round((used / total) * 100) : 0;

          quotas.push({
            modelName: name,
            usagePercent: percent,
            isPinned: false
          });
        }
      }

      // If we got quotas, return them
      if (quotas.length > 0) {
        return quotas;
      }

      // Fallback: log the full response for debugging
      console.log('[QuotaService] Response structure:', Object.keys(response));
      vscode.window.showInformationMessage(`Response keys: ${Object.keys(response).join(', ')}`);

    } catch (e) {
      console.error('[QuotaService] Parse error:', e);
    }

    return this.getMockData();
  }

  public getQuota(): ModelQuota[] {
    return this._quotaData;
  }

  private getMockData(): ModelQuota[] {
    this._quotaData = [
      { modelName: 'Gemini 1.5 Pro', usagePercent: 15, isPinned: true },
      { modelName: 'Claude 3.5 Sonnet', usagePercent: 85, isPinned: false },
      { modelName: 'GPT-4o', usagePercent: 45, isPinned: false }
    ];
    return this._quotaData;
  }
}
