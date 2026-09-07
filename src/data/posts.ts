import type { CollectionEntry } from 'astro:content';
export function postDetails(post: CollectionEntry<'posts'>) {
  const match = /^(\d{4})-(\d{2})-(\d{2})-(.+)$/.exec(post.id);
  if (!match) throw new Error(`Post filename must begin YYYY-MM-DD-: ${post.id}`);
  const [, year, month, day, slug] = match;
  const path = `${year}/${month}/${day}/${slug}`;
  const date = new Date(`${year}-${month}-${day}T12:00:00Z`);
  return { path, url: `/${path}/`, year, date: date.toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' }) };
}
