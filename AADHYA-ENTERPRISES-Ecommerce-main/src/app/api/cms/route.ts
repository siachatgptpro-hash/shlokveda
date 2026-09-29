import { NextRequest, NextResponse } from 'next/server';
import { CMSRepository } from '@/repositories/cms.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const banners = await CMSRepository.listBanners(true);
    const sections = await CMSRepository.listHomepageSections();
    const testimonials = await CMSRepository.listTestimonials(true);
    const faqs = await CMSRepository.listFaqs(undefined, true);
    const blogPosts = await CMSRepository.listBlogPosts(true);
    const businessSettings = await SettingsRepository.getAll(true);

    return NextResponse.json({
      success: true,
      data: {
        banners,
        sections,
        testimonials,
        faqs,
        blogPosts: blogPosts.slice(0, 3),
        businessSettings,
      },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
