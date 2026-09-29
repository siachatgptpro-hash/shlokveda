import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/checkout', '/account/', '/order-confirmation', '/orders/'],
      },
    ],
    ...(baseUrl ? { sitemap: `${baseUrl.replace(/\/$/, '')}/sitemap.xml` } : {}),
  };
}
