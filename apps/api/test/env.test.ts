import { describe, expect, it } from 'vitest';
import { loadEnv } from '../src/env.js';

describe('loadEnv', () => {
  it('applies documented defaults when nothing is set', () => {
    const env = loadEnv({});

    expect(env).toEqual({
      PORT: 3000,
      HOST: '0.0.0.0',
      LOG_LEVEL: 'info',
      NODE_ENV: 'development',
      CORS_ORIGIN: 'http://localhost:5173',
    });
  });

  it('parses and coerces provided values', () => {
    const env = loadEnv({
      PORT: '4000',
      HOST: '127.0.0.1',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'production',
      CORS_ORIGIN: 'https://example.com,https://other.example.com',
    });

    expect(env.PORT).toBe(4000);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.LOG_LEVEL).toBe('debug');
    expect(env.NODE_ENV).toBe('production');
    expect(env.CORS_ORIGIN).toBe('https://example.com,https://other.example.com');
  });

  it('fails fast with a clear message on an invalid PORT', () => {
    expect(() => loadEnv({ PORT: 'not-a-number' })).toThrow(/Invalid environment configuration/);
  });

  it('fails fast with a clear message on an invalid LOG_LEVEL', () => {
    expect(() => loadEnv({ LOG_LEVEL: 'not-a-level' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('fails fast with a clear message on an invalid NODE_ENV', () => {
    expect(() => loadEnv({ NODE_ENV: 'staging' })).toThrow(/Invalid environment configuration/);
  });
});
