import type { JsonLdBlock } from '@vybekiit/content';

interface VybeJsonLdProps {
  readonly data: JsonLdBlock | readonly JsonLdBlock[];
}

/**
 * Inject Schema.org JSON-LD for GEO/AEO crawlers.
 *
 * @param props - One JSON-LD block or a readonly list of blocks.
 * @returns Inline JSON-LD script elements.
 * @example
 * <VybeJsonLd data={jsonLd} />
 */
const VybeJsonLd = ({ data }: VybeJsonLdProps) => {
  const blocks = Array.isArray(data) ? data : [data];
  return (
    <>
      {blocks.map((block) => {
        const serialized = JSON.stringify(block);
        return (
          <script
            key={serialized}
            type="application/ld+json"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires inline Schema.org script tags
            dangerouslySetInnerHTML={{ __html: serialized }}
          />
        );
      })}
    </>
  );
};

export { VybeJsonLd };
