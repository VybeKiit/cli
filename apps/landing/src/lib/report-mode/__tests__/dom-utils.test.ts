// @vitest-environment jsdom

import { countElementsWithExactLabel, getShortestUniqueLabel } from '@/lib/report-mode/dom-utils';
import { beforeEach, describe, expect, it } from 'vitest';

describe('getShortestUniqueLabel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the shortest unique text when nested in a large section', () => {
    document.body.innerHTML = `
      <section class="testimonials-block">
        <p class="testimonials-tagline">Join founders shipping faster with VybeKiit</p>
        <p class="testimonials-subtagline">Build less Ship more</p>
      </section>
    `;

    const tagline = document.querySelector('.testimonials-tagline') as Element;
    expect(getShortestUniqueLabel(tagline)).toBe('Join founders shipping faster with VybeKiit');
  });

  it('prefers a shorter unique child label over parent blob', () => {
    document.body.innerHTML = `
      <div id="panel">
        <span id="target">Build less Ship more</span>
        <span>Other copy on page</span>
      </div>
    `;

    const target = document.getElementById('target') as Element;
    expect(getShortestUniqueLabel(target)).toBe('Build less Ship more');
  });

  it('uses aria-label when it is the shortest unique label', () => {
    document.body.innerHTML = `<button aria-label="Get VybeKiit Now"></button>`;
    const button = document.querySelector('button') as Element;
    expect(getShortestUniqueLabel(button)).toBe('Get VybeKiit Now');
  });

  it('falls back to tag name when no text exists', () => {
    document.body.innerHTML = `<div id="empty"></div>`;
    const empty = document.getElementById('empty') as Element;
    expect(getShortestUniqueLabel(empty)).toBe('div');
  });

  it('prefers clicked hero label over unrelated showcase heading', () => {
    document.body.innerHTML = `
      <section id="showcase">
        <h2>One bundle Every surface</h2>
      </section>
      <section class="hero-section">
        <p class="landing-label mb-8">AI OPERATOR + WEB MOBILE EXTENSION BUNDLE</p>
      </section>
    `;

    const label = document.querySelector('.landing-label') as Element;
    expect(getShortestUniqueLabel(label)).toBe('AI OPERATOR + WEB MOBILE EXTENSION BUNDLE');
  });
});

describe('countElementsWithExactLabel', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('ignores report-mode UI elements', () => {
    document.body.innerHTML = `
      <p>Unique label</p>
      <div data-report-mode-ui="true"><p>Unique label</p></div>
    `;
    expect(countElementsWithExactLabel('Unique label')).toBe(1);
  });
});
