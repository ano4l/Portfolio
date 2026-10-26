/** Canonical URLs use the stable production domain, including on preview builds. */
export function siteConfig(env = process.env) {
  const configured = env.SITE_URL?.trim();
  const host = env.VERCEL_PROJECT_PRODUCTION_URL || env.VERCEL_URL;
  let origin;
  if (configured || host) {
    const url = new URL(configured || `https://${host}`);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('SITE_URL must be an HTTP(S) origin, such as https://your-domain.com, without a path, credentials, query or fragment.');
    }
    origin = url.origin;
  }
  return { origin, preview: Boolean(env.VERCEL_ENV && env.VERCEL_ENV !== 'production') };
}
