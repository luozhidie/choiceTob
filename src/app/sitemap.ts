import { MetadataRoute } from 'next';

const BASE_URL = 'https://colour-choice.art';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: '', lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: '/buyer', lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: '/courses', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: '/daily-looks', lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: '/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: '/register', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: '/my', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  return staticPages.map(page => ({
    url: `${BASE_URL}${page.url}`,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
