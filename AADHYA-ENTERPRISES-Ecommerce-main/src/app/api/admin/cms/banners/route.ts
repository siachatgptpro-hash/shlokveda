import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminPermission } from '@/lib/admin-auth';
import { CMSRepository } from '@/repositories/cms.repository';
import { PermissionKey } from '@/types';
import { handleApiError, ValidationError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

/** Only http(s) and site-relative URLs may be stored; `javascript:` and `data:` never render. */
const safeUrl = z
  .string()
  .trim()
  .min(1)
  .refine((value) => value.startsWith('/') || /^https?:\/\//i.test(value), {
    message: 'Use an https:// URL or a path starting with "/".',
  });

const BannerInputSchema = z.object({
  title: z.string().trim().min(2).max(120),
  subtitle: z.string().trim().max(240).optional(),
  imageUrl: safeUrl,
  mobileImgUrl: safeUrl.optional().or(z.literal('')),
  ctaText: z.string().trim().max(60).optional(),
  ctaLink: safeUrl.optional(),
  buttonText: z.string().trim().max(60).optional(),
  linkUrl: safeUrl.optional(),
  slot: z.string().trim().max(40).optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdminPermission(req, PermissionKey.MANAGE_CMS);
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
    const parsed = BannerInputSchema.safeParse(json);

    if (!parsed.success) {
      throw new ValidationError('Please check the banner details.', parsed.error.flatten());
    }

    const banner = await CMSRepository.createBanner({
      title: parsed.data.title,
      subtitle: parsed.data.subtitle || null,
      imageUrl: parsed.data.imageUrl,
      mobileImgUrl: parsed.data.mobileImgUrl || null,
      linkUrl: parsed.data.ctaLink || parsed.data.linkUrl || '/shop',
      buttonText: parsed.data.ctaText || parsed.data.buttonText || 'Explore',
      sortOrder: parsed.data.sortOrder ?? 0,
      isActive: parsed.data.isActive !== undefined ? parsed.data.isActive : true,
      slot: parsed.data.slot || 'HERO_PRIMARY',
      ctaText: parsed.data.ctaText,
      ctaLink: parsed.data.ctaLink,
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
