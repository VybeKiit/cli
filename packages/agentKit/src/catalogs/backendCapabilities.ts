/**
 * Express backend scaffold capabilities the agent can append via CLI + skills.
 */

export type BackendCapability = {
  readonly id: string;
  readonly description: string;
  readonly cliCommand: string;
  readonly skill: string;
};

/** Built-in backend features shipped in the template. */
export const BACKEND_CAPABILITIES: readonly BackendCapability[] = [
  {
    id: 'health',
    description: 'Health check endpoint at /health',
    cliCommand: '',
    skill: 'doctor',
  },
  {
    id: 'session-auth',
    description: 'Cookie sessions with @vybekiit/auth',
    cliCommand: '',
    skill: 'wire-auth',
  },
  {
    id: 'rate-limit',
    description: 'Global rate limiting middleware',
    cliCommand: '',
    skill: 'harden',
  },
  {
    id: 'file-upload',
    description: 'Multer upload with size and type limits',
    cliCommand: 'vybekiit backend add-upload',
    skill: 'add-upload',
  },
  {
    id: 'route',
    description: 'Add a custom route + controller',
    cliCommand: 'vybekiit backend add-route <name>',
    skill: 'add-route',
  },
  {
    id: 'crud',
    description: 'Scaffold CRUD routes for a resource',
    cliCommand: 'vybekiit backend add-crud <resource>',
    skill: 'add-crud',
  },
];

/** CLI commands agents invoke for backend scaffolding. */
export const BACKEND_CLI_COMMANDS = {
  scaffold: 'vybekiit scaffold backend',
  addRoute: 'vybekiit backend add-route',
  addCrud: 'vybekiit backend add-crud',
  addUpload: 'vybekiit backend add-upload',
} as const;
