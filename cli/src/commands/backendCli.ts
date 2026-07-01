import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { scaffold } from '../lib/scaffold';
import { resolveTemplatesSource, cloneMirror } from '../lib/resolveTemplates';

function pascalCase(name: string): string {
  // PascalCase, splitting on "-", "_", "/": "add-user" → "AddUser"
  return name
    .split(/[-_/]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function kebabCase(name: string): string {
  // kebab slug: spaces → "-", then drop anything not [a-z0-9-]: "My Route!" → "my-route"
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function ensureBackendDir(cwd: string): Promise<boolean> {
  try {
    await access(join(cwd, 'backend', 'src', 'app.ts'));
    return true;
  } catch {
    return false;
  }
}

export async function runScaffoldBackend(
  args: string[],
  cwd: string = process.cwd(),
  packagesVersion: string,
): Promise<{ readonly message: string; readonly exitCode: number }> {
  const destName = args[0] ?? 'backend';
  const dest = join(cwd, destName);

  try {
    await access(dest);
    return { message: `${destName}/ already exists.`, exitCode: 1 };
  } catch {
    // ok — does not exist
  }

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const resolved = await resolveTemplatesSource('backend', {
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
    cleanup = resolved.cleanup;

    await scaffold({
      template: 'backend',
      source: resolved.source,
      dest,
      packagesVersion,
    });

    return { message: `Scaffolded ${destName}/ — your API server is ready.`, exitCode: 0 };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : 'Scaffold failed.',
      exitCode: 1,
    };
  } finally {
    await cleanup?.();
  }
}

export async function runBackendAddRoute(
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> {
  const name = args[0];
  if (!name) {
    return { message: 'Pass a route name: vybekiit backend add-route users', exitCode: 1 };
  }

  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  const slug = kebabCase(name);
  const Pascal = pascalCase(slug);
  const backendRoot = join(cwd, 'backend');

  const controllerPath = join(backendRoot, 'src/controllers', `${slug}.controller.ts`);
  const routePath = join(backendRoot, 'src/routes', `${slug}.routes.ts`);

  await mkdir(join(backendRoot, 'src/controllers'), { recursive: true });
  await mkdir(join(backendRoot, 'src/routes'), { recursive: true });

  const controller = `import type { Request, Response } from 'express';

export function get${Pascal}(_req: Request, res: Response): void {
  res.json({ ok: true, resource: '${slug}' });
}
`;

  const route = `import { Router } from 'express';
import { get${Pascal} } from '../controllers/${slug}.controller.js';

export const ${slug}Router = Router();

${slug}Router.get('/', get${Pascal});
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
}

export async function runBackendAddCrud(
  args: string[],
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> {
  const name = args[0];
  if (!name) {
    return { message: 'Pass a resource name: vybekiit backend add-crud posts', exitCode: 1 };
  }

  if (!(await ensureBackendDir(cwd))) {
    return { message: 'No backend/ found. Run vybekiit scaffold backend first.', exitCode: 1 };
  }

  const slug = kebabCase(name);
  const Pascal = pascalCase(slug);
  const backendRoot = join(cwd, 'backend');

  const controllerPath = join(backendRoot, 'src/controllers', `${slug}.controller.ts`);
  const routePath = join(backendRoot, 'src/routes', `${slug}.routes.ts`);

  await mkdir(join(backendRoot, 'src/controllers'), { recursive: true });
  await mkdir(join(backendRoot, 'src/routes'), { recursive: true });

  const controller = `import type { Request, Response } from 'express';

const store: Record<string, unknown>[] = [];

export function list${Pascal}(_req: Request, res: Response): void {
  res.json({ items: store });
}

export function get${Pascal}(req: Request, res: Response): void {
  const item = store.find((row) => (row as { id?: string }).id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  res.json(item);
}

export function create${Pascal}(req: Request, res: Response): void {
  const item = { id: crypto.randomUUID(), ...req.body };
  store.push(item);
  res.status(201).json(item);
}

export function update${Pascal}(req: Request, res: Response): void {
  const idx = store.findIndex((row) => (row as { id?: string }).id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  store[idx] = { ...store[idx], ...req.body, id: req.params.id };
  res.json(store[idx]);
}

export function delete${Pascal}(req: Request, res: Response): void {
  const idx = store.findIndex((row) => (row as { id?: string }).id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Not found.' });
    return;
  }
  store.splice(idx, 1);
  res.status(204).send();
}
`;

  const route = `import { Router } from 'express';
import {
  create${Pascal},
  delete${Pascal},
  get${Pascal},
  list${Pascal},
  update${Pascal},
} from '../controllers/${slug}.controller.js';

export const ${slug}Router = Router();

${slug}Router.get('/', list${Pascal});
${slug}Router.get('/:id', get${Pascal});
${slug}Router.post('/', create${Pascal});
${slug}Router.patch('/:id', update${Pascal});
${slug}Router.delete('/:id', delete${Pascal});
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
}

export async function runBackendAddUpload(
  cwd: string = process.cwd(),
): Promise<{ readonly message: string; readonly exitCode: number }> {
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
}
