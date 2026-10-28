/**
 * Demo content for builds without a Strapi server (STRAPI_URL not set), e.g. the
 * theme's live demo. It reads the same data the Strapi seed script imports
 * (strapi/data/seed.json) and returns it in the shape of the Strapi REST API.
 * The images are served from /cms-demo/ (see integrations/strapi-demo-media.mjs).
 */
import fs from 'node:fs';
import path from 'node:path';

export const DEMO_MEDIA_PATH = '/cms-demo/';

interface Seed {
  media: Record<string, { file: string; alt: string }>;
  companies: Array<Record<string, any>>;
  blogPosts: Array<Record<string, any>>;
  jobs: Array<Record<string, any>>;
  services: Array<Record<string, any>>;
}

let seed: Seed | undefined;
function loadSeed(): Seed {
  seed ??= JSON.parse(fs.readFileSync(path.join(process.cwd(), 'strapi', 'data', 'seed.json'), 'utf8')) as Seed;
  return seed;
}

export function demoCollection(pluralApiId: string): any[] {
  const s = loadSeed();
  const media = (key?: string | null) =>
    key ? { id: 0, url: DEMO_MEDIA_PATH + s.media[key].file, alternativeText: s.media[key].alt, width: null, height: null, mime: '' } : null;
  const blocks = (nodes: any[] = []) => nodes.map((n) => (n.type === 'image' ? { ...n, image: media(n.image.$media) } : n));
  const person = (p: any) => (p ? { ...p, photo: media(p.photo) } : null);
  const companies = Object.fromEntries(s.companies.map((c) => [c.slug, { ...c, logo: media(c.logo) }]));

  switch (pluralApiId) {
    case 'blog-posts':
      return s.blogPosts.map((p) => ({
        ...p,
        mainImage: media(p.mainImage),
        author: person(p.author),
        body: blocks(p.body),
        gallery: p.gallery.map(media),
        bodyContinued: blocks(p.bodyContinued),
      }));
    case 'jobs':
      return s.jobs.map((j) => ({
        ...j,
        company: companies[j.company],
        overview: blocks(j.overview),
        responsibilities: blocks(j.responsibilities),
        requiredQualifications: blocks(j.requiredQualifications),
        niceToHave: blocks(j.niceToHave),
        whatWeOffer: blocks(j.whatWeOffer),
      }));
    case 'services':
      return s.services.map((sv) => ({
        ...sv,
        icon: media(sv.icon),
        mainImage: media(sv.mainImage),
        detailsImage: media(sv.detailsImage),
        offerings: sv.offerings,
        author: person(sv.author),
        overview: blocks(sv.overview),
        overviewContinued: blocks(sv.overviewContinued),
      }));
    default:
      throw new Error(`No demo content for "${pluralApiId}"`);
  }
}
