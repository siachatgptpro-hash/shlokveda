import fs from 'node:fs';
import { BROCHURE_CATEGORIES, BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from './src/lib/brochure-data';
import { ProductRepository } from './src/repositories/product.repository';
import { CheckoutInitiateSchema } from './src/schemas';
import { PaymentGateway } from './src/types';

const checks: Array<{ label: string; ok: boolean }> = [];
const record = (label: string, ok: boolean) => checks.push({ label, ok });

async function runPreviewQA() {
  console.log('\nSholkveda storefront preview QA');

  record('95 brochure price-list entries, 84 products and 101 pack variants', PDF_CATALOG_ENTRY_COUNT === 95 && BROCHURE_PRODUCTS.length === 84 && BROCHURE_PRODUCTS.reduce((sum, product) => sum + product.variants.length, 0) === 101);
  record('brochure product image references resolve to local assets', BROCHURE_PRODUCTS.every((product) => product.images.length > 0 && product.images.every((image) => fs.existsSync(`public${image.url}`))));
  record('brochure category IDs are valid and populated', BROCHURE_CATEGORIES.length === 8 && BROCHURE_CATEGORIES.every((category) => BROCHURE_PRODUCTS.some((product) => product.categoryId === category.id)));

  const all = await ProductRepository.listProducts({ limit: 200 });
  record('catalogue repository returns the complete 84-product set', all.total === 84 && all.products.length === 84);
  const syrups = await ProductRepository.listProducts({ categorySlug: 'syrups-juices', limit: 200 });
  record('category filtering resolves brochure syrup listings', syrups.total > 0 && syrups.products.every((product) => product.category?.slug === 'syrups-juices'));
  const search = await ProductRepository.listProducts({ search: 'Triphala Ras', limit: 10 });
  record('catalogue search resolves source product names', search.products.some((product) => product.slug === 'triphala-ras'));
  record('every source product has a listed MRP and pack-size option', BROCHURE_PRODUCTS.every((product) => product.variants.length > 0 && product.variants.every((variant) => variant.mrp > 0 && variant.sellingPrice === variant.mrp)));

  const product = BROCHURE_PRODUCTS[0];
  const checkout = CheckoutInitiateSchema.safeParse({
    items: [{ variantId: product.variants[0].id, quantity: 1 }],
    customerName: 'Preview Customer',
    customerEmail: 'preview@example.test',
    customerPhone: '9812345678',
    shippingAddress: {
      fullName: 'Preview Customer',
      phone: '9812345678',
      addressLine1: '42 Example Street',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '421301',
    },
    paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
  });
  record('validated checkout schema accepts COD guest details and Indian address fields', checkout.success && checkout.data.paymentGateway === PaymentGateway.CASH_ON_DELIVERY);

  const ordersRoute = fs.readFileSync('src/app/api/orders/route.ts', 'utf8');
  const checkoutPage = fs.readFileSync('src/app/checkout/page.tsx', 'utf8');
  const productCard = fs.readFileSync('src/components/storefront/ProductCard.tsx', 'utf8');
  const mobileNav = fs.readFileSync('src/components/shared/MobileNav.tsx', 'utf8');
  const wishlistPage = fs.readFileSync('src/app/wishlist/page.tsx', 'utf8');
  const wishlistClient = fs.readFileSync('src/app/wishlist/WishlistClient.tsx', 'utf8');
  const header = fs.readFileSync('src/components/shared/Header.tsx', 'utf8');
  const styles = fs.readFileSync('src/app/global.css', 'utf8');
  record('orders endpoint exposes a POST handler for checkout', /export async function POST/.test(ordersRoute));
  record('checkout sends contact data and supports COD', /customerEmail: email\.trim\(\)/.test(checkoutPage) && /paymentMethod: 'COD'/.test(checkoutPage));
  record('product cards show an explicit empty-review state', /No reviews yet/.test(productCard));
  record('mobile navigation is fixed and respects safe-area insets', /fixed bottom-0/.test(mobileNav) && /safe-area-bottom/.test(mobileNav) && /env\(safe-area-inset-bottom\)/.test(styles));
  record('mobile page content has bottom clearance for fixed navigation', /pb-20 md:pb-0/.test(fs.readFileSync('src/components/shared/Providers.tsx', 'utf8')));
  record('wishlist is reachable on desktop and mobile and displays saved brochure products', /href="\/wishlist"/.test(header) && /href="\/wishlist"/.test(mobileNav) && /wishlist\.includes\(product\.id\)/.test(wishlistClient) && /WishlistClient/.test(wishlistPage));

  for (const check of checks) console.log(`  ${check.ok ? '[PASS]' : '[FAIL]'} ${check.label}`);
  const failed = checks.filter((check) => !check.ok).length;
  console.log(`\nPreview QA: ${checks.length - failed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

runPreviewQA().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
