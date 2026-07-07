import { PILLARS } from '@/data/pillars';

/**
 * The six messaging pillars — the agent-as-operator value props. Renders the
 * typed `PILLARS` data as a responsive grid; keyed by each pillar's stable `id`.
 */
export const Pillars = () => (
  <section id="pillars" className="border-t bg-muted/30">
    <div className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="font-bold text-3xl tracking-tight">Why it is different</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Every other kit sells code for a developer. VybeKiit is an agent that ships and maintains
        the product for someone who never reads the code.
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div key={pillar.id} className="flex flex-col gap-2">
            <h3 className="font-semibold text-lg">{pillar.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{pillar.body}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);
