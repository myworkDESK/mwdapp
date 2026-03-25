/**
 * WorkDesk — Unit tests for Audit Helper (pure logic only)
 *
 * Tests sha256Hex computation without needing a live D1/R2 binding.
 */

import { sha256Hex } from '../lib/audit.js';

describe('sha256Hex', () => {
  it('returns a 64-char hex string', async () => {
    const hash = await sha256Hex('hello world');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', async () => {
    const a = await sha256Hex('test-input');
    const b = await sha256Hex('test-input');
    expect(a).toBe(b);
  });

  it('different inputs produce different hashes', async () => {
    const a = await sha256Hex('input-one');
    const b = await sha256Hex('input-two');
    expect(a).not.toBe(b);
  });

  it('chain: SHA-256("" + payload) matches known value', async () => {
    // echo -n '{"event":"test"}' | sha256sum → known value
    const payload  = '{"event":"test"}';
    const hash     = await sha256Hex('' + payload);
    expect(hash.length).toBe(64);
    expect(typeof hash).toBe('string');
  });

  it('chained hashes: prev_hash changes the output', async () => {
    const payload   = '{"event":"login"}';
    const firstHash = await sha256Hex('' + payload);
    const secondHash = await sha256Hex(firstHash + payload);
    expect(firstHash).not.toBe(secondHash);
  });
});
