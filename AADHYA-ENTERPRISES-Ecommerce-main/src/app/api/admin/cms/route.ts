import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin } from '@/lib/admin-auth';
import { BannerSchema, BlogPostSchema } from '@/schemas';
import { CMSRepository } from '@/repositories/cms.repository';
import { AuditRepository } from '@/repositories/audit.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const banners = await CMSRepository.listBanners(false);
    const sections = await CMSRepository.listHomepageSections();
    const testimonials = await CMSRepository.listTestimonials(false);
    const faqs = await CMSRepository.listFaqs(undefined, false);
    const blogs = await CMSRepository.listBlogPosts(false);
    const pages = await CMSRepository.listStaticPages();

    return NextResponse.json({
      success: true,
      data: { banners, sections, testimonials, faqs, blogs, pages },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = authenticateAdmin(req, PermissionKey.MANAGE_CMS);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'banner';
    const json = await req.json();

    let created: any;
    if (type === 'banner') {
      const payload = BannerSchema.parse(json);
      created = await CMSRepository.createBanner(payload);
    } else if (type === 'blog') {
      const payload = BlogPostSchema.parse(json);
      created = await CMSRepository.createBlogPost(payload);
    }

    await AuditRepository.log(
      `CMS_${type.toUpperCase()}_CREATED`,
      type,
      created?.id || null,
      admin.userId,
      admin.email,
      null,
      created
    );

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
