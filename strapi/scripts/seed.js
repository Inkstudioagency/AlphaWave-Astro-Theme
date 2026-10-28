'use strict';

/**
 * Seeds the AlphaWave demo content (blog posts, companies, jobs, services) from data/seed.json.
 *
 *   npm run seed            # only when the database has no content yet
 *   npm run seed -- --force # wipe the four collections and seed again
 *
 * It also allows the Public role to read (find / findOne) the four collections,
 * so the Astro site can fetch published content without a token.
 */

const fs = require('fs');
const path = require('path');
const { compileStrapi, createStrapi } = require('@strapi/strapi');

const DATA_DIR = path.join(__dirname, '..', 'data');
const seed = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'seed.json'), 'utf8'));
const force = process.argv.includes('--force');

const UIDS = {
  blogPost: 'api::blog-post.blog-post',
  company: 'api::company.company',
  job: 'api::job.job',
  service: 'api::service.service',
};

const MIME = { webp: 'image/webp', svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

/** media key -> uploaded file entity */
const uploaded = new Map();

async function uploadMedia(key) {
  if (!key) return null;
  if (uploaded.has(key)) return uploaded.get(key);
  const { file, alt } = seed.media[key];
  const filepath = path.join(DATA_DIR, 'uploads', file);
  const ext = path.extname(file).slice(1).toLowerCase();
  const [entity] = await strapi
    .plugin('upload')
    .service('upload')
    .upload({
      files: { filepath, originalFilename: file, mimetype: MIME[ext], size: fs.statSync(filepath).size },
      data: { fileInfo: { name: file, alternativeText: alt, caption: '' } },
    });
  uploaded.set(key, entity);
  return entity;
}

const mediaId = async (key) => (key ? (await uploadMedia(key)).id : null);

/** Replaces `{ $media: key }` placeholders inside Blocks image nodes with the uploaded file */
async function resolveBlocks(blocks) {
  for (const block of blocks) {
    if (block.type === 'image' && block.image?.$media) block.image = await uploadMedia(block.image.$media);
  }
  return blocks;
}

async function personComponent(person) {
  return { name: person.name, role: person.role, photo: await mediaId(person.photo) };
}

async function isEmpty() {
  for (const uid of Object.values(UIDS)) {
    if ((await strapi.documents(uid).count({})) > 0) return false;
  }
  return true;
}

async function wipe() {
  for (const uid of Object.values(UIDS)) {
    const docs = await strapi.documents(uid).findMany({ fields: ['documentId'], status: 'draft' });
    for (const { documentId } of docs) await strapi.documents(uid).delete({ documentId });
  }
}

async function allowPublicRead() {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({ where: { type: 'public' } });
  for (const uid of Object.values(UIDS)) {
    for (const verb of ['find', 'findOne']) {
      const action = `${uid}.${verb}`;
      const exists = await strapi.db.query('plugin::users-permissions.permission').findOne({ where: { action, role: role.id } });
      if (!exists) await strapi.db.query('plugin::users-permissions.permission').create({ data: { action, role: role.id } });
    }
  }
}

async function create(uid, data) {
  return strapi.documents(uid).create({ data, status: 'published' });
}

async function run() {
  if (!(await isEmpty())) {
    if (!force) {
      console.log('Content already exists, skipping seed (use --force to replace it).');
      return;
    }
    console.log('Removing existing content...');
    await wipe();
  }

  const companyIds = {};
  for (const c of seed.companies) {
    const doc = await create(UIDS.company, { ...c, logo: await mediaId(c.logo) });
    companyIds[c.slug] = doc.documentId;
  }
  console.log(`companies: ${seed.companies.length}`);

  for (const j of seed.jobs) {
    await create(UIDS.job, {
      ...j,
      company: companyIds[j.company],
      overview: await resolveBlocks(j.overview),
      responsibilities: await resolveBlocks(j.responsibilities),
      requiredQualifications: await resolveBlocks(j.requiredQualifications),
      niceToHave: await resolveBlocks(j.niceToHave),
      whatWeOffer: await resolveBlocks(j.whatWeOffer),
    });
  }
  console.log(`jobs: ${seed.jobs.length}`);

  for (const p of seed.blogPosts) {
    await create(UIDS.blogPost, {
      ...p,
      mainImage: await mediaId(p.mainImage),
      author: await personComponent(p.author),
      body: await resolveBlocks(p.body),
      gallery: await Promise.all(p.gallery.map(mediaId)),
      bodyContinued: await resolveBlocks(p.bodyContinued),
    });
  }
  console.log(`blog posts: ${seed.blogPosts.length}`);

  for (const s of seed.services) {
    await create(UIDS.service, {
      ...s,
      icon: await mediaId(s.icon),
      mainImage: await mediaId(s.mainImage),
      detailsImage: await mediaId(s.detailsImage),
      author: await personComponent(s.author),
      overview: await resolveBlocks(s.overview),
      overviewContinued: await resolveBlocks(s.overviewContinued),
    });
  }
  console.log(`services: ${seed.services.length}`);
  console.log(`media files: ${uploaded.size}`);
}

async function main() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';
  try {
    await run();
    await allowPublicRead();
    console.log('Public read access enabled for blog posts, companies, jobs and services.');
  } finally {
    await app.destroy();
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
