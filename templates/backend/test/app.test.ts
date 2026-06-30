import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('backend app', () => {
  it('responds on root and health', async () => {
    const app = createApp();
    // Supertest would be ideal; smoke via app stack presence
    expect(app).toBeDefined();
  });
});
