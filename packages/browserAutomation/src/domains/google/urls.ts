const CONSOLE_ORIGIN = 'https://console.cloud.google.com';

/** Append `?project=<id>` to a Console path (encoded). */
function withProject(path: string, projectId: string): string {
  return `${CONSOLE_ORIGIN}${path}?project=${encodeURIComponent(projectId)}`;
}

/** OAuth consent screen ("Branding") for a project. */
export function consentUrl(projectId: string): string {
  return withProject('/auth/branding', projectId);
}

/** OAuth clients list for a project. */
export function clientsUrl(projectId: string): string {
  return withProject('/auth/clients', projectId);
}

/** "Create OAuth client" page for a project. */
export function createClientUrl(projectId: string): string {
  return withProject('/auth/clients/create', projectId);
}
