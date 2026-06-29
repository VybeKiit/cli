/** Build a stable CSS selector path for an element (dev-only Report Mode). */
export function getCssPath(element: Element): string {
  const segments: string[] = [];
  let current: Element | null = element;

  while (current && current.tagName.toLowerCase() !== 'html') {
    let segment = current.tagName.toLowerCase();
    if (current.id) {
      segment += `#${CSS.escape(current.id)}`;
      segments.unshift(segment);
      break;
    }
    const parent: Element | null = current.parentElement;
    if (parent) {
      const sameTag = Array.from(parent.children).filter(
        (child): child is Element => child instanceof Element && child.tagName === current?.tagName,
      );
      if (sameTag.length > 1) {
        const index = sameTag.indexOf(current) + 1;
        segment += `:nth-of-type(${index})`;
      }
    }
    segments.unshift(segment);
    current = parent;
  }

  return segments.join(' > ');
}

export function getAccessibleName(element: Element): string | undefined {
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const label = document.getElementById(labelledBy);
    if (label?.textContent?.trim()) {
      return label.textContent.trim();
    }
  }
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }
  const text = element.textContent?.trim();
  return text && text.length > 0 ? text.slice(0, 120) : undefined;
}

export function getVisibleText(element: Element): string | undefined {
  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  if (!text) {
    return;
  }
  return text.slice(0, 200);
}
