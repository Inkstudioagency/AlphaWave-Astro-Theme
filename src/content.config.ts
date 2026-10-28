/**
 * Content collections backed by Strapi (see ./strapi).
 *
 * Each loader fetches the published entries at build time (or when the dev server
 * syncs content), normalises Strapi's response and validates it with a schema.
 * Entry ids are the slugs, so pages can use getEntry('blog', slug).
 */
import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { fetchCollection, mediaUrl, type StrapiMedia } from './lib/strapi';

// ---------- shared shapes

const imageSchema = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

// Strapi "Blocks" rich text, rendered by src/components/RichText.astro
const blocksSchema = z.array(z.any()).default([]);

const personSchema = z.object({
  name: z.string(),
  role: z.string().nullable(),
  photo: imageSchema.nullable(),
});

function image(media: StrapiMedia | null | undefined) {
  if (!media) return null;
  return { url: mediaUrl(media.url), alt: media.alternativeText ?? '', width: media.width, height: media.height };
}

function blocks(nodes: any[] | null | undefined) {
  return (nodes ?? []).map((node) =>
    node.type === 'image' && node.image ? { ...node, image: { ...node.image, url: mediaUrl(node.image.url) } } : node,
  );
}

function person(p: any) {
  return p ? { name: p.name, role: p.role ?? null, photo: image(p.photo) } : null;
}

// ---------- collections

const blog = defineCollection({
  loader: async () => {
    const posts = await fetchCollection<any>('blog-posts', {
      mainImage: true,
      gallery: true,
      author: { populate: { photo: true } },
    });
    return posts.map((p) => ({
      id: p.slug,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      publishedDate: p.publishedDate,
      category: p.category ?? null,
      featured: Boolean(p.featured),
      mainImage: image(p.mainImage),
      author: person(p.author),
      body: blocks(p.body),
      gallery: (p.gallery ?? []).map(image),
      bodyContinued: blocks(p.bodyContinued),
    }));
  },
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    publishedDate: z.coerce.date(),
    category: z.string().nullable(),
    featured: z.boolean(),
    mainImage: imageSchema,
    author: personSchema,
    body: blocksSchema,
    gallery: z.array(imageSchema),
    bodyContinued: blocksSchema,
  }),
});

const jobs = defineCollection({
  loader: async () => {
    const jobs = await fetchCollection<any>('jobs', { company: { populate: { logo: true } } });
    return jobs.map((j) => ({
      id: j.slug,
      title: j.title,
      slug: j.slug,
      company: j.company
        ? {
            name: j.company.name,
            slug: j.company.slug,
            companyType: j.company.companyType ?? '',
            logo: image(j.company.logo),
            website: j.company.website ?? '',
            industry: j.company.industry ?? '',
            employees: j.company.employees ?? '',
            location: j.company.location ?? '',
          }
        : null,
      location: j.location,
      jobType: j.jobType,
      workMode: j.workMode,
      department: j.department,
      experience: j.experience,
      monthlySalary: j.monthlySalary,
      salaryRange: j.salaryRange,
      postedDate: j.postedDate,
      featuredOnHome: Boolean(j.featuredOnHome),
      showInRelated: Boolean(j.showInRelated),
      shortSummary: j.shortSummary,
      overview: blocks(j.overview),
      responsibilities: blocks(j.responsibilities),
      requiredQualifications: blocks(j.requiredQualifications),
      niceToHave: blocks(j.niceToHave),
      whatWeOffer: blocks(j.whatWeOffer),
      contactEmail: j.contactEmail ?? '',
      contactPhone: j.contactPhone ?? '',
    }));
  },
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    company: z.object({
      name: z.string(),
      slug: z.string(),
      companyType: z.string(),
      logo: imageSchema.nullable(),
      website: z.string(),
      industry: z.string(),
      employees: z.string(),
      location: z.string(),
    }),
    location: z.string(),
    jobType: z.string(),
    workMode: z.string(),
    department: z.string(),
    experience: z.string(),
    monthlySalary: z.string(),
    salaryRange: z.string(),
    postedDate: z.coerce.date(),
    featuredOnHome: z.boolean(),
    showInRelated: z.boolean(),
    shortSummary: z.string(),
    overview: blocksSchema,
    responsibilities: blocksSchema,
    requiredQualifications: blocksSchema,
    niceToHave: blocksSchema,
    whatWeOffer: blocksSchema,
    contactEmail: z.string(),
    contactPhone: z.string(),
  }),
});

const services = defineCollection({
  loader: async () => {
    const services = await fetchCollection<any>('services', {
      icon: true,
      mainImage: true,
      detailsImage: true,
      offerings: true,
      stats: true,
      author: { populate: { photo: true } },
    });
    return services.map((s) => ({
      id: s.slug,
      name: s.name,
      slug: s.slug,
      cardTitle: s.cardTitle,
      sortOrder: s.sortOrder ?? 0,
      shortDescription: s.shortDescription,
      icon: image(s.icon),
      mainImage: image(s.mainImage),
      detailsImage: image(s.detailsImage),
      offerings: (s.offerings ?? []).map((o: any) => o.text),
      price: s.price ?? '',
      priceUnit: s.priceUnit ?? '',
      priceNote: s.priceNote ?? '',
      author: person(s.author),
      overview: blocks(s.overview),
      stats: (s.stats ?? []).map((st: any) => ({ value: st.value, label: st.label })),
      overviewContinued: blocks(s.overviewContinued),
    }));
  },
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    cardTitle: z.string(),
    sortOrder: z.number(),
    shortDescription: z.string(),
    icon: imageSchema,
    mainImage: imageSchema,
    detailsImage: imageSchema.nullable(),
    offerings: z.array(z.string()),
    price: z.string(),
    priceUnit: z.string(),
    priceNote: z.string(),
    author: personSchema.nullable(),
    overview: blocksSchema,
    stats: z.array(z.object({ value: z.string(), label: z.string() })),
    overviewContinued: blocksSchema,
  }),
});

export const collections = { blog, jobs, services };
