import {
  scrapeGodaddyKeyPair,
  scrapeGodaddyKeysFromList,
} from '@vybekiit/browser-automation/domains/registrars/godaddy/scrape';
import { describe, expect, it } from 'vitest';

describe('godaddy scrape', () => {
  it('parses key and secret from reveal dialog html', () => {
    const html = `
      <div role="dialog">
        <label>API Key</label>
        <input name="apiKey" value="abcDEF1234567890keyxx" readonly />
        <label>Secret</label>
        <input name="apiSecret" value="secRET9876543210secretxx" readonly />
      </div>
    `;
    expect(scrapeGodaddyKeyPair(html)).toEqual({
      apiKey: 'abcDEF1234567890keyxx',
      apiSecret: 'secRET9876543210secretxx',
    });
  });

  it('parses existing keys from keys list html', () => {
    const html = `
      <table>
        <tr><td>VybeKiit</td><td><code>abcDEF1234567890keyxx</code></td></tr>
      </table>
    `;
    expect(scrapeGodaddyKeysFromList(html)).toContain('abcDEF1234567890keyxx');
  });
});
