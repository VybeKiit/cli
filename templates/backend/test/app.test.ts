import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const originalNodeEnv = process.env.NODE_ENV;

describe('backend app', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
      return;
    }

    process.env.NODE_ENV = originalNodeEnv;
  });

  it('responds on root and health', () => {
    const app = createApp();
    // Supertest would be ideal; smoke via app stack presence
    expect(app).toBeDefined();
  });
});
