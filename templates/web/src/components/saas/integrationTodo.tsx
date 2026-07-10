/**
 * Callout listing the provider seams still open on a ready SaaS surface.
 *
 * @param props - Feature label and TODO lines the agent should wire.
 * @returns A collapsible integration contract panel.
 * @example
 * <IntegrationTodo feature="settings" todos={['PATCH /api/settings']} />
 */
export const IntegrationTodo = ({
  feature,
  todos,
}: {
  readonly feature: string;
  readonly todos: readonly string[];
}) => (
  <details className="mt-8 rounded-lg border bg-card p-4 text-sm">
    <summary className="cursor-pointer font-medium">
      Plug {feature} into your app (agent wiring)
    </summary>
    <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
      {todos.map((todo) => (
        <li key={todo}>{todo}</li>
      ))}
    </ul>
  </details>
);
