import { FAQ } from '@/data/faq';

/**
 * FAQ — the GEO/AEO question targets, rendered answer-first so AI answer engines
 * can quote the lead. Uses native `<details>`/`<summary>` for zero-JS, keyboard-
 * accessible disclosure. Each question is a verbatim search query (an H3 inside the
 * summary) so the structure stays semantic and citation-friendly.
 */
export function Faq() {
  return (
    <section id="faq" className="border-t">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-bold text-3xl tracking-tight">Questions, answered</h2>
        <div className="mt-10 flex flex-col divide-y">
          {FAQ.map((item) => (
            <details key={item.id} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                <h3 className="font-medium">{item.question}</h3>
                <span
                  aria-hidden
                  className="text-muted-foreground transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
