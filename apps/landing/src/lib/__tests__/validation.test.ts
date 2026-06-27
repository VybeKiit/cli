import { isValidEmail, isValidGithubUsername } from '@/lib/validation';

describe('isValidGithubUsername', () => {
  it('accepts plain alphanumeric names', () => {
    expect(isValidGithubUsername('octocat')).toBe(true);
    expect(isValidGithubUsername('User123')).toBe(true);
  });

  it('accepts single hyphens between alphanumerics', () => {
    expect(isValidGithubUsername('a-b-c')).toBe(true);
  });

  it('accepts the 39-character maximum', () => {
    expect(isValidGithubUsername('a'.repeat(39))).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidGithubUsername('')).toBe(false);
  });

  it('rejects names longer than 39 characters', () => {
    expect(isValidGithubUsername('a'.repeat(40))).toBe(false);
  });

  it('rejects leading and trailing hyphens', () => {
    expect(isValidGithubUsername('-octocat')).toBe(false);
    expect(isValidGithubUsername('octocat-')).toBe(false);
  });

  it('rejects consecutive hyphens', () => {
    expect(isValidGithubUsername('oct--cat')).toBe(false);
  });

  it('rejects disallowed characters', () => {
    expect(isValidGithubUsername('oct cat')).toBe(false);
    expect(isValidGithubUsername('oct_cat')).toBe(false);
    expect(isValidGithubUsername('oct.cat')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    expect(isValidEmail('you@example.com')).toBe(true);
    expect(isValidEmail('a.b+tag@sub.example.co')).toBe(true);
  });

  it('rejects missing parts and whitespace', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('you@example')).toBe(false);
    expect(isValidEmail('you example.com')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
  });
});
