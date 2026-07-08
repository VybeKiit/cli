import { createLogger, resolveDefaultLogLevel } from '@vybekiit/core/logger';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('resolveDefaultLogLevel', () => {
  it('uses debug in development when LOG_LEVEL is absent', () => {
    expect(resolveDefaultLogLevel('development', undefined)).toBe('debug');
  });

  it('uses warn in production when LOG_LEVEL is absent', () => {
    expect(resolveDefaultLogLevel('production', undefined)).toBe('warn');
  });

  it('honours an explicit LOG_LEVEL override', () => {
    expect(resolveDefaultLogLevel('production', 'debug')).toBe('debug');
    expect(resolveDefaultLogLevel('development', 'silent')).toBe('silent');
  });
});

describe('createLogger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits debug and info at debug level', () => {
    const log = createLogger('test', 'debug');
    log.debug('d');
    log.info('i');
    expect(console.log).toHaveBeenCalledTimes(2);
  });

  it('silences debug and info at warn level', () => {
    const log = createLogger('test', 'warn');
    log.debug('d');
    log.info('i');
    log.warn('w');
    expect(console.log).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('silences everything at silent level', () => {
    const log = createLogger('test', 'silent');
    log.error('e');
    log.warn('w');
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('routes errors to console.error', () => {
    const log = createLogger('test', 'warn');
    log.error('boom');
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it('child logger includes merged context in prefix', () => {
    const log = createLogger('api', 'debug').child({ requestId: 'abc' });
    log.info('done');
    expect(console.log).toHaveBeenCalledWith('[api] {"requestId":"abc"}', 'done');
  });
});
