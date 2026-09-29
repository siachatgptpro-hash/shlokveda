// ==============================================================================
// CMS, BLOG & REVIEW REPOSITORY — SHOLKVEDA
// ==============================================================================

import { db } from '@/lib/db';
import { isPostgresConfigured, pgQuery } from '@/lib/postgres';
import crypto from 'node:crypto';
import {
  Banner,
  BlogPost,
  FaqItem,
  HomepageSection,
  Review,
  StaticPage,
  Testimonial,
} from '@/types';

const iso=(value:Date|string)=>new Date(value).toISOString();
const createId=(prefix:string)=>`${prefix}_${crypto.randomUUID()}`;
function mapBanner(r:any):Banner{return{id:r.id,title:r.title,subtitle:r.subtitle??null,imageUrl:r.imageUrl,mobileImgUrl:r.mobileImgUrl??null,linkUrl:r.linkUrl??null,buttonText:r.buttonText??null,sortOrder:r.sortOrder,isActive:r.isActive,createdAt:iso(r.createdAt),updatedAt:iso(r.updatedAt),ctaText:r.buttonText??undefined,ctaLink:r.linkUrl??undefined}}
function mapSection(r:any):HomepageSection{let metadata=r.metadata??undefined;if(typeof metadata==='string'){try{metadata=JSON.parse(metadata)}catch{}}return{id:r.id,sectionKey:r.sectionKey,title:r.title,subtitle:r.subtitle??null,sortOrder:r.sortOrder,isActive:r.isActive,metadata,updatedAt:iso(r.updatedAt)}}
function mapTestimonial(r:any):Testimonial{return{id:r.id,authorName:r.authorName,location:r.location??null,rating:r.rating,reviewQuote:r.reviewQuote,avatarUrl:r.avatarUrl??null,isActive:r.isActive,sortOrder:r.sortOrder,createdAt:iso(r.createdAt)}}
function mapFaq(r:any):FaqItem{return{id:r.id,category:r.category,question:r.question,answer:r.answer,sortOrder:r.sortOrder,isActive:r.isActive,createdAt:iso(r.createdAt)}}
function mapBlog(r:any):BlogPost{return{id:r.id,title:r.title,slug:r.slug,summary:r.summary??null,content:r.content,featuredImg:r.featuredImg??null,authorName:r.authorName,readTimeMinutes:r.readTimeMinutes,isPublished:r.isPublished,publishedAt:r.publishedAt?iso(r.publishedAt):null,metaTitle:r.metaTitle??null,metaDescription:r.metaDescription??null,createdAt:iso(r.createdAt),updatedAt:iso(r.updatedAt),excerpt:r.summary??null,coverImage:r.featuredImg??null}}
function mapStatic(r:any):StaticPage{return{id:r.id,slug:r.slug,title:r.title,content:r.content,metaTitle:r.metaTitle??null,metaDescription:r.metaDescription??null,updatedAt:iso(r.updatedAt)}}
function mapReview(r:any):Review{return{id:r.id,productId:r.productId,userId:r.userId,userName:r.userName??undefined,rating:r.rating,title:r.title??null,comment:r.comment,isVerified:r.isVerified,isApproved:r.isApproved,adminReply:r.adminReply??null,createdAt:iso(r.createdAt),updatedAt:iso(r.updatedAt),isVerifiedPurchase:r.isVerified,user:r.userName?{id:r.userId,name:r.userName,email:r.userEmail??undefined}:undefined,product:r.productName?{id:r.productId,name:r.productName,slug:r.productSlug}:undefined}}
async function updateRow<T>(table:string,idValue:string,updates:Record<string,unknown>,columns:Record<string,string>,mapper:(r:any)=>T):Promise<T|null>{
  const entries=Object.entries(updates).filter(([key,value])=>columns[key]&&value!==undefined);
  if(!entries.length){const r=await pgQuery(`SELECT * FROM "${table}" WHERE "id"=$1 LIMIT 1`,[idValue]);return r.rows[0]?mapper(r.rows[0]):null}
  const vals=entries.map(([key,value])=>key==='metadata'&&value!==null&&typeof value!=='string'?JSON.stringify(value):value);
  const sets=entries.map(([key],i)=>`"${columns[key]}"=$${i+2}`);
  if(['Banner','BlogPost'].includes(table))sets.push('"updatedAt"=CURRENT_TIMESTAMP');
  const r=await pgQuery(`UPDATE "${table}" SET ${sets.join(',')} WHERE "id"=$1 RETURNING *`,[idValue,...vals]);
  return r.rows[0]?mapper(r.rows[0]):null;
}

export class CMSRepository {
  // ----------------------------------------------------------------------------
  // BANNERS
  // ----------------------------------------------------------------------------

  public static async listBanners(activeOnly = true): Promise<Banner[]> {
    if (isPostgresConfigured()) { const r=await pgQuery(`SELECT * FROM "Banner" ${activeOnly?'WHERE "isActive"=TRUE':''} ORDER BY "sortOrder" ASC,"createdAt" ASC`); return r.rows.map(mapBanner); }
    return Array.from(db.banners.values())
      .filter((b) => !activeOnly || b.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async createBanner(data: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Banner> {
    if (isPostgresConfigured()) { const r=await pgQuery('INSERT INTO "Banner" ("id","title","subtitle","imageUrl","mobileImgUrl","linkUrl","buttonText","sortOrder","isActive","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *',[createId('ban'),data.title,data.subtitle??null,data.imageUrl,data.mobileImgUrl??null,data.linkUrl??data.ctaLink??null,data.buttonText??data.ctaText??null,data.sortOrder,data.isActive]); return mapBanner(r.rows[0]); }
    const id = `ban_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const banner: Banner = { ...data, id, createdAt: now, updatedAt: now };
    db.banners.set(id, banner);
    return { ...banner };
  }

  public static async updateBanner(id: string, updates: Partial<Banner>): Promise<Banner | null> {
    if (isPostgresConfigured()) return updateRow('Banner',id,updates as Record<string,unknown>,{title:'title',subtitle:'subtitle',imageUrl:'imageUrl',mobileImgUrl:'mobileImgUrl',linkUrl:'linkUrl',buttonText:'buttonText',ctaText:'buttonText',ctaLink:'linkUrl',sortOrder:'sortOrder',isActive:'isActive'},mapBanner);
    const banner = db.banners.get(id);
    if (!banner) return null;
    const updated: Banner = { ...banner, ...updates, updatedAt: new Date().toISOString() };
    db.banners.set(id, updated);
    return { ...updated };
  }

  public static async deleteBanner(id: string): Promise<boolean> {
    if (isPostgresConfigured()) { const r=await pgQuery('DELETE FROM "Banner" WHERE "id"=$1',[id]); return (r.rowCount||0)>0; }
    return db.banners.delete(id);
  }

  // ----------------------------------------------------------------------------
  // HOMEPAGE SECTIONS
  // ----------------------------------------------------------------------------

  public static async listHomepageSections(): Promise<HomepageSection[]> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "HomepageSection" ORDER BY "sortOrder" ASC'); return r.rows.map(mapSection); }
    return Array.from(db.homepageSections.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async updateHomepageSection(
    sectionKey: string,
    updates: Partial<HomepageSection>
  ): Promise<HomepageSection> {
    if (isPostgresConfigured()) {
      const existing=await pgQuery('SELECT * FROM "HomepageSection" WHERE "sectionKey"=$1',[sectionKey]);
      const before:HomepageSection=existing.rows[0]?mapSection(existing.rows[0]):{id:createId('sec'),sectionKey,title:sectionKey,sortOrder:0,isActive:true,updatedAt:new Date().toISOString()};
      const section={...before,...updates,sectionKey};
      const metadata=section.metadata===undefined?null:(typeof section.metadata==='string'?section.metadata:JSON.stringify(section.metadata));
      const r=await pgQuery('INSERT INTO "HomepageSection" ("id","sectionKey","title","subtitle","sortOrder","isActive","metadata","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP) ON CONFLICT ("sectionKey") DO UPDATE SET "title"=EXCLUDED."title","subtitle"=EXCLUDED."subtitle","sortOrder"=EXCLUDED."sortOrder","isActive"=EXCLUDED."isActive","metadata"=EXCLUDED."metadata","updatedAt"=CURRENT_TIMESTAMP RETURNING *',[section.id,sectionKey,section.title,section.subtitle??null,section.sortOrder,section.isActive,metadata]);
      return mapSection(r.rows[0]);
    }
    const existing = db.homepageSections.get(sectionKey) || {
      id: `sec_${sectionKey.toLowerCase()}`,
      sectionKey,
      title: sectionKey,
      sortOrder: 0,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    const updated: HomepageSection = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.homepageSections.set(sectionKey, updated);
    return { ...updated };
  }

  // ----------------------------------------------------------------------------
  // TESTIMONIALS & FAQS
  // ----------------------------------------------------------------------------

  public static async listTestimonials(activeOnly = true): Promise<Testimonial[]> {
    if (isPostgresConfigured()) { const r=await pgQuery(`SELECT * FROM "Testimonial" ${activeOnly?'WHERE "isActive"=TRUE':''} ORDER BY "sortOrder" ASC`); return r.rows.map(mapTestimonial); }
    return Array.from(db.testimonials.values())
      .filter((t) => !activeOnly || t.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async createTestimonial(data: Omit<Testimonial, 'id' | 'createdAt'>): Promise<Testimonial> {
    if (isPostgresConfigured()) { const r=await pgQuery('INSERT INTO "Testimonial" ("id","authorName","location","rating","reviewQuote","avatarUrl","isActive","sortOrder","createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,CURRENT_TIMESTAMP) RETURNING *',[createId('test'),data.authorName,data.location??null,data.rating,data.reviewQuote,data.avatarUrl??null,data.isActive,data.sortOrder]); return mapTestimonial(r.rows[0]); }
    const id = `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const testimonial: Testimonial = { ...data, id, createdAt: new Date().toISOString() };
    db.testimonials.set(id, testimonial);
    return { ...testimonial };
  }

  public static async listFaqs(category?: string, activeOnly = true): Promise<FaqItem[]> {
    if (isPostgresConfigured()) { const values:unknown[]=[];const clauses:string[]=[];if(activeOnly)clauses.push('"isActive"=TRUE');if(category){values.push(category);clauses.push(`LOWER("category")=LOWER($${values.length})`)}const r=await pgQuery(`SELECT * FROM "FaqItem" ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''} ORDER BY "sortOrder" ASC`,values);return r.rows.map(mapFaq); }
    let list = Array.from(db.faqItems.values()).filter((f) => !activeOnly || f.isActive);
    if (category) {
      list = list.filter((f) => f.category.toLowerCase() === category.toLowerCase());
    }
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public static async createFaq(data: Omit<FaqItem, 'id' | 'createdAt'>): Promise<FaqItem> {
    if (isPostgresConfigured()) { const r=await pgQuery('INSERT INTO "FaqItem" ("id","category","question","answer","sortOrder","isActive","createdAt") VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) RETURNING *',[createId('faq'),data.category,data.question,data.answer,data.sortOrder,data.isActive]); return mapFaq(r.rows[0]); }
    const id = `faq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const faq: FaqItem = { ...data, id, createdAt: new Date().toISOString() };
    db.faqItems.set(id, faq);
    return { ...faq };
  }

  // ----------------------------------------------------------------------------
  // BLOG & ARTICLES
  // ----------------------------------------------------------------------------

  public static async listBlogPosts(publishedOnly = true): Promise<BlogPost[]> {
    if (isPostgresConfigured()) { const r=await pgQuery(`SELECT * FROM "BlogPost" ${publishedOnly?'WHERE "isPublished"=TRUE':''} ORDER BY "createdAt" DESC`); return r.rows.map(mapBlog); }
    return Array.from(db.blogPosts.values())
      .filter((b) => !publishedOnly || b.isPublished)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async findBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "BlogPost" WHERE LOWER("slug")=LOWER($1) LIMIT 1',[slug]); return r.rows[0]?mapBlog(r.rows[0]):null; }
    const posts = Array.from(db.blogPosts.values());
    for (const b of posts) {
      if (b.slug === slug.toLowerCase()) return { ...b };
    }
    return null;
  }

  public static async createBlogPost(data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<BlogPost> {
    if (isPostgresConfigured()) { const publishedAt=data.isPublished?new Date():null;const r=await pgQuery('INSERT INTO "BlogPost" ("id","title","slug","summary","content","featuredImg","authorName","readTimeMinutes","isPublished","publishedAt","metaTitle","metaDescription","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *',[createId('blog'),data.title,data.slug.toLowerCase(),data.summary??data.excerpt??null,data.content,data.featuredImg??data.coverImage??null,data.authorName,data.readTimeMinutes,data.isPublished,publishedAt,data.metaTitle??null,data.metaDescription??null]);return mapBlog(r.rows[0]); }
    const id = `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const blog: BlogPost = {
      ...data,
      id,
      publishedAt: data.isPublished ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    db.blogPosts.set(id, blog);
    return { ...blog };
  }

  public static async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost | null> {
    if (isPostgresConfigured()) {
      const prior=await pgQuery('SELECT "publishedAt" FROM "BlogPost" WHERE "id"=$1',[id]);
      if(!prior.rows[0])return null;
      const patch={...updates,slug:updates.slug?.toLowerCase(),summary:updates.summary??updates.excerpt,featuredImg:updates.featuredImg??updates.coverImage,publishedAt:updates.isPublished&&!prior.rows[0].publishedAt?new Date():updates.publishedAt};
      return updateRow('BlogPost',id,patch as Record<string,unknown>,{title:'title',slug:'slug',summary:'summary',excerpt:'summary',content:'content',featuredImg:'featuredImg',coverImage:'featuredImg',authorName:'authorName',readTimeMinutes:'readTimeMinutes',isPublished:'isPublished',publishedAt:'publishedAt',metaTitle:'metaTitle',metaDescription:'metaDescription'},mapBlog);
    }
    const blog = db.blogPosts.get(id);
    if (!blog) return null;
    const now = new Date().toISOString();
    const updated: BlogPost = {
      ...blog,
      ...updates,
      publishedAt: updates.isPublished && !blog.publishedAt ? now : blog.publishedAt,
      updatedAt: now,
    };
    db.blogPosts.set(id, updated);
    return { ...updated };
  }

  public static async deleteBlogPost(id: string): Promise<boolean> {
    if (isPostgresConfigured()) { const r=await pgQuery('DELETE FROM "BlogPost" WHERE "id"=$1',[id]); return (r.rowCount||0)>0; }
    return db.blogPosts.delete(id);
  }

  // ----------------------------------------------------------------------------
  // STATIC PAGES
  // ----------------------------------------------------------------------------

  public static async findStaticPageBySlug(slug: string): Promise<StaticPage | null> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "StaticPage" WHERE LOWER("slug")=LOWER($1) LIMIT 1',[slug]); return r.rows[0]?mapStatic(r.rows[0]):null; }
    const page = db.staticPages.get(slug.toLowerCase());
    return page ? { ...page } : null;
  }

  public static async listStaticPages(): Promise<StaticPage[]> {
    if (isPostgresConfigured()) { const r=await pgQuery('SELECT * FROM "StaticPage" ORDER BY "slug" ASC'); return r.rows.map(mapStatic); }
    return Array.from(db.staticPages.values());
  }

  public static async updateStaticPage(slug: string, updates: Partial<StaticPage>): Promise<StaticPage> {
    if (isPostgresConfigured()) {
      const key=slug.toLowerCase(),existing=await pgQuery('SELECT * FROM "StaticPage" WHERE LOWER("slug")=LOWER($1) LIMIT 1',[key]);
      const before:StaticPage=existing.rows[0]?mapStatic(existing.rows[0]):{id:createId('page'),slug:key,title:key,content:'',updatedAt:new Date().toISOString()};
      const page={...before,...updates,slug:key};
      const r=await pgQuery('INSERT INTO "StaticPage" ("id","slug","title","content","metaTitle","metaDescription","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP) ON CONFLICT ("slug") DO UPDATE SET "title"=EXCLUDED."title","content"=EXCLUDED."content","metaTitle"=EXCLUDED."metaTitle","metaDescription"=EXCLUDED."metaDescription","updatedAt"=CURRENT_TIMESTAMP RETURNING *',[page.id,page.slug,page.title,page.content,page.metaTitle??null,page.metaDescription??null]);
      return mapStatic(r.rows[0]);
    }
    const existing = db.staticPages.get(slug.toLowerCase()) || {
      id: `page_${slug}`,
      slug,
      title: slug,
      content: '',
      updatedAt: new Date().toISOString(),
    };
    const updated: StaticPage = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    db.staticPages.set(slug.toLowerCase(), updated);
    return { ...updated };
  }

  // ----------------------------------------------------------------------------
  // REVIEWS & MODERATION
  // ----------------------------------------------------------------------------

  public static async listReviews(productId?: string, approvedOnly = true): Promise<Review[]> {
    if (isPostgresConfigured()) {
      const clauses:string[]=[];const values:unknown[]=[];
      if(productId){values.push(productId);clauses.push(`r."productId"=$${values.length}`)}
      if(approvedOnly)clauses.push('r."isApproved"=TRUE');
      const r=await pgQuery(`SELECT r.*,u."fullName" AS "userName",u."email" AS "userEmail",p."name" AS "productName",p."slug" AS "productSlug" FROM "Review" r JOIN "User" u ON u."id"=r."userId" JOIN "Product" p ON p."id"=r."productId" ${clauses.length?`WHERE ${clauses.join(' AND ')}`:''} ORDER BY r."createdAt" DESC`,values);
      return r.rows.map(mapReview);
    }
    let list = Array.from(db.reviews.values());
    if (productId) list = list.filter((r) => r.productId === productId);
    if (approvedOnly) list = list.filter((r) => r.isApproved);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public static async createReview(data: Omit<Review, 'id' | 'createdAt' | 'updatedAt' | 'isApproved' | 'adminReply'>): Promise<Review> {
    if (isPostgresConfigured()) {
      const r=await pgQuery('INSERT INTO "Review" ("id","productId","userId","rating","title","comment","isVerified","isApproved","adminReply","createdAt","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *',[createId('rev'),data.productId,data.userId,data.rating,data.title??null,data.comment,data.isVerified??data.isVerifiedPurchase??false]);
      const full=await pgQuery('SELECT r.*,u."fullName" AS "userName",u."email" AS "userEmail",p."name" AS "productName",p."slug" AS "productSlug" FROM "Review" r JOIN "User" u ON u."id"=r."userId" JOIN "Product" p ON p."id"=r."productId" WHERE r."id"=$1',[r.rows[0].id]);return mapReview(full.rows[0]);
    }
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    const review: Review = {
      ...data,
      id,
      isApproved: false,
      adminReply: null,
      createdAt: now,
      updatedAt: now,
    };
    db.reviews.set(id, review);
    return { ...review };
  }

  public static async moderateReview(
    id: string,
    isApproved: boolean,
    adminReply?: string | null
  ): Promise<Review | null> {
    if (isPostgresConfigured()) {
      const values:unknown[]=[id,isApproved];let replySql='';
      if(adminReply!==undefined){values.push(adminReply);replySql=',"adminReply"=$3';}
      const r=await pgQuery(`UPDATE "Review" SET "isApproved"=$2${replySql},"updatedAt"=CURRENT_TIMESTAMP WHERE "id"=$1 RETURNING "id"`,values);
      if(!r.rows[0])return null;
      const full=await pgQuery('SELECT r.*,u."fullName" AS "userName",u."email" AS "userEmail",p."name" AS "productName",p."slug" AS "productSlug" FROM "Review" r JOIN "User" u ON u."id"=r."userId" JOIN "Product" p ON p."id"=r."productId" WHERE r."id"=$1',[id]);return full.rows[0]?mapReview(full.rows[0]):null;
    }
    const rev = db.reviews.get(id);
    if (!rev) return null;
    const updated: Review = {
      ...rev,
      isApproved,
      adminReply: adminReply !== undefined ? adminReply : rev.adminReply,
      updatedAt: new Date().toISOString(),
    };
    db.reviews.set(id, updated);
    return { ...updated };
  }

  public static async deleteReview(id: string): Promise<boolean> {
    if (isPostgresConfigured()) { const r=await pgQuery('DELETE FROM "Review" WHERE "id"=$1',[id]); return (r.rowCount||0)>0; }
    return db.reviews.delete(id);
  }

  // Aliases & Instance Methods
  public static async getActiveBanners() { return this.listBanners(true); }

  public listBanners(activeOnly?: boolean) { return CMSRepository.listBanners(activeOnly); }
  public getActiveBanners() { return CMSRepository.getActiveBanners(); }
  public createBanner(data: any) { return CMSRepository.createBanner(data); }
  public updateBanner(id: string, updates: any) { return CMSRepository.updateBanner(id, updates); }
  public deleteBanner(id: string) { return CMSRepository.deleteBanner(id); }
  public listHomepageSections() { return CMSRepository.listHomepageSections(); }
  public updateHomepageSection(key: string, updates: any) { return CMSRepository.updateHomepageSection(key, updates); }
  public listTestimonials(activeOnly?: boolean) { return CMSRepository.listTestimonials(activeOnly); }
  public createTestimonial(data: any) { return CMSRepository.createTestimonial(data); }
  public listFaqs(cat?: string, activeOnly?: boolean) { return CMSRepository.listFaqs(cat, activeOnly); }
  public listBlogPosts(publishedOnly?: boolean) { return CMSRepository.listBlogPosts(publishedOnly); }
  public findBlogPostBySlug(slug: string) { return CMSRepository.findBlogPostBySlug(slug); }
  public getStaticPage(slug: string) { return CMSRepository.findStaticPageBySlug(slug); }
  public findStaticPageBySlug(slug: string) { return CMSRepository.findStaticPageBySlug(slug); }
  public updateStaticPage(slug: string, updates: any) { return CMSRepository.updateStaticPage(slug, updates); }
  public listReviews(prodId?: string, approvedOnly?: boolean) { return CMSRepository.listReviews(prodId, approvedOnly); }
  public createReview(data: any) { return CMSRepository.createReview(data); }
  public moderateReview(id: string, isApproved: boolean, reply?: string) { return CMSRepository.moderateReview(id, isApproved, reply); }
  public deleteReview(id: string) { return CMSRepository.deleteReview(id); }
}

export const cmsRepository = new CMSRepository();

