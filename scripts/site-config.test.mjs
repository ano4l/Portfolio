import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteConfig } from './site-config.mjs';

test('ordinary local builds do not invent a public domain', () => {
  assert.deepEqual(siteConfig({}), { origin: undefined, preview: false });
});
test('explicit origin overrides Vercel hosts and normalises a trailing slash', () => {
  assert.equal(siteConfig({ SITE_URL: 'https://portfolio.example/', VERCEL_PROJECT_PRODUCTION_URL: 'other.example' }).origin, 'https://portfolio.example');
});
test('preview builds retain the production canonical domain and prevent indexing', () => {
  assert.deepEqual(siteConfig({ VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'portfolio.example', VERCEL_URL: 'random.vercel.app' }), { origin: 'https://portfolio.example', preview: true });
});
test('deployment host is a fallback when the production host is unavailable', () => {
  assert.deepEqual(siteConfig({ VERCEL_ENV: 'production', VERCEL_URL: 'portfolio.vercel.app' }), { origin: 'https://portfolio.vercel.app', preview: false });
});
test('invalid origins fail the build instead of producing malformed metadata', () => {
  for (const SITE_URL of ['not a url', 'javascript:alert(1)', 'https://user:secret@example.com', 'https://example.com/path', 'https://example.com/?query=1', 'https://example.com/#fragment']) {
    assert.throws(() => siteConfig({ SITE_URL }));
  }
});
