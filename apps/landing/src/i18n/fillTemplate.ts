/**
 * Replace `{name}` placeholders in a visitor-facing template string.
 *
 * @param template - String with optional `{key}` tokens.
 * @param vars - Values to substitute.
 * @returns Filled string.
 * @example
 * fillTemplate('{count} screens', { count: 46 });
 */
export const fillTemplate = (
  template: string,
  vars: Readonly<Record<string, string | number>>,
): string => {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${key}}`, String(value));
  }
  return out;
};
