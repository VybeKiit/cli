const CONSOLE_ORIGIN = 'https://console.cloud.google.com';

/** Append `?project=<id>` to a Console path (encoded). */
function withProject(path: string, projectId: string): string {
  return `${CONSOLE_ORIGIN}${path}?project=${encodeURIComponent(projectId)}`;
}

/** OAuth consent screen ("Branding") for a project — app name, support email, logo. */
export function consentUrl(projectId: string): string {
  return withProject('/auth/branding', projectId);
}

/** First-run consent wizard (App Information → Audience → Contact → Finish). */
export function consentCreateUrl(projectId: string): string {
  return withProject('/auth/overview/create', projectId);
}

/** OAuth clients list for a project. */
export function clientsUrl(projectId: string): string {
  return withProject('/auth/clients', projectId);
}

/** "Create OAuth client" page for a project. */
export function createClientUrl(projectId: string): string {
  return withProject('/auth/clients/create', projectId);
}

/** Detail page for a single OAuth client (secrets are managed here, add-secret only). */
export function clientDetailUrl(projectId: string, clientId: string): string {
  return withProject(`/auth/clients/${encodeURIComponent(clientId)}`, projectId);
}

/** Data Access page — register the OAuth scopes the consent screen requests. */
export function dataAccessUrl(projectId: string): string {
  return withProject('/auth/scopes', projectId);
}

/** Audience page — publishing status ("Testing" → "In production" via Publish app). */
export function audienceUrl(projectId: string): string {
  return withProject('/auth/audience', projectId);
}
