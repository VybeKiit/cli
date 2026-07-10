'use client';

import { Badge } from '@vybekiit/ui/badge';
import { Button } from '@vybekiit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@vybekiit/ui/card';
import { Input } from '@vybekiit/ui/input';
import { Label } from '@vybekiit/ui/label';
import { Textarea } from '@vybekiit/ui/textarea';
import { Check, Lightbulb, Plus, Save, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useId, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { DemoThemeRandomizer } from './shared/DemoThemeRandomizer';
import { DemoTransitionStage } from './shared/DemoTransitionStage';

/** One suggested data entity derived from the idea. */
type Entity = {
  readonly id: string;
  readonly name: string;
  readonly approved: boolean;
};

const SUGGESTED_FROM_IDEA: readonly string[] = [
  'Customers',
  'Orders',
  'Messages',
  'Subscriptions',
  'Team seats',
];

const DEFAULT_IDEA = 'I want to help customers book, pay, and manage their work in one place.';

/**
 * Interactive idea planner: edit notes, add/approve/remove entities, save plan.
 *
 * @returns The idea planner recipe element.
 * @example
 * const element = <IdeaPlannerPage />;
 */
export const IdeaPlannerPage = () => {
  // TODO: Save idea notes to the configured app data store.
  // TODO: Turn approved entities into the active database schema plan.
  const ideaId = useId();
  const entityId = useId();
  const entityErrorId = useId();

  const [idea, setIdea] = useState(DEFAULT_IDEA);
  const [entities, setEntities] = useState<readonly Entity[]>(
    SUGGESTED_FROM_IDEA.slice(0, 3).map((name, index) => ({
      id: `ent_${index + 1}`,
      name,
      approved: index < 2,
    })),
  );
  const [newEntity, setNewEntity] = useState('');
  const [touched, setTouched] = useState(false);
  const [savedIdea, setSavedIdea] = useState(DEFAULT_IDEA);
  const [notice, setNotice] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'draft'>('all');

  const ideaDirty = idea.trim() !== savedIdea.trim();
  const entityValid = newEntity.trim().length >= 2;
  const approvedCount = entities.filter((entity) => entity.approved).length;

  const visible = useMemo(() => {
    if (filter === 'approved') {
      return entities.filter((entity) => entity.approved);
    }
    if (filter === 'draft') {
      return entities.filter((entity) => !entity.approved);
    }
    return entities;
  }, [entities, filter]);

  const suggestMore = () => {
    const missing = SUGGESTED_FROM_IDEA.filter(
      (name) => !entities.some((entity) => entity.name === name),
    );
    if (missing.length === 0) {
      setNotice('All suggestions are already on the list.');
      return;
    }
    const name = missing[0];
    if (!name) {
      return;
    }
    setEntities((current) => [...current, { id: `ent_${Date.now()}`, name, approved: false }]);
    setNotice(`Suggested “${name}”.`);
  };

  const addEntity = (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!entityValid) {
      return;
    }
    const name = newEntity.trim();
    if (entities.some((entity) => entity.name.toLowerCase() === name.toLowerCase())) {
      setNotice('That entity is already listed.');
      return;
    }
    setEntities((current) => [...current, { id: `ent_${Date.now()}`, name, approved: false }]);
    setNewEntity('');
    setTouched(false);
    setNotice(`Added “${name}”.`);
  };

  const toggleApproved = (id: string) => {
    setEntities((current) =>
      current.map((entity) =>
        entity.id === id ? { ...entity, approved: !entity.approved } : entity,
      ),
    );
  };

  const removeEntity = (id: string) => {
    setEntities((current) => current.filter((entity) => entity.id !== id));
    setNotice('Entity removed.');
  };

  const savePlan = () => {
    setSavedIdea(idea.trim());
    setNotice(
      `Saved plan with ${approvedCount} approved entit${approvedCount === 1 ? 'y' : 'ies'}.`,
    );
  };

  return (
    <Frame>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 space-y-1">
          <Badge className="w-fit" variant="secondary">
            Planning
          </Badge>
          <h1 className="font-bold text-3xl tracking-tight md:text-4xl">Plan your app idea</h1>
          <p className="max-w-xl text-muted-foreground">
            Capture the idea, approve first data entities, and save a schema-ready plan.
          </p>
        </div>

        <p aria-live="polite" className="sr-only">
          {notice ?? ''}
        </p>

        <div className="mb-4 grid grid-cols-3 gap-3">
          <Kpi label="Entities" value={entities.length} />
          <Kpi label="Approved" value={approvedCount} />
          <Kpi label="Idea" value={ideaDirty ? 0 : 1} />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lightbulb aria-hidden="true" className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-base">Idea notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor={ideaId}>What are you building?</Label>
                <Textarea
                  className="min-h-40"
                  id={ideaId}
                  onChange={(event) => setIdea(event.target.value)}
                  value={idea}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={!ideaDirty && approvedCount === 0}
                  onClick={savePlan}
                  type="button"
                >
                  <Save aria-hidden="true" className="h-4 w-4" /> Save plan
                </Button>
                <Button onClick={suggestMore} type="button" variant="outline">
                  <Plus aria-hidden="true" className="h-4 w-4" /> Suggest entity
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Suggested data</CardTitle>
              <div className="mt-2 flex flex-wrap gap-1">
                {(['all', 'approved', 'draft'] as const).map((value) => (
                  <button
                    aria-pressed={filter === value}
                    className={cn(
                      'rounded-md border px-2 py-1 font-medium text-xs capitalize transition-colors',
                      filter === value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                    key={value}
                    onClick={() => setFilter(value)}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <form className="flex gap-2" noValidate={true} onSubmit={addEntity}>
                <div className="min-w-0 flex-1 space-y-1">
                  <Label className="sr-only" htmlFor={entityId}>
                    Entity name
                  </Label>
                  <Input
                    aria-describedby={touched && !entityValid ? entityErrorId : undefined}
                    aria-invalid={touched && !entityValid}
                    id={entityId}
                    onChange={(event) => setNewEntity(event.target.value)}
                    placeholder="Add entity…"
                    value={newEntity}
                  />
                  {touched && !entityValid ? (
                    <p className="text-destructive text-xs" id={entityErrorId}>
                      Enter at least 2 characters.
                    </p>
                  ) : null}
                </div>
                <Button size="icon" type="submit" variant="secondary">
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  <span className="sr-only">Add entity</span>
                </Button>
              </form>

              {visible.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <Lightbulb aria-hidden="true" className="h-7 w-7 text-muted-foreground" />
                  <p className="mt-2 font-medium text-sm">No entities here</p>
                  <p className="mt-1 text-muted-foreground text-xs">Add one above or show all.</p>
                </div>
              ) : (
                <ul aria-label="Data entities" className="space-y-2">
                  {visible.map((entity) => (
                    <li
                      className="flex items-center gap-2 rounded-lg border px-3 py-2"
                      key={entity.id}
                    >
                      <button
                        aria-label={
                          entity.approved ? `Unapprove ${entity.name}` : `Approve ${entity.name}`
                        }
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-md border',
                          entity.approved
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600'
                            : 'text-muted-foreground',
                        )}
                        onClick={() => toggleApproved(entity.id)}
                        type="button"
                      >
                        <Check aria-hidden="true" className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-0 flex-1 truncate text-sm">{entity.name}</span>
                      {entity.approved ? (
                        <Badge className="font-normal" variant="secondary">
                          Approved
                        </Badge>
                      ) : null}
                      <Button
                        aria-label={`Remove ${entity.name}`}
                        onClick={() => removeEntity(entity.id)}
                        size="icon"
                        type="button"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
          <summary className="cursor-pointer font-medium">Plug this into your app</summary>
          <div className="mt-3 space-y-2 text-muted-foreground">
            <p>
              Fully interactive with local state — approve, add, filter, and save recompute the
              plan. To make it real:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Save idea notes to the configured app data store (<code>POST /api/plans</code> or
                equivalent).
              </li>
              <li>
                On Save, turn approved entities into the active database schema plan (preset
                suggestions or migration draft).
              </li>
              <li>
                Keep the empty filter state when every entity is removed so the builder can start
                over.
              </li>
            </ol>
          </div>
        </details>
      </main>
    </Frame>
  );
};

/** Gallery theme + motion wrapper. */
const Frame = ({ children }: { readonly children: ReactNode }) => (
  <DemoThemeRandomizer>
    <DemoTransitionStage defaultTransition="fade" title="Idea planner motion pass">
      <div className="min-h-screen bg-background text-foreground">{children}</div>
    </DemoTransitionStage>
  </DemoThemeRandomizer>
);

const Kpi = ({ label, value }: { readonly label: string; readonly value: number }) => (
  <Card>
    <CardContent className="p-3 text-center">
      <p className="font-semibold text-2xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </CardContent>
  </Card>
);
