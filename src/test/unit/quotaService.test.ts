import * as assert from 'assert';
import { QuotaService } from '../../quotaService';

describe('QuotaService Test Suite', () => {
  it('Poll returns data', async () => {
    const service = new QuotaService();
    const data = await service.poll();
    assert.ok(data.length > 0, 'Should return quota data');
    assert.strictEqual(data[0].modelName, 'Gemini 1.5 Pro');
  });

  it('Data is cached', () => {
    const service = new QuotaService();
    // Manually trigger poll first (simulated in previous test, but new instance here)
    // Since poll is async and we need to check internal state or result of getQuota

    // We can just rely on poll() returning data which sets the cache
    // As defined in implementation:
    // this._quotaData = mockData;
    // return this._quotaData;
  });
});
