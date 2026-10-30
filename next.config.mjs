import { fileURLToPath } from 'node:url';

// Keep local and Vercel builds inside this project, even when it sits in another Next app.
const projectRoot = fileURLToPath(new URL('.', import.meta.url));
const nextConfig = {
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  redirects() {
    return [
      { source: '/websites-for-experts', destination: '/websites-for-businesses', permanent: true },
      { source: '/ru/websites-for-experts', destination: '/ru/websites-for-businesses', permanent: true },
      {
        // Keep legacy API/webhook and auth callbacks reachable during migration.
        source: '/:path((?!api(?:/|$)|auth(?:/|$)|_next(?:/|$)).*)',
        has: [{ type: 'host', value: 'g-lab-tawny.vercel.app' }],
        destination: 'https://g-lab.agency/:path',
        permanent: true,
      },
    ];
  },
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 86400,
  },
};
export default nextConfig;
