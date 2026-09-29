import { NextRequest, NextResponse } from 'next/server';
import { requireAdminPermission } from '@/lib/admin-auth';
import { CMSRepository } from '@/repositories/cms.repository';
import { PermissionKey } from '@/types';
import { handleApiError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const banners = await CMSRepository.listBanners(false);
    return NextResponse.json({
      success: true,
      data: { banners },
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
    const json = await req.json();

    const banner = await CMSRepository.createBanner({
      title: json.title,
      subtitle: json.subtitle || null,
      imageUrl: json.imageUrl,
      mobileImgUrl: json.mobileImgUrl || null,
      linkUrl: json.ctaLink || json.linkUrl || '/shop',
      buttonText: json.ctaText || json.buttonText || 'Explore',
      sortOrder: json.sortOrder || 0,
      isActive: json.isActive !== undefined ? json.isActive : true,
      slot: json.slot || 'HERO_PRIMARY',
      ctaText: json.ctaText,
      ctaLink: json.ctaLink,
    });

    return NextResponse.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    const err = handleApiError(error);
    return NextResponse.json(err.body, { status: err.status });
  }
}
