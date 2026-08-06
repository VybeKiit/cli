import { execFile } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { caughtMessage } from '@vybekiit/core';
import { scaffold } from '../lib/scaffold';
import { cloneMirror, locateTemplateSource } from '../lib/templateSource';

// Split "-", "_", "/": "add-user" -> ["add", "user"].
const PASCAL_SPLIT_PATTERN = /[-_/]/;

// Collapse whitespace: "My  Route" -> "My-Route".
const WHITESPACE_PATTERN = /\s+/g;

// Drop slug-unsafe chars: "my-route!" -> "my-route".
const SLUG_UNSAFE_PATTERN = /[^a-z0-9-]/g;

/**
 * Convert a route/resource name into PascalCase.
 *
 * @param name - Route or resource name from CLI input.
 * @returns PascalCase identifier segment.
 */
const pascalCase = (name: string): string =>
  name
    .split(PASCAL_SPLIT_PATTERN)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

/**
 * Convert a route/resource name into a URL-safe kebab slug.
 *
 * @param name - Route or resource name from CLI input.
 * @returns Lowercase route slug.
 */
const kebabCase = (name: string): string =>
  name.trim().toLowerCase().replace(WHITESPACE_PATTERN, '-').replace(SLUG_UNSAFE_PATTERN, '');

/**
 * Check whether a scaffolded backend app exists.
 *
 * @param cwd - Project directory to inspect.
 * @returns True when `backend/src/app.ts` exists.
 * @example
 * const exists = await ensureBackendDir(process.cwd());
 */
const ensureBackendDir = async (cwd: string): Promise<boolean> => {
  try {
    await access(join(cwd, 'backend', 'src', 'app.ts'));
    return true;
  } catch {
    return false;
  }
};

/**
 * Scaffold the backend template into the current project.
 *
 * @param args - CLI arguments after `scaffold backend`; first item may be the destination folder.
 * @param cwd - Project directory where the backend should be created.
 * @returns Plain message plus the process exit code.
 */
export const runScaffoldBackend = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> => {
  const [destArg] = args;
  const destName = destArg === undefined || destArg === '' ? 'backend' : destArg;
  const dest = join(cwd, destName);

  try {
    await access(dest);
    return { message: `${destName}/ already exists.`, exitCode: 1 };
  } catch {
    // ok — does not exist
  }

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await locateTemplateSource('backend', {
      clone: cloneMirror,
      exists: async (path) => {
        try {
          await access(path);
          return true;
        } catch {
          return false;
        }
      },
    });
    const { cleanup: resolvedCleanup, source } = resolved;
    cleanup = resolvedCleanup;

    await scaffold({
      template: 'backend',
      source,
      dest,
    });

    return { message: `Scaffolded ${destName}/. Your API server is ready.`, exitCode: 0 };
  } catch (error) {
    return {
      message: caughtMessage(error, 'Scaffold failed.'),
      exitCode: 1,
    };
  } finally {
    if (cleanup !== undefined) {
      await cleanup();
    }
  }
};

/**
 * Add a simple GET route and controller to a scaffolded backend.
 *
 * @param args - CLI arguments after `backend add-route`; first item is the route name.
 * @param cwd - Project directory containing the backend.
 * @returns Plain message plus the process exit code.
 */
export const runBackendAddRoute = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> => {
  const [name] = args;
  if (name === undefined || name === '') {
    return { message: 'Pass a route name: vybekiit backend add-route users', exitCode: 1 };
  }

  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  const slug = kebabCase(name);
  const pascal = pascalCase(slug);
  const backendRoot = join(cwd, 'backend');

  const controllerPath = join(backendRoot, 'src/controllers', `${slug}.controller.ts`);
  const routePath = join(backendRoot, 'src/routes', `${slug}.routes.ts`);

  await mkdir(join(backendRoot, 'src/controllers'), { recursive: true });
  await mkdir(join(backendRoot, 'src/routes'), { recursive: true });

  const controller = `import type { Request, Response } from 'express';

export const get${pascal} = (_req: Request, res: Response): void => {
  res.json({ ok: true, resource: '${slug}' });
};
`;

  const route = `import { Router } from 'express';
import { get${pascal} } from '../controllers/${slug}.controller.js';

export const ${slug}Router = Router();

${slug}Router.get('/', get${pascal});
`;

  await writeFile(controllerPath, controller, 'utf8');
  await writeFile(routePath, route, 'utf8');

  const appPath = join(backendRoot, 'src/app.ts');
  let appSource = await readFile(appPath, 'utf8');
  const importLine = `import { ${slug}Router } from './routes/${slug}.routes.js';`;
  const mountLine = `app.use('/api/${slug}', ${slug}Router);`;

  if (!appSource.includes(importLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-import',
      `${importLine}\n// vybekiit:routes-import`,
    );
  }
  if (!appSource.includes(mountLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-mount',
      `${mountLine}\n// vybekiit:routes-mount`,
    );
  }
  await writeFile(appPath, appSource, 'utf8');

  return {
    message: `Added GET /api/${slug} with controller and route files.`,
    exitCode: 0,
  };
};

/**
 * Add CRUD routes and a controller to a scaffolded backend.
 *
 * @param args - CLI arguments after `backend add-crud`; first item is the resource name.
 * @param cwd - Project directory containing the backend.
 * @returns Plain message plus the process exit code.
 */
export const runBackendAddCrud = async (
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> => {
  const [name] = args;
  if (name === undefined || name === '') {
    return { message: 'Pass a resource name: vybekiit backend add-crud posts', exitCode: 1 };
  }

  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  const slug = kebabCase(name);
  const pascal = pascalCase(slug);
  const backendRoot = join(cwd, 'backend');

  const controllerPath = join(backendRoot, 'src/controllers', `${slug}.controller.ts`);
  const routePath = join(backendRoot, 'src/routes', `${slug}.routes.ts`);

  await mkdir(join(backendRoot, 'src/controllers'), { recursive: true });
  await mkdir(join(backendRoot, 'src/routes'), { recursive: true });

  const controller = `import type { Request, Response } from 'express';

type StoreItem = { readonly id: string } & Record<string, unknown>;

const store: StoreItem[] = [];

export const list${pascal} = (_req: Request, res: Response): void => {
  res.json({ items: store });
};

export const get${pascal} = (req: Request, res: Response): void => {
  const item = store.find((row) => row.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  res.json(item);
};

export const create${pascal} = (req: Request, res: Response): void => {
  const item: StoreItem = { id: crypto.randomUUID(), ...req.body };
  store.push(item);
  res.status(201).json(item);
};

export const update${pascal} = (req: Request, res: Response): void => {
  const idx = store.findIndex((row) => row.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  const updated: StoreItem = { ...store[idx], ...req.body, id: req.params.id };
  store[idx] = updated;
  res.json(updated);
};

export const delete${pascal} = (req: Request, res: Response): void => {
  const idx = store.findIndex((row) => row.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  store.splice(idx, 1);
  res.status(204).send();
};
`;

  const route = `import { Router } from 'express';
import {
  create${pascal},
  delete${pascal},
  get${pascal},
  list${pascal},
  update${pascal},
} from '../controllers/${slug}.controller.js';

export const ${slug}Router = Router();

${slug}Router.get('/', list${pascal});
${slug}Router.get('/:id', get${pascal});
${slug}Router.post('/', create${pascal});
${slug}Router.patch('/:id', update${pascal});
${slug}Router.delete('/:id', delete${pascal});
`;

  await writeFile(controllerPath, controller, 'utf8');
  await writeFile(routePath, route, 'utf8');

  const appPath = join(backendRoot, 'src/app.ts');
  let appSource = await readFile(appPath, 'utf8');
  const importLine = `import { ${slug}Router } from './routes/${slug}.routes.js';`;
  const mountLine = `app.use('/api/${slug}', ${slug}Router);`;

  if (!appSource.includes(importLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-import',
      `${importLine}\n// vybekiit:routes-import`,
    );
  }
  if (!appSource.includes(mountLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-mount',
      `${mountLine}\n// vybekiit:routes-mount`,
    );
  }
  await writeFile(appPath, appSource, 'utf8');

  return {
    message: `Added CRUD /api/${slug} with in-memory store (swap for @vybekiit/db when ready).`,
    exitCode: 0,
  };
};

/**
 * Add an upload route to a scaffolded backend.
 *
 * @param cwd - Project directory containing the backend.
 * @returns Plain message plus the process exit code.
 */
export const runBackendAddUpload = async (
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> => {
  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  const backendRoot = join(cwd, 'backend');
  const routePath = join(backendRoot, 'src/routes/upload.routes.ts');

  const route = `import { Router } from 'express';
import { uploadSingle } from '../middleware/upload.js';
import { uploadFile } from '../controllers/upload.controller.js';

export const uploadRouter = Router();

uploadRouter.post('/', uploadSingle, uploadFile);
`;

  await writeFile(routePath, route, 'utf8');

  const appPath = join(backendRoot, 'src/app.ts');
  let appSource = await readFile(appPath, 'utf8');
  const importLine = `import { uploadRouter } from './routes/upload.routes.js';`;
  const mountLine = `app.use('/api/upload', uploadRouter);`;

  if (!appSource.includes(importLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-import',
      `${importLine}\n// vybekiit:routes-import`,
    );
  }
  if (!appSource.includes(mountLine)) {
    appSource = appSource.replace(
      '// vybekiit:routes-mount',
      `${mountLine}\n// vybekiit:routes-mount`,
    );
  }
  await writeFile(appPath, appSource, 'utf8');

  return { message: 'Added POST /api/upload with multer limits.', exitCode: 0 };
};

const execFileAsync = promisify(execFile);

/** Runs a package script in a directory; injectable so tests never spawn a process. */
export type CommandRunner = (
  command: string,
  args: readonly string[],
  cwd: string,
) => Promise<void>;

const defaultRunner: CommandRunner = async (command, args, cwd) => {
  await execFileAsync(command, [...args], { cwd });
};

/**
 * Generate the backend's OpenAPI document (ADR-0043) by running its `gen:contract`
 * script, which derives the spec from the route registry in `backend/src/contract.ts`.
 *
 * @param cwd - Project directory containing the backend.
 * @param runner - Command runner; defaults to spawning the script, injected in tests.
 * @returns Plain message plus the process exit code.
 */
export const runBackendGenContract = async (
  cwd: string = process.cwd(),
  runner: CommandRunner = defaultRunner,
): Promise<{ readonly message: string; readonly exitCode: number }> => {
  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  try {
    await runner('npm', ['run', 'gen:contract'], join(cwd, 'backend'));
    return { message: 'Generated backend/openapi.json from your route registry.', exitCode: 0 };
  } catch (error) {
    const detail = caughtMessage(error, 'unknown error');
    return {
      message: `Could not generate the contract (${detail}). Install backend deps and retry.`,
      exitCode: 1,
    };
  }
};
