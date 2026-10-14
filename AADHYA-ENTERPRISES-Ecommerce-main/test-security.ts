import fs from 'node:fs';
import { NextRequest } from 'next/server';

import { AuthService } from './src/services/auth.service';
import { OrderService } from './src/services/order.service';
import { OrderRepository } from './src/repositories/order.repository';
import { ProductRepository } from './src/repositories/product.repository';
import { SettingsRepository } from './src/repositories/settings.repository';
import { UserRepository } from './src/repositories/user.repository';
import { consumeRateLimit, resetRateLimit } from './src/lib/rate-limit';
import { PaymentGateway, PaymentStatus, PermissionKey, SystemRole } from './src/types';

import { POST as registerPost } from './src/app/api/auth/register/route';
import { POST as logoutPost } from './src/app/api/auth/logout/route';
import { GET as adminProductGet, PUT as adminProductPut } from './src/app/api/admin/products/[id]/route';
import { GET as adminSettingsGet, PUT as adminSettingsPut, POST as adminSettingsPost } from './src/app/api/admin/settings/route';
import { POST as couponPost } from './src/app/api/admin/coupons/route';
import { POST as inventoryAdjustPost } from './src/app/api/admin/inventory/adjust/route';
import { POST as bannerPost } from './src/app/api/admin/cms/banners/route';
import { GET as catalogProductsGet } from './src/app/api/catalog/products/route';
import { POST as cartCalculatePost } from './src/app/api/cart/calculate/route';

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

const jsonRequest = (url: string, method: 'POST' | 'PUT', body: unknown, token?: string) =>
  new NextRequest(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

const readJson = async (response: Response) => {
  try {
    return (await response.clone().json()) as any;
  } catch {
    return {};
  }
};

const getRequest = (url: string, token?: string) =>
  new NextRequest(url, token ? { headers: { authorization: `Bearer ${token}` } } : undefined);

async function runSecurityChecks() {
  console.log('\nSholkveda access-control and input-validation checks');

  // ---------------------------------------------------------------------------
  // 1. Registration contract (the sign-up form posts `name`)
  // ---------------------------------------------------------------------------
  const unique = Date.now();
  const uiShape = await registerPost(
    jsonRequest('http://localhost/api/auth/register', 'POST', {
      name: 'Security Test User',
      email: `security-ui-${unique}@example.test`,
      phone: '9812345678',
      password: 'security-test-password',
    })
  );
  assert(uiShape.status === 201, 'registration accepts the payload shape the sign-up form sends');

  const weakPassword = await registerPost(
    jsonRequest('http://localhost/api/auth/register', 'POST', {
      fullName: 'Weak Password User',
      email: `security-weak-${unique}@example.test`,
      password: 'short',
    })
  );
  assert(weakPassword.status === 422, 'server rejects passwords shorter than 8 characters');

  // ---------------------------------------------------------------------------
  // 2. Admin authorisation is resolved from the database, not the token
  // ---------------------------------------------------------------------------
  const adminEmail = `security-admin-${unique}@example.test`;
  const adminRegistered = await AuthService.register({
    fullName: 'Security Admin',
    email: adminEmail,
    password: 'security-admin-password',
  });
  await UserRepository.update(adminRegistered.user.id, {
    roles: [SystemRole.ADMIN],
    permissions: Object.values(PermissionKey),
  });
  const adminToken = AuthService.generateToken(
    (await UserRepository.findById(adminRegistered.user.id))!
  );

  const customerEmail = `security-customer-${unique}@example.test`;
  const customer = await AuthService.register({
    fullName: 'Security Customer',
    email: customerEmail,
    password: 'security-customer-password',
  });

  const products = await ProductRepository.listProducts({ limit: 1 });
  const product = products.products[0];
  const productUrl = `http://localhost/api/admin/products/${product.id}`;

  const anonProductRead = await adminProductGet(getRequest(productUrl), { params: { id: product.id } });
  assert(anonProductRead.status === 401, 'unauthenticated admin product read is rejected');

  const customerProductRead = await adminProductGet(getRequest(productUrl, customer.token), {
    params: { id: product.id },
  });
  assert(customerProductRead.status === 403, 'a customer session cannot read admin product records');

  const adminProductRead = await adminProductGet(getRequest(productUrl, adminToken), {
    params: { id: product.id },
  });
  assert(adminProductRead.status === 200, 'an admin session can read admin product records');

  const anonSettings = await adminSettingsGet(getRequest('http://localhost/api/admin/settings'));
  assert(anonSettings.status === 401, 'unauthenticated admin settings read is rejected');

  const customerSettings = await adminSettingsGet(
    getRequest('http://localhost/api/admin/settings', customer.token)
  );
  assert(customerSettings.status === 403, 'a customer session cannot read business settings');

  // A token whose claims say "admin" but whose account is gone must be refused.
  const staleAdminToken = AuthService.generateToken({
    id: 'usr_deleted_admin',
    email: 'gone@example.test',
    fullName: 'Deleted Admin',
    passwordHash: '',
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles: [SystemRole.SUPER_ADMIN],
    permissions: [PermissionKey.MANAGE_SETTINGS],
  } as never);
  const staleSettings = await adminSettingsGet(
    getRequest('http://localhost/api/admin/settings', staleAdminToken)
  );
  assert(staleSettings.status === 401, 'a signed token for a deleted admin account is refused');

  // ---------------------------------------------------------------------------
  // 3. Settings cannot be published (or written) by accident
  // ---------------------------------------------------------------------------
  await SettingsRepository.set('RAZORPAY_KEY_SECRET', 'security-test-secret-value', true);
  const publicSettings = await SettingsRepository.getAll(true);
  assert(
    !Object.hasOwn(publicSettings, 'RAZORPAY_KEY_SECRET'),
    'credential-like settings stay out of the public settings payload'
  );

  await SettingsRepository.set('STORE_NAME', 'Sholkveda', true);
  assert(
    Object.hasOwn(await SettingsRepository.getAll(true), 'STORE_NAME'),
    'ordinary business settings remain public'
  );

  const secretWrite = await adminSettingsPost(
    jsonRequest('http://localhost/api/admin/settings', 'POST', { RAZORPAY_KEY_SECRET: 'x' }, adminToken)
  );
  assert(secretWrite.status === 422, 'payment credentials cannot be written through the settings API');

  const settingsPut = await adminSettingsPut(
    jsonRequest(
      'http://localhost/api/admin/settings',
      'PUT',
      {
        storeName: 'Sholkveda',
        gstin: '09ANCPV6879P1ZP',
        phone: '7017840020',
        email: '',
        addressLine1: 'B.H Oil Meal Road',
        addressLine2: 'Dobra Bal Colony',
        city: 'Hathras',
        state: 'Uttar Pradesh',
        postalCode: '204101',
        freeShippingThreshold: 499,
        baseShippingFee: 50,
        enableCod: true,
      },
      adminToken
    )
  );
  assert(settingsPut.status === 200, 'the business settings form (PUT) can be saved');

  // The form reads back exactly what it saved (one key vocabulary end to end).
  const saved = await SettingsRepository.getBusinessSettings();
  assert(
    saved.storeName === 'Sholkveda' &&
      saved.city === 'Hathras' &&
      saved.postalCode === '204101' &&
      saved.baseShippingFee === 50,
    'saved business settings read back through the same field names'
  );

  const settingsReadback = await adminSettingsGet(
    getRequest('http://localhost/api/admin/settings', adminToken)
  );
  const readbackBody = await readJson(settingsReadback);
  assert(
    readbackBody.data?.city === 'Hathras' && readbackBody.data?.enableCod === true,
    'the settings API returns the business profile in the form shape'
  );

  // A FREE_SHIPPING coupon waives the configured fee, not a hardcoded amount.
  await SettingsRepository.set('BASE_SHIPPING_FEE', '75', true);
  const freeShipCoupon = await couponPost(
    jsonRequest(
      'http://localhost/api/admin/coupons',
      'POST',
      {
        code: `SHIP${String(Date.now()).slice(-6)}`,
        discountType: 'FREE_SHIPPING',
        discountValue: 1,
        minOrderValue: 0,
        usageLimit: 10,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86_400_000).toISOString(),
        isActive: true,
      },
      adminToken
    )
  );
  const freeShipBody = await readJson(freeShipCoupon);
  const catalogue = await catalogProductsGet(
    getRequest('http://localhost/api/catalog/products?limit=1')
  );
  const catalogueBody = await readJson(catalogue);
  const catalogueVariant = catalogueBody.data?.products?.[0]?.variants?.[0];
  if (!catalogueVariant) throw new Error('Expected at least one catalogue variant.');
  const priced = await cartCalculatePost(
    jsonRequest('http://localhost/api/cart/calculate', 'POST', {
      items: [{ variantId: catalogueVariant.id, quantity: 1 }],
      couponCode: freeShipBody.data?.code,
    })
  );
  const pricedBody = await readJson(priced);
  assert(
    pricedBody.data?.couponDiscount === 75,
    'a free-shipping coupon waives the configured shipping fee'
  );
  await SettingsRepository.set('BASE_SHIPPING_FEE', '50', true);

  // ---------------------------------------------------------------------------
  // 4. Admin product updates are validated
  // ---------------------------------------------------------------------------
  const injectedId = await adminProductPut(
    jsonRequest(productUrl, 'PUT', { id: 'prod_hacked', name: product.name }, adminToken),
    { params: { id: product.id } }
  );
  const afterUpdate = await ProductRepository.findProductById(product.id);
  assert(
    injectedId.status === 200 && afterUpdate?.id === product.id,
    'an injected id in a product update cannot replace the record id'
  );

  // ---------------------------------------------------------------------------
  // 5. Coupon, inventory and banner input contracts
  // ---------------------------------------------------------------------------
  const legacyCoupon = await couponPost(
    jsonRequest(
      'http://localhost/api/admin/coupons',
      'POST',
      {
        code: `SECMIN${String(unique).slice(-6)}`,
        discountType: 'FLAT',
        discountValue: 50,
        minOrderAmount: 500,
        usageLimit: 2,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86_400_000).toISOString(),
        isActive: true,
      },
      adminToken
    )
  );
  const legacyCouponBody = await legacyCoupon.json();
  assert(
    legacyCoupon.status === 201 && legacyCouponBody.data?.minOrderValue === 500,
    'legacy coupon field names still store the minimum order value'
  );

  const variant = product.variants?.[0];
  if (!variant) throw new Error('Expected at least one product variant for the security checks.');
  const stockBefore = await (await import('./src/repositories/inventory.repository')).InventoryRepository.getVariantStock(variant.id);

  const badAdjust = await inventoryAdjustPost(
    jsonRequest('http://localhost/api/admin/inventory/adjust', 'POST', { variantId: variant.id, changeQty: 5 }, adminToken)
  );
  assert(badAdjust.status === 200, 'the schema field name changeQty is accepted for stock adjustments');

  const missingAdjust = await inventoryAdjustPost(
    jsonRequest('http://localhost/api/admin/inventory/adjust', 'POST', { variantId: variant.id }, adminToken)
  );
  assert(missingAdjust.status === 422, 'a stock adjustment without a quantity is rejected');

  const zeroAdjust = await inventoryAdjustPost(
    jsonRequest('http://localhost/api/admin/inventory/adjust', 'POST', { variantId: variant.id, quantityChange: 0 }, adminToken)
  );
  assert(zeroAdjust.status === 422, 'a zero-quantity stock adjustment is rejected');

  const { InventoryRepository } = await import('./src/repositories/inventory.repository');
  const stockAfter = await InventoryRepository.getVariantStock(variant.id);
  assert(
    Number.isFinite(stockAfter) && stockAfter === stockBefore + 5,
    'stock remains a valid number after adjustments (never NaN/NULL)'
  );

  const badBanner = await bannerPost(
    jsonRequest(
      'http://localhost/api/admin/cms/banners',
      'POST',
      { title: 'Unsafe banner', imageUrl: 'javascript:alert(1)', ctaLink: '/shop', isActive: true },
      adminToken
    )
  );
  assert(badBanner.status === 422, 'banners reject javascript: URLs');

  const goodBanner = await bannerPost(
    jsonRequest(
      'http://localhost/api/admin/cms/banners',
      'POST',
      { title: 'Safe banner', imageUrl: '/products/pdf-p3-i1.webp', ctaLink: '/shop', isActive: true },
      adminToken
    )
  );
  assert(goodBanner.status === 200, 'banners accept site-relative image paths');

  // ---------------------------------------------------------------------------
  // 6. Order confirmation access tokens
  // ---------------------------------------------------------------------------
  const accessToken = AuthService.generateOrderAccessToken('ord_123', 'SV-2026-12345');
  const accessPayload = AuthService.verifyOrderAccessToken(accessToken);
  assert(
    accessPayload?.orderId === 'ord_123' && accessPayload?.orderNumber === 'SV-2026-12345',
    'order access tokens round-trip for the guest confirmation page'
  );
  assert(
    AuthService.verifyOrderAccessToken(
      AuthService.generateToken({
        ...customer.user,
        passwordHash: '',
      } as never)
    ) === null,
    'a session token is not accepted as an order access token'
  );

  // ---------------------------------------------------------------------------
  // 7. Webhook payment capture completes the order
  // ---------------------------------------------------------------------------
  const prepaidOrder = await OrderRepository.createOrder(
    {
      userId: customer.user.id,
      customerName: 'Webhook Customer',
      customerEmail: customerEmail,
      customerPhone: '9812345678',
      shippingAddress: {
        id: `security-address-${unique}`,
        userId: customer.user.id,
        fullName: 'Webhook Customer',
        phone: '9812345678',
        addressLine1: '1 Security Street',
        city: 'Hathras',
        state: 'Uttar Pradesh',
        pincode: '204101',
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      billingAddress: null,
      subtotalAmount: variant.sellingPrice,
      discountAmount: 0,
      couponCode: null,
      couponDiscount: 0,
      shippingFee: 0,
      taxAmount: 0,
      totalPayableAmount: variant.sellingPrice,
      orderStatus: 'PENDING' as never,
      paymentStatus: PaymentStatus.PENDING,
      paymentGateway: PaymentGateway.RAZORPAY,
      adminNotes: null,
    },
    [
      {
        variantId: variant.id,
        productNameSnapshot: product.name,
        variantSizeSnapshot: variant.sizeLabel,
        skuSnapshot: variant.sku,
        unitPrice: variant.sellingPrice,
        quantity: 1,
        lineTotal: variant.sellingPrice,
      },
    ]
  );

  await OrderRepository.updatePayment(prepaidOrder.id, { razorpayOrderId: 'order_security_test' });
  const stockBeforeCapture = await InventoryRepository.getVariantStock(variant.id);

  const captured = await OrderService.completeWebhookPayment('order_security_test', 'pay_security_test');
  const stockAfterCapture = await InventoryRepository.getVariantStock(variant.id);

  assert(captured?.paymentStatus === PaymentStatus.PAID, 'a verified webhook capture marks the order paid');
  assert(captured?.orderStatus === 'CONFIRMED', 'a verified webhook capture confirms the order');
  assert(stockAfterCapture === stockBeforeCapture - 1, 'webhook capture decrements stock exactly once');

  const replayed = await OrderService.completeWebhookPayment('order_security_test', 'pay_security_test');
  const stockAfterReplay = await InventoryRepository.getVariantStock(variant.id);
  assert(
    replayed?.paymentStatus === PaymentStatus.PAID && stockAfterReplay === stockAfterCapture,
    'replaying the same capture event does not decrement stock twice'
  );

  assert(
    (await OrderService.completeWebhookPayment('order_unknown', 'pay_unknown')) === null,
    'an unknown Razorpay order id is ignored instead of throwing'
  );

  // ---------------------------------------------------------------------------
  // 8. Session teardown and throttling
  // ---------------------------------------------------------------------------
  const logout = await logoutPost();
  const logoutCookie = logout.cookies.get('shlokveda_session_token');
  assert(
    logout.status === 200 && logoutCookie?.value === '' && logoutCookie.maxAge === 0,
    'logout expires the session cookie'
  );

  const key = `security-test-${unique}`;
  resetRateLimit(key);
  const attempts = Array.from({ length: 10 }, () => consumeRateLimit(key, 8, 60_000));
  assert(
    attempts.slice(0, 8).every((result) => result.allowed) && attempts.slice(8).every((result) => !result.allowed),
    'the rate limiter blocks requests past the configured budget'
  );

  // ---------------------------------------------------------------------------
  // 9. Server-side admin gate (static check: the client-only gate was the bug)
  // ---------------------------------------------------------------------------
  const adminLayout = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');
  assert(
    /cookies\(\)/.test(adminLayout) && /getCurrentUser/.test(adminLayout) && !/'use client'/.test(adminLayout),
    'the admin layout authorises on the server before rendering admin data'
  );

  console.log(`\nSecurity checks: ${passed} passed, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

runSecurityChecks().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
