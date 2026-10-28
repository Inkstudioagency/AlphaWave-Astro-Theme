/**
 * Queries used by the pages. Each helper reproduces the filter, sort and limit
 * of the matching collection list in the original template.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type BlogPost = CollectionEntry<'blog'>['data'];
export type Job = CollectionEntry<'jobs'>['data'];
export type Service = CollectionEntry<'services'>['data'];

const byDateDesc = (key: 'publishedDate' | 'postedDate') => (a: any, b: any) => b[key].getTime() - a[key].getTime();
const byDateAsc = (key: 'publishedDate' | 'postedDate') => (a: any, b: any) => a[key].getTime() - b[key].getTime();

const data = <T extends { data: unknown }>(entries: T[]) => entries.map((e) => e.data as T['data']);

// ---------- blog

export async function getBlogPosts(): Promise<BlogPost[]> {
  return data(await getCollection('blog'));
}

/** Home / About / Services slider: latest posts first */
export async function getLatestPosts(limit = 6) {
  return (await getBlogPosts()).sort(byDateDesc('publishedDate')).slice(0, limit);
}

/** /blogs featured row and "More News & Insights" on articles: featured posts, newest first */
export async function getFeaturedPosts(limit = 2) {
  return (await getBlogPosts()).filter((p) => p.featured).sort(byDateDesc('publishedDate')).slice(0, limit);
}

/** /blogs grid: every non-featured post, oldest first */
export async function getGridPosts() {
  return (await getBlogPosts()).filter((p) => !p.featured).sort(byDateAsc('publishedDate'));
}

// ---------- jobs

export async function getJobs(): Promise<Job[]> {
  return data(await getCollection('jobs'));
}

/** /jobs list: most recently posted jobs */
export async function getLatestJobs(limit = 12) {
  return (await getJobs()).sort(byDateDesc('postedDate')).slice(0, limit);
}

/** Home "jobs" section: jobs flagged "Featured on home", newest first */
export async function getHomeJobs(limit = 3) {
  return (await getJobs()).filter((j) => j.featuredOnHome).sort(byDateDesc('postedDate')).slice(0, limit);
}

/** Related jobs on a job page: jobs flagged "Show in related", newest first */
export async function getRelatedJobs(limit = 4) {
  return (await getJobs()).filter((j) => j.showInRelated).sort(byDateDesc('postedDate')).slice(0, limit);
}

// ---------- services

/** All services in their manual sort order */
export async function getServices(): Promise<Service[]> {
  return data(await getCollection('services')).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ---------- formatting

const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

/** "June 5, 2026" — same format as the template */
export const formatDate = (date: Date) => dateFormat.format(date);
