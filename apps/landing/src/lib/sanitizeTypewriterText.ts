/** Strip punctuation the typewriter should never emit. */
export function sanitizeTypewriterText(text: string): string {
  return text.replace(/[.,]/g, '');
}
