import type { JsonLdObject } from '@/data/structuredData';

/** Props for {@link JsonLd}. */
interface JsonLdProps {
  /** One Schema.org node, or a list rendered into a single script tag. */
  readonly data: JsonLdObject | readonly JsonLdObject[];
}

/**
 * Render Schema.org structured data as a JSON-LD script tag. The payload is
 * first-party (built from typed constants), and `<` is escaped so a stray string
 * can never break out of the script element.
 *
 * @param props - The Schema.org node(s) to serialize.
 * @returns A script element carrying the JSON-LD.
 * @example
 * <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
 */
export const JsonLd = ({ data }: JsonLdProps) => {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD needs a raw script body; the payload is first-party and the `<` escape prevents element break-out.
    <script dangerouslySetInnerHTML={{ __html: json }} type="application/ld+json" />
  );
};
