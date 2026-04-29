import { getCollection } from 'astro:content';

const docs = await getCollection('docs');
console.log(docs.map(d => d.slug));
