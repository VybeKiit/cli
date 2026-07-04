import {
  htmlContainsWhitelistedIp,
  scrapeNamecheapApiKey,
  scrapeNamecheapApiUser,
} from '@vybekiit/browserAutomation/domains/registrars/namecheap/scrape';
import { describe, expect, it } from 'vitest';

describe('namecheap scrape', () => {
  it('parses api key from labeled html', () => {
    const html =
      '<div>API Key</div><input name="ApiKey" value="a1b2c3d4e5f6789012345678901234ab" />';
    expect(scrapeNamecheapApiKey(html)).toBe('a1b2c3d4e5f6789012345678901234ab');
  });

  it('parses api user from input', () => {
    const html = '<input name="ApiUser" value="MyUser" />';
    expect(scrapeNamecheapApiUser(html)).toBe('myuser');
  });

  it('detects whitelisted ip', () => {
    expect(htmlContainsWhitelistedIp('allowed: 203.0.113.10', '203.0.113.10')).toBe(true);
  });
});
