const CONSOLE_ORIGIN = 'https://console.cloud.google.com';

/** Append `?project=<id>` to a Console path (encoded). */
const withProject = (path: string, projectId: string): string =>
  `${CONSOLE_ORIGIN}${path}?project=${encodeURIComponent(projectId)}`;

/**
 * OAuth consent screen ("Branding") for a project — app name, support email, logo.
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = consentUrl('project-id');
 */
export const consentUrl = (projectId: string): string => withProject('/auth/branding', projectId);

/**
 * First-run consent wizard (App Information → Audience → Contact → Finish).
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = consentCreateUrl('project-id');
 */
export const consentCreateUrl = (projectId: string): string =>
  withProject('/auth/overview/create', projectId);

/**
 * OAuth clients list for a project.
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = clientsUrl('project-id');
 */
export const clientsUrl = (projectId: string): string => withProject('/auth/clients', projectId);

/**
 * "Create OAuth client" page for a project.
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = createClientUrl('project-id');
 */
export const createClientUrl = (projectId: string): string =>
  withProject('/auth/clients/create', projectId);

/**
 * Detail page for a single OAuth client (secrets are managed here, add-secret only).
 *
 * @param projectId - Provider project id to inspect.
 * @param clientId - Provider client id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = clientDetailUrl('project-id', 'client-id');
 */
export const clientDetailUrl = (projectId: string, clientId: string): string =>
  withProject(`/auth/clients/${encodeURIComponent(clientId)}`, projectId);

/**
 * Data Access page — register the OAuth scopes the consent screen requests.
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = dataAccessUrl('project-id');
 */
export const dataAccessUrl = (projectId: string): string => withProject('/auth/scopes', projectId);

/**
 * Audience page — publishing status ("Testing" → "In production" via Publish app).
 *
 * @param projectId - Provider project id to inspect.
 * @returns Computed value for downstream automation.
 * @example
 * const result = audienceUrl('project-id');
 */
export const audienceUrl = (projectId: string): string => withProject('/auth/audience', projectId);
