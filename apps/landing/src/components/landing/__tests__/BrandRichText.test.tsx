import { describe, expect, it } from 'vitest';

import { splitBrandText } from '@/components/landing/BrandRichText';

describe('splitBrandText', () => {
  it('injects logos for Claude Code, Cursor, and Codex without splitting Claude Code into Claude', () => {
    const segments = splitBrandText(
      'If you already use Claude Code, Cursor, Codex, Kiro, or a similar tool.',
    );

    expect(segments).toEqual([
      { kind: 'text', value: 'If you already use ' },
      { kind: 'brand', value: 'Claude Code', slug: 'claude' },
      { kind: 'text', value: ', ' },
      { kind: 'brand', value: 'Cursor', slug: 'cursor' },
      { kind: 'text', value: ', ' },
      { kind: 'brand', value: 'Codex', slug: 'codex' },
      { kind: 'text', value: ', ' },
      { kind: 'brand', value: 'Kiro', slug: 'kiro' },
      { kind: 'text', value: ', or a similar tool.' },
    ]);
  });

  it('glues "and" to the next brand with a non-breaking space so FAQ wrap stays level', () => {
    const segments = splitBrandText('Does it work with Claude Code, Cursor, Codex, and Kiro?');

    expect(segments).toEqual([
      { kind: 'text', value: 'Does it work with ' },
      { kind: 'brand', value: 'Claude Code', slug: 'claude' },
      { kind: 'text', value: ', ' },
      { kind: 'brand', value: 'Cursor', slug: 'cursor' },
      { kind: 'text', value: ', ' },
      { kind: 'brand', value: 'Codex', slug: 'codex' },
      { kind: 'text', value: ', and\u00A0' },
      { kind: 'brand', value: 'Kiro', slug: 'kiro' },
      { kind: 'text', value: '?' },
    ]);
  });

  it('matches Lemon Squeezy and GitHub in FAQ-style answers', () => {
    const segments = splitBrandText(
      'No, if you use the default Lemon Squeezy path. Requesting a refund revokes the GitHub access.',
    );

    expect(segments.filter((segment) => segment.kind === 'brand')).toEqual([
      { kind: 'brand', value: 'Lemon Squeezy', slug: 'lemonsqueezy' },
      { kind: 'brand', value: 'GitHub', slug: 'github' },
    ]);
  });

  it('does not match brand names as substrings of other words', () => {
    const segments = splitBrandText('Please export the project and reaction later.');
    expect(segments).toEqual([
      { kind: 'text', value: 'Please export the project and reaction later.' },
    ]);
  });
});
