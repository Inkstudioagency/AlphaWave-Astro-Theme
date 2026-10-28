// Serves the demo content's images (strapi/data/uploads) at /cms-demo/ when the site
// is built without a Strapi server (see src/lib/strapi-demo.ts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PREFIX = '/cms-demo/';
const TYPES = { '.webp': 'image/webp', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

/** @returns {import('astro').AstroIntegration} */
export default function strapiDemoMedia() {
  const uploads = path.resolve('strapi/data/uploads');
  return {
    name: 'strapi-demo-media',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith(PREFIX)) return next();
          const file = path.join(uploads, decodeURIComponent(req.url.slice(PREFIX.length).split('?')[0]));
          if (!file.startsWith(uploads) || !fs.existsSync(file)) return next();
          res.setHeader('Content-Type', TYPES[path.extname(file)] ?? 'application/octet-stream');
          fs.createReadStream(file).pipe(res);
        });
      },
      'astro:build:done': ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        const usesDemo = fs
          .readdirSync(out, { recursive: true })
          .some((f) => String(f).endsWith('.html') && fs.readFileSync(path.join(out, String(f)), 'utf8').includes(PREFIX));
        if (!usesDemo) return;
        fs.cpSync(uploads, path.join(out, PREFIX), { recursive: true });
        logger.info('copied the demo content images to /cms-demo/');
      },
    },
  };
}
