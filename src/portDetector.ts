/**
 * Process Port Detector
 * Extracts ports and CSRF token from Antigravity language server process args.
 * Based on wusimpl/AntigravityQuotaWatcher implementation.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as https from 'https';

const execAsync = promisify(exec);

export interface PortDetectionResult {
  connectPort: number;
  extensionPort: number;
  csrfToken: string;
}

export class PortDetector {
  /**
   * Detect port and CSRF token from running Antigravity process
   */
  async detect(): Promise<PortDetectionResult | null> {
    try {
      console.log('[PortDetector] Starting detection...');

      // Use PowerShell to get process command line
      const command = `Get-CimInstance Win32_Process | Where-Object { $_.Name -like "*language_server*" } | Select-Object -ExpandProperty CommandLine`;
      console.log('[PortDetector] Running:', command);

      const { stdout } = await execAsync(command, {
        timeout: 15000,
        shell: 'powershell.exe'
      });

      console.log('[PortDetector] Output preview:', stdout.substring(0, 200));

      if (!stdout || stdout.trim().length === 0) {
        console.error('[PortDetector] No output from process detection');
        return null;
      }

      // Parse extension_server_port
      const portMatch = stdout.match(/--extension_server_port[=\s]+(\d+)/);
      const extensionPort = portMatch ? parseInt(portMatch[1], 10) : 0;

      // Parse csrf_token
      const csrfMatch = stdout.match(/--local_server_csrf_token[=\s]+([a-f0-9-]+)/i);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';

      if (!csrfToken) {
        console.error('[PortDetector] Could not extract CSRF token');
        return null;
      }

      console.log(`[PortDetector] Found extensionPort: ${extensionPort}`);
      console.log(`[PortDetector] Found csrfToken: ${csrfToken.substring(0, 8)}...`);

      // Find the working Connect port by testing
      const connectPort = await this.findWorkingPort(extensionPort, csrfToken);

      if (!connectPort) {
        console.error('[PortDetector] Could not find working Connect port');
        return null;
      }

      return { connectPort, extensionPort, csrfToken };

    } catch (error: any) {
      console.error('[PortDetector] Detection failed:', error.message);
      return null;
    }
  }

  /**
   * Find the working API port by testing nearby ports
   */
  private async findWorkingPort(basePort: number, csrfToken: string): Promise<number | null> {
    // Try different port offsets (common patterns observed)
    const portsToTry = [
      basePort,
      basePort + 1,
      basePort - 1,
      basePort + 2,
      basePort - 2
    ].filter(p => p > 0);

    for (const port of portsToTry) {
      console.log(`[PortDetector] Testing port ${port}...`);
      if (await this.testPort(port, csrfToken)) {
        console.log(`[PortDetector] Port ${port} is working!`);
        return port;
      }
    }

    return null;
  }

  /**
   * Test if a port responds to the API
   */
  private testPort(port: number, csrfToken: string): Promise<boolean> {
    return new Promise((resolve) => {
      const requestBody = JSON.stringify({});

      const options: https.RequestOptions = {
        hostname: '127.0.0.1',
        port: port,
        path: '/exa.language_server_pb.LanguageServerService/GetUserStatus',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
          'Connect-Protocol-Version': '1',
          'X-Codeium-Csrf-Token': csrfToken
        },
        rejectUnauthorized: false,
        timeout: 3000
      };

      const req = https.request(options, (res) => {
        console.log(`[PortDetector] Port ${port} responded with status ${res.statusCode}`);
        res.resume();
        resolve(res.statusCode === 200);
      });

      req.on('error', (err) => {
        console.log(`[PortDetector] Port ${port} error: ${err.message}`);
        resolve(false);
      });

      req.on('timeout', () => {
        console.log(`[PortDetector] Port ${port} timeout`);
        req.destroy();
        resolve(false);
      });

      req.write(requestBody);
      req.end();
    });
  }
}
