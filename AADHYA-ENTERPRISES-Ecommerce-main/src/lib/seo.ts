// ==============================================================================
// SEO & STRUCTURED DATA GENERATORS — SHOLKVEDA
// JSON-LD Schema.org Injectors for Product, LocalBusiness, BreadcrumbList, Article
// ==============================================================================

import { BlogPost, Product } from '@/types';

export class SEOService {
  private static baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';

  public static generateLocalBusinessSchema() {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${this.baseUrl}/#organization`,
      name: 'SHOLKVEDA',
      description: 'Sholkveda product catalogue with names, pack sizes and printed MRPs sourced from the supplied brochure.',
      url: this.baseUrl,
      telephone: '+917017840020',
      taxID: '09ANCPV6879P1ZP',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'B.H Oil Meal Road, Next to Bank of Maharashtra, Dobra Bal Colony',
        addressLocality: 'Hathras',
        addressRegion: 'Uttar Pradesh',
        postalCode: '204101',
        addressCountry: 'IN',
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: '27.5968',
        longitude: '78.0525',
      },
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          opens: '09:00',
          closes: '19:00',
        },
      ],
      priceRange: '₹₹',
    };
  }

  public static generateProductSchema(product: Product) {
    const primaryImg = product.images?.find((i) => i.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl || '';
    const minPrice = Math.min(...(product.variants?.map((v) => v.sellingPrice) || [0]));
    const maxPrice = Math.max(...(product.variants?.map((v) => v.sellingPrice) || [0]));
    const inStock = product.variants?.some((v) => v.stockQuantity > 0) ?? true;

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [primaryImg],
      description: product.description || product.shortDescription || product.fullDescription,
      sku: product.skuPrefix || product.variants?.[0]?.sku || 'SV-PRODUCT',
      brand: {
        '@type': 'Brand',
        name: 'SHOLKVEDA',
      },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'INR',
        lowPrice: minPrice,
        highPrice: maxPrice,
        offerCount: product.variants?.length || 1,
        availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        seller: {
          '@type': 'Organization',
          name: 'SHOLKVEDA',
        },
      },
      ...((product.ratingCount ?? 0) > 0 ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: product.ratingAverage ?? 0,
          reviewCount: product.ratingCount ?? 0,
        },
      } : {}),
    };
  }

  public static generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') || !this.baseUrl ? item.url : `${this.baseUrl}${item.url}`,
      })),
    };
  }

  public static generateArticleSchema(blog: BlogPost) {
    const img = blog.coverImage || blog.featuredImg;
    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      description: blog.excerpt || blog.summary || '',
      image: img ? [img] : [],
      datePublished: blog.publishedAt || blog.createdAt,
      dateModified: blog.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'SHOLKVEDA Vaidya Council',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SHOLKVEDA',
      },
    };
  }
}

export const seoService = new SEOService();
export const generateProductJsonLd = (product: Product) => SEOService.generateProductSchema(product);
export const generateBreadcrumbJsonLd = (items: Array<{ name: string; url: string }>) => SEOService.generateBreadcrumbSchema(items);
export const generateLocalBusinessJsonLd = () => SEOService.generateLocalBusinessSchema();
export const generateArticleJsonLd = (blog: BlogPost) => SEOService.generateArticleSchema(blog);
