/* Dev-only: render migrated extended-pose overlays on the real octopus body for
 * visual QA. Not shipped — run via tsx, writes /tmp/scene-preview/poses.html. */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import {
  CLAUDE_CODE_BRAND_HEX,
  CLAUDE_CODE_OCTOPUS_PATH,
} from '../src/components/builder-assistant-mark/builderAssistantMarkPaths';
import { CLAUDE_OCTOPUS_EXTENDED_POSES } from '../src/components/builder-assistant-mark/claudeOctopusExtendedPoses';
import {
  EXTENDED_POSE_OVERLAY_IDS,
  extendedPoseOverlay,
} from '../src/components/builder-assistant-mark/extendedPoseOverlays';

const css = readFileSync(
  join(import.meta.dirname, '../src/components/builder-assistant-mark/builder-assistant-mark.css'),
  'utf8',
);

const meta = new Map(CLAUDE_OCTOPUS_EXTENDED_POSES.map((p) => [p.id, p]));

const cards = EXTENDED_POSE_OVERLAY_IDS.map((id) => {
  const info = meta.get(id);
  const anim = info === undefined ? 'bounce' : info.anim;
  const label = info === undefined ? id : info.label;
  const svg = renderToStaticMarkup(
    createElement(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        viewBox: '0 0 24 24',
        width: 108,
        height: 108,
        className: `claude-octopus claude-octopus--${id} claude-octopus--anim-${anim}`,
      },
      createElement(
        'g',
        { className: 'claude-octopus__stage' },
        createElement('path', {
          d: CLAUDE_CODE_OCTOPUS_PATH,
          fill: CLAUDE_CODE_BRAND_HEX,
          fillRule: 'evenodd',
        }),
        extendedPoseOverlay(id),
      ),
    ),
  );
  return `<figure class="card"><div class="stage">${svg}</div><figcaption><b>${label}</b><br/><code>${id}</code> · <span>${anim}</span></figcaption></figure>`;
}).join('\n');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  body { margin:0; background:#f4f4f5; font-family: ui-sans-serif, system-ui, sans-serif; padding:24px; }
  h1 { font-size:18px; }
  .grid { display:grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap:14px; }
  .card { margin:0; background:#fff; border:1px solid #e4e4e7; border-radius:12px; overflow:hidden; }
  .stage { background:#fff; display:flex; justify-content:center; padding:10px 0; }
  .stage svg { display:block; }
  figcaption { padding:8px 10px; font-size:11px; color:#3f3f46; border-top:1px solid #f4f4f5; }
  figcaption code { color:#a1620b; font-size:10px; }
  figcaption span { color:#71717a; }
  ${css}
</style></head><body><h1>Extended-pose bespoke overlays — visual QA (${EXTENDED_POSE_OVERLAY_IDS.length})</h1><div class="grid">${cards}</div></body></html>`;

writeFileSync('/tmp/scene-preview/poses.html', html, 'utf8');
process.stdout.write(
  `wrote /tmp/scene-preview/poses.html (${EXTENDED_POSE_OVERLAY_IDS.length} overlays)\n`,
);
