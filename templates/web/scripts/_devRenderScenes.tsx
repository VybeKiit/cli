/* Dev-only: render the real scene components to a static HTML gallery for visual QA.
 * Not shipped — run via tsx, writes /tmp/scene-preview/scenes.html. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { CLAUDE_OCTOPUS_SCENES } from '../src/components/builder-assistant-mark/claudeOctopusScenes';

const css = readFileSync(
  join(
    import.meta.dirname,
    '../src/components/builder-assistant-mark/builder-assistant-scenes.css',
  ),
  'utf8',
);

const cards = CLAUDE_OCTOPUS_SCENES.map((scene) => {
  const body = renderToStaticMarkup(
    createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 320 220',
        width: 320,
        height: 220,
        className: `claude-scene claude-scene--${scene.id}`,
      },
      scene.render(),
    ),
  );
  return `<figure class="card"><div class="stage">${body}</div><figcaption><b>${scene.label}</b><br/><span>${scene.description}</span><br/><code>scene="${scene.id}"</code></figcaption></figure>`;
}).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; padding:24px; }
  h1 { font-size:18px; }
  .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:20px; }
  .card { margin:0; background:#fff; border:1px solid #e4e4e7; border-radius:14px; overflow:hidden; }
  .stage { background:#fff; display:flex; justify-content:center; }
  .stage svg { width:100%; height:auto; display:block; }
  figcaption { padding:12px 14px; font-size:12px; color:#3f3f46; }
  figcaption code { color:#71717a; font-size:11px; }
  ${css}
</style></head><body><h1>Claude octopus deluxe scenes — visual QA (${CLAUDE_OCTOPUS_SCENES.length})</h1><div class="grid">${cards}</div></body></html>`;

writeFileSync('/tmp/scene-preview/scenes.html', html, 'utf8');
process.stdout.write(
  `wrote /tmp/scene-preview/scenes.html (${CLAUDE_OCTOPUS_SCENES.length} scenes)\n`,
);
