import fs from 'node:fs';
import crypto from 'node:crypto';
import { BROCHURE_CATEGORIES, BROCHURE_PRODUCTS, PDF_CATALOG_ENTRY_COUNT } from './src/lib/brochure-data';
import { AuthService } from './src/services/auth.service';
import { PricingService } from './src/services/pricing.service';
import { OrderService } from './src/services/order.service';
import { RazorpayService } from './src/services/razorpay.service';
import { ProductRepository } from './src/repositories/product.repository';
import { OrderRepository } from './src/repositories/order.repository';
import { InventoryRepository } from './src/repositories/inventory.repository';
import { SettingsRepository } from './src/repositories/settings.repository';
import { SEOService } from './src/lib/seo';
import { handleApiError } from './src/lib/errors';
import { RegisterSchema } from './src/schemas';
import { PaymentGateway, PaymentStatus, OrderStatus, PermissionKey } from './src/types';

async function runBackendTests() {
  let passed = 0;
  let failed = 0;
  const assert = (condition: boolean, label: string) => {
    if (condition) {
      console.log(`  [PASS] ${label}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${label}`);
      failed++;
    }
  };

  console.log('\nSholkveda in-memory backend checks');

  const variantCount = BROCHURE_PRODUCTS.reduce((sum, product) => sum + product.variants.length, 0);
  let invalidRegistrationStatus = 0;
  try {
    RegisterSchema.parse({ fullName: 'Preview Customer', email: 'not-an-email', phone: '9812345678', password: 'preview-password-1' });
  } catch (error) {
    invalidRegistrationStatus = handleApiError(error).status;
  }
  assert(invalidRegistrationStatus === 422, 'invalid registration input is reported as a client validation error');
  assert(PDF_CATALOG_ENTRY_COUNT === 95, 'printed brochure row count remains 95');
  assert(BROCHURE_PRODUCTS.length === 84 && variantCount === 101, '84 products and 101 pack variants are available');
  assert(BROCHURE_PRODUCTS.every((product) => BROCHURE_CATEGORIES.some((category) => category.id === product.categoryId)), 'all products use an existing brochure category');
  assert(BROCHURE_PRODUCTS.every((product) => product.images.every((image) => fs.existsSync(`public${image.url}`))), 'all referenced brochure images exist');

  const catalogue = await ProductRepository.listProducts({ limit: 200 });
  assert(catalogue.total === 84, 'repository lists all 84 brochure products');
  const categories = await ProductRepository.listCategories();
  assert(categories.length === 8 && categories.every((category) => catalogue.products.some((product) => product.categoryId === category.id)), 'all displayed categories contain products');
  const triphala = await ProductRepository.findBySlug('triphala-ras');
  assert(!!triphala && triphala.variants?.[0]?.mrp === 270, 'Triphala Ras uses the printed ₹270 MRP');
  assert(!!triphala && triphala.ratingCount === 0 && triphala.ratingAverage === 0, 'products without reviews have no fabricated rating');
  const jsonLd = triphala ? SEOService.generateProductSchema(triphala) : {};
  assert(!('aggregateRating' in jsonLd), 'product JSON-LD omits ratings when there are no reviews');

  const variant = (await ProductRepository.findBySlug('aloe-vera-juice'))?.variants?.[0];
  assert(!!variant, 'a brochure product variant can be resolved');
  if (variant) {
    const pricing = await PricingService.calculateCart([{ variantId: variant.id, quantity: 1 }]);
    assert(pricing.subtotal === variant.mrp, 'pricing uses the printed MRP without a made-up discount');
    assert(pricing.estimatedGst === 0, 'no unsupported GST rate is inferred');
    assert(pricing.finalPayableAmount === pricing.subtotal + pricing.shippingFee, 'server total matches subtotal plus configured delivery fee');

    const email = `backend-${Date.now()}@example.test`;
    const registered = await AuthService.register({ fullName: 'Preview Customer', email, phone: '9812345678', password: 'preview-password-1' });
    const login = await AuthService.login(email, 'preview-password-1');
    assert(registered.user.id === login.user.id && AuthService.verifyToken(login.token).email === email, 'registration, login and signed session work in-process');
    let denied = false;
    try { AuthService.requirePermission(AuthService.verifyToken(login.token), PermissionKey.MANAGE_SETTINGS); } catch { denied = true; }
    assert(denied, 'customer session cannot access admin settings');

    const stockBefore = await InventoryRepository.getVariantStock(variant.id);
    const result = await OrderService.initiateCheckout({
      userId: registered.user.id,
      customerName: 'Preview Customer',
      customerEmail: email,
      customerPhone: '9812345678',
      shippingAddress: {
        id: `test-address-${Date.now()}`,
        userId: registered.user.id,
        fullName: 'Preview Customer',
        phone: '9812345678',
        addressLine1: '42 Example Street',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '421301',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      items: [{ variantId: variant.id, quantity: 1 }],
      paymentGateway: PaymentGateway.CASH_ON_DELIVERY,
    });
    const saved = await OrderRepository.findById(result.order.id);
    const stockAfter = await InventoryRepository.getVariantStock(variant.id);
    assert(!!saved && saved.orderStatus === OrderStatus.CONFIRMED && saved.paymentStatus === PaymentStatus.PENDING, 'COD creates a confirmed order with payment due');
    assert(!!saved && saved.items.length === 1 && saved.items[0].variantId === variant.id, 'order stores the selected variant and quantity');
    assert(stockAfter === stockBefore - 1, 'COD checkout decrements preview inventory');
    assert(!!saved && (await OrderRepository.findByOrderNumber(saved.orderNumber))?.id === saved.id, 'order can be retrieved by order number in the running process');

    const secret = `test-${crypto.randomBytes(16).toString('hex')}`;
    await SettingsRepository.set('RAZORPAY_KEY_ID', 'rzp_test_preview_only', true);
    await SettingsRepository.set('RAZORPAY_KEY_SECRET', secret, false);
    const paymentOrderId = 'order_test_preview';
    const paymentId = 'pay_test_preview';
    const signature = crypto.createHmac('sha256', secret).update(`${paymentOrderId}|${paymentId}`).digest('hex');
    assert(await RazorpayService.verifySignature(paymentOrderId, paymentId, signature), 'Razorpay HMAC verification accepts a correct signature');
    let rejected = false;
    try { await RazorpayService.verifySignature(paymentOrderId, paymentId, 'mock_sig_pass'); } catch { rejected = true; }
    assert(rejected, 'Razorpay HMAC verification rejects a mock signature');
  }

  console.log(`\nBackend checks: ${passed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

runBackendTests().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
