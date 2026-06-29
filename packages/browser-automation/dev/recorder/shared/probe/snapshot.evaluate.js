/** Browser-context DOM snapshot — plain JS so tsx does not inject __name into evaluate. */
export function extractPageSnapshot() {
  const labelFor = (el) => {
    const id = el.getAttribute('id');
    if (id) {
      const explicit = document.querySelector(`label[for="${CSS.escape(id)}"]`);
      if (explicit?.textContent) return explicit.textContent.trim().slice(0, 160) || null;
    }
    const parentLabel = el.closest('label');
    if (parentLabel?.textContent) {
      const clone = parentLabel.cloneNode(true);
      for (const nested of clone.querySelectorAll('input, textarea, select, button')) {
        nested.remove();
      }
      const text = clone.textContent?.trim().slice(0, 160);
      if (text) return text;
    }
    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const parts = labelledBy
        .split(/\s+/)
        .map((lid) => document.getElementById(lid)?.textContent?.trim())
        .filter(Boolean);
      if (parts.length > 0) return parts.join(' ').slice(0, 160);
    }
    return null;
  };

  const nearestHeading = (el) => {
    let node = el;
    for (let i = 0; i < 8 && node; i++) {
      const prev = node.previousElementSibling;
      if (prev?.matches('h1,h2,h3,h4,h5,h6')) return prev.textContent?.trim().slice(0, 120) ?? null;
      const inParent = node.parentElement?.querySelector(':scope > h1,:scope > h2,:scope > h3');
      if (inParent?.textContent) return inParent.textContent.trim().slice(0, 120);
      node = node.parentElement;
    }
    return null;
  };

  const origin = location.origin;
  const candidateSel =
    'input, textarea, select, button, a[href], [contenteditable="true"], [role="button"], [role="textbox"], [role="link"], [role="combobox"], [role="switch"], [role="checkbox"]';
  const out = [];

  for (const el of document.querySelectorAll(candidateSel)) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const visible =
      el.getAttribute('type') === 'file' ||
      (style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0);
    const tag = el.tagName.toLowerCase();

    out.push({
      tag,
      role: el.getAttribute('role'),
      ariaLabel: el.getAttribute('aria-label'),
      placeholder: el.getAttribute('placeholder'),
      associatedLabel: labelFor(el),
      textContent: (el.textContent ?? '').trim().slice(0, 160) || null,
      type: el.getAttribute('type'),
      href: tag === 'a' ? el.href : null,
      id: el.id || null,
      nearestHeading: nearestHeading(el),
      visible,
    });
  }

  const hrefSet = new Set();
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.href;
    try {
      const parsed = new URL(href);
      if (parsed.origin === origin) hrefSet.add(href);
    } catch {
      /* skip malformed */
    }
  }

  return {
    candidates: out.filter((c) => c.visible),
    hrefs: [...hrefSet],
  };
}
