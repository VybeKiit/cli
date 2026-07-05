'use client';

import { ClaudeOctopusRig } from '@/components/builder-assistant-mark/octopusRig';

const POSES = [
  'alive',
  'working',
  'thinking',
  'sleeping',
  'loving',
  'celebrating',
  'dancing',
  'typing',
  'debugging',
  'meditating',
  'deploying',
  'eureka',
  'walking',
  'weights',
  'flag-wave',
] as const;

export default function MascotDevPage() {
  return (
    <div style={{ padding: 32, background: '#1a1a2e', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', fontSize: 24, marginBottom: 24 }}>
        Clawd — Hand-Crafted Poses ({POSES.length})
      </h1>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 20,
        }}
      >
        {POSES.map((pose) => (
          <div
            key={pose}
            style={{
              background: '#2a2a4a',
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div style={{ width: 140, height: 140 }}>
              <ClaudeOctopusRig pose={pose} />
            </div>
            <span style={{ color: '#ccc', fontSize: 12, fontFamily: 'monospace' }}>{pose}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
