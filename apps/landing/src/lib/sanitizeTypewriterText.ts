/**
 * Strip punctuation the typewriter should never emit.
 *
 * @param text - Input value.
 * @returns The computed result.
 * @example
 * const result = sanitizeTypewriterText(text);
 */

export const sanitizeTypewriterText = (text: string): string => text.replace(/[.,]/g, '');
