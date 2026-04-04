import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Content lives one level up at the repo root (features/, guides/, case-studies/).
// Point Turbopack at the repo root so those files can be imported by .source/.
const repoRoot = path.resolve(__dirname, '..');

/** @type {import('next').NextConfig} */
const config = {
  output: 'export',
  reactStrictMode: true,
  // Static export can't run the Next.js Image Optimization API at request
  // time, so we serve images as-is (fumadocs-ui wraps markdown images in
  // next/image, which requires `unoptimized` in export mode).
  images: { unoptimized: true },
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
};

export default withMDX(config);
