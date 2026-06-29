import type { JsonLdBlock } from '@vybekiit/seo';

/** Injects Schema.org JSON-LD for GEO/AEO crawlers — skill: add-blog */
export function VybeJsonLd({ data }: { data: JsonLdBlock | readonly JsonLdBlock[] }) {
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
}
