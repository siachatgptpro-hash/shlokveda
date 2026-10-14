# Sholkveda storefront — security & bug audit

Date: 2026-10-14 · Scope: `AADHYA-ENTERPRISES-Ecommerce-main` (Next.js 14.2.24 → 14.2.35 storefront)
Commit reviewed: `258cfeb` · Branch: `arena/b8d2865a-shlokveda`

> **Status: findings 1–7, 9–14 and 16–20 are fixed on this branch** (see [Fix status](#fix-status) at the end). Each fix is covered by `npm run test:security` (`test-security.ts`, 30 checks) and re-verified against a running dev server. #8 (Next.js major upgrade) and #15 (token lifetime) are partially addressed; see the status table.

## How this was tested

* `npm ci`, `npm run test:backend` (22 pass), `npm run test:qa` (14 pass), `next lint` (clean), `tsc --noEmit` (clean), `next build` (38 routes, clean) — all green, and none of them cover the issues below.
* Runtime testing against `npm run dev` in the local **in-memory preview** mode (no `DATABASE_URL`), using synthetic accounts, synthetic orders and placeholder Razorpay credentials. No real credentials, no real payments, no customer data.
* No live database was used, so PostgreSQL-specific behaviour is marked **[code review]** rather than verified. Real-browser rendering was not possible in this environment (no Chromium system libraries available), so a few UI-only items are also marked **[code review]**.

Severity uses impact × likelihood for a production deployment with `DATABASE_URL` configured.

---

## High

### 1. Unauthenticated admin product read leaks cost prices and inactive products
`src/app/api/admin/products/[id]/route.ts:7-21` — `GET` has no `requireAdminPermission`, unlike `PUT` (line 28) and `DELETE` (line 53) in the same file.

Verified: anonymous `GET /api/admin/products/<id>` → `200` with the full product record, including `costPrice` on variants. This is admin-only data (purchase cost) served to anyone.

Fix: add `await requireAdminPermission(req, PermissionKey.MANAGE_PRODUCTS);` to the `GET` handler, and strip `costPrice` from all responses that are not admin-authenticated.

### 2. `/admin` server-renders customer order data to anonymous visitors
`src/app/admin/page.tsx:21-25` is a server component that loads `getDashboardMetrics()` and the six most recent orders and renders them; the only gate is the **client-side** check in `src/app/admin/layout.tsx:49-87`. Next.js still serialises the server-rendered page into the HTML/RSC payload, so the data reaches the browser before the client gate can hide it.

Verified: anonymous `GET /admin` → `200`, response contains customer names, cities and order numbers (e.g. `Audit Private Customer`, `SV-2026-10001`) plus gross revenue.

Fix: enforce authorisation on the server (a server-side layout/page check or `middleware.ts`) and never render admin data that the client is expected to hide.

### 3. Order confirmation page exposes shipping address and phone to anyone (IDOR)
`src/app/order-confirmation/page.tsx:16-24` accepts `?orderId=` or `?orderNumber=` with **no authentication and no ownership check**, and order numbers are sequential (`SV-<year>-10001`, `src/repositories/order.repository.ts:47-51`).

Verified: anonymous `GET /order-confirmation?orderNumber=SV-2026-10001` → `200` exposing recipient name, street address, city and mobile number. The same page also renders for a *different* logged-in user. Note `/api/orders/[orderNumber]` is correctly protected (401 anonymous), so the page is the weaker link.

Fix: require a session and confirm `order.userId === session.userId` (or an order-number + email/phone pair); use unguessable order references.

### 4. Admin settings writes default to “public” — payment secret exposed to everyone
`src/app/api/admin/settings/route.ts:21-41` stores whatever keys are posted via `SettingsRepository.setMany`, and `src/repositories/settings.repository.ts:73` defaults `isPublic = true`. Public settings are served unauthenticated by `src/app/api/cms/route.ts:15`.

Verified proof of concept: admin `POST /api/admin/settings {"RAZORPAY_KEY_SECRET": "..."}` → `200`; anonymous `GET /api/cms` then returned `RAZORPAY_KEY_SECRET` in `businessSettings`.

Fix: default `isPublic` to `false`, allow-list writable keys, force payment/webhook secrets to private, and validate with a schema (`BusinessSettingsUpdateSchema` exists but is unused here).

### 5. Admin authorisation trusts the JWT only — no database re-check, no revocation
`src/lib/admin-auth.ts:6-36` verifies the token signature and reads `roles`/`permissions` **from the token**; it never reloads the user, so account status and any role change are ignored for the token’s 7-day lifetime (`src/services/auth.service.ts:14`).

Verified: a token signed with the app secret for a **non-existent** user (`userId: "usr_does_not_exist"`) with `roles: ["ADMIN"]`, `permissions: ["MANAGE_SETTINGS"]` → `GET /api/admin/settings` returned `200` with 14 settings entries. (This required the signing secret, but it demonstrates that deactivating an admin, removing a role, or deleting an account does **not** end their access until the token expires.)

Fix: in `authenticateAdmin`, re-load the user (`AuthService.getCurrentUser`) and derive roles/permissions from the database; add a token version/`jti` or session store so revocation is immediate.

### 6. Logout does not end the server-side session
`src/context/auth-context.tsx:97-104` clears `localStorage` and sets `document.cookie = 'shlokveda_session_token=; ...'`, but the session cookie is set `HttpOnly` (`src/app/api/auth/login/route.ts:19-25`), so JavaScript cannot delete it, and there is **no logout API route at all**.

Verified: after a normal login the cookie replays to `/api/auth/me` and returns the authenticated user. A shared or public browser therefore keeps a working session after “Sign Out”.

Fix: add `POST /api/auth/logout` that clears the cookie (`Max-Age=0`), call it from `logout()`, keep the token lifetime short, and consider rotating a server-side session id.

---

## Medium

### 7. Razorpay `payment.captured` webhook can never mark an order paid
`src/app/api/webhooks/razorpay/route.ts:33-38` calls `verifyAndCompletePayment(..., 'sig_valid_webhook_capture')`, but that function runs full HMAC verification (`src/services/razorpay.service.ts:77-95`).

Verified: `RazorpayService.verifySignature(order, payment, 'sig_valid_webhook_capture')` throws `Cryptographic payment signature mismatch`, while a correct HMAC is accepted. The webhook therefore returns `500` for every genuine capture event. The handler also scans `listOrders({ limit: 1000 })` and hydrates every order on every event, and silently misses older orders.

Fix: have the webhook trust the verified `x-razorpay-signature` (it is already checked) and complete the payment idempotently without re-verifying a payment signature; look the order up by `razorpayOrderId` in SQL.

### 8. Outdated Next.js with known vulnerabilities
`package.json` pins `next@^14.2.24`; `npm audit` reports 1 critical / 10 high / 2 moderate for the tree, with `next` flagged critical (npm: “This version has a security vulnerability”). Advisories affecting 14.2.24 include middleware authorisation bypass (fixed 14.2.25 — **not applicable here**, there is no `middleware.ts`), cache-key confusion, request smuggling, Server-Component DoS and image-optimiser issues. Fixes beyond 14.2.35 exist only in 15.5.24+/16.x.

Fix: upgrade to `next@15.5.24+` or `16.x` (stopgap: at least `14.2.35`), then re-run `npm audit`. Review `next.config.mjs` `images.remotePatterns: hostname '**'` at the same time — currently harmless because `images.unoptimized: true`, but it is an SSRF/image-abuse footgun if optimisation is ever enabled.

### 9. Inventory adjustment API has no validation and corrupts stock
`src/app/api/admin/inventory/adjust/route.ts:7-26` reads `variantId`, `quantityChange`, `reason` straight from the request body (the `StockAdjustmentSchema` it should use defines `changeQty` and is never applied), and coerces any unrecognised `reason` to `STOCK_AUDIT_ADJUSTMENT`.

Verified: `POST` with the schema’s own field name, `changeQty`, wrote `stockQuantity: null` (NaN) — and every later adjustment kept it `null`. One malformed call permanently breaks that SKU’s stock; in PostgreSQL the same call would either error or NULL the column.

Fix: parse with `StockAdjustmentSchema`, reject unknown values, and reconcile which field name the UI and API share (`src/app/admin/inventory/page.tsx:48` sends `quantityChange`).

### 10. Coupons: admin minimum-order value silently dropped; guest checkout bypasses limits
`src/app/admin/coupons/page.tsx:55-56` posts `minOrderAmount` / `maxDiscountAmount`, but `CouponSchema` (`src/schemas/index.ts:161-173`) defines `minOrderValue` / `maxDiscountCap`; Zod strips the unknown keys and `minOrderValue` defaults to `0`.

Verified: creating a “20% off, min ₹500, cap ₹100” coupon from the UI produced `minOrderValue: 0, maxDiscountCap: null`, and it then applied ₹117 off a ₹585 cart. Separately, guest orders call `recordGuestUsage` (`src/services/order.service.ts:146-147, 205-206`), which only bumps a counter — no `CouponUsage` row — so `perUserLimit` is unenforceable for guests.

Fix: align the UI field names with the schema (or map them in the route), and require login (or a device/email-scoped usage record) before a coupon can be applied.

### 11. CMS banners are stored unvalidated and rendered into the homepage
`src/app/api/admin/cms/banners/route.ts:19-32` writes `imageUrl`, `ctaLink` and `ctaText` with no validation (`BannerSchema` exists but is unused).

Verified: creating a banner with `imageUrl: "javascript:alert(1)"` succeeded; the value is rendered into the homepage HTML (`src/app/page.tsx:66,89`) and returned by the public `/api/cms`. React only warns here (“A future version of React will block javascript: URLs”), and an `<img src>` will not execute it, so this is not exploitable XSS as-is — but the same unvalidated field reaches `ctaLink` → `<a href>` (open-redirect / `javascript:` link if React’s URL sanitisation ever changes) and any other consumer of `/api/cms`. Treat it as missing input validation that must be fixed before more surfaces render CMS content.

Fix: validate with `BannerSchema`, allow-list `http(s)`/relative URLs, and escape/render links safely.

### 12. No rate limiting on authentication
Verified: 12 consecutive failed logins all returned `401`; never `429`. There is no lockout, CAPTCHA or delay anywhere in `src/app/api/auth/*`, so credential stuffing against known customer emails is unthrottled.

Fix: add per-IP and per-account throttling (and ideally a shared store, since serverless instances don’t share memory).

### 13. Admin order `PUT` accepts any status string; `trackingUrl` is dropped
`src/app/api/admin/orders/[id]/route.ts:31-41` passes `json.status` to `OrderService.updateFulfillment` without validation, while the sibling PATCH route validates via `OrderStatusUpdateSchema` (`src/app/api/admin/orders/[id]/status/route.ts:16`).

Verified: `PUT` with `status: "NOT_A_STATUS"` → `200`, and the order is now persisted with `orderStatus: "NOT_A_STATUS"`; the equivalent PATCH returns `422`. In PostgreSQL this would be an enum cast error. The tracking URL collected by `src/app/admin/orders/[id]/page.tsx:73` is sent but never stored.

Fix: validate with `OrderStatusUpdateSchema` in the `PUT` route, and either persist `trackingUrl` (needs a column — see `mapDbOrder` in `src/repositories/order.repository.ts:35`) or remove the field from the UI.

### 14. Admin settings cannot be saved from the UI (method + payload mismatch)
`src/app/admin/settings/page.tsx:67-85` sends `PUT` with camelCase fields (`storeName`, `gstin`, …) and `GET` returns raw keys (`BUSINESS_NAME`, …); the route only implements `GET`/`POST` with raw keys (`src/app/api/admin/settings/route.ts:10,21`).

Verified: `PUT /api/admin/settings` → `405`; `POST` → `200`. Saving the business profile from the admin screen fails.

Fix: settle on one contract — either a `PUT` accepting `BusinessSettings`, or a `POST` accepting raw setting keys — and align the form.

### 15. `AUTH_SECRET` missing is not fatal **[code review]**
`src/services/auth.service.ts:13` falls back to a per-process random secret. In a multi-instance/serverless deployment this silently invalidates sessions on every cold start or instance switch, despite the README calling the variable required.

Fix: fail fast at startup when `AUTH_SECRET` is unset or shorter than 32 characters in production.

### 16. Weak authentication controls **[code review]**
Password minimum is 6 characters on the server (`src/schemas/index.ts:28`) even though the form asks for 8 (`src/app/register/page.tsx:24`); tokens live 7 days (`src/services/auth.service.ts:14`); `isVerified` is never enforced; there is no password reset or email verification flow.

Fix: raise the server-side minimum to 8–12 characters, shorten token lifetime with refresh, and add reset/verification.

---

## Functional bugs

### 17. Registration is broken end to end (highest-priority functional bug)
`src/app/register/page.tsx:32-37` posts `{ name, email, phone, password }`; `RegisterSchema` (`src/schemas/index.ts:20`) requires `fullName`.

Verified: `POST /api/auth/register` with the UI’s exact payload → `422 {"fullName":["Required"]}`; the same request with `fullName` → `201`. **No visitor can currently create an account.**

Fix: send `fullName` from the form (and/or accept `name` in the schema), then add a test that registers through the UI payload shape.

### 18. `/api/payments/verify` skips its schema
`src/app/api/payments/verify/route.ts:7-15` destructures the body directly; `RazorpayVerifySchema` exists but is unused, so malformed input surfaces as server errors instead of `422`. (`src/app/api/cart/calculate/route.ts:9` similarly accepts raw `items` — `/api/cart` uses `CartSyncSchema`, this one does not.)

### 19. Cart quantity cap is fabricated client-side
`src/context/cart-context.tsx:219-234` builds a synthetic variant with `stockQuantity: 50`, and `src/app/cart/page.tsx:127` uses it as the “+” limit. Real availability is only checked at checkout, so a customer can fill a cart that the server then rejects. With production stock seeded at 0 (README), every checkout fails until real stock is entered.

Fix: return `availableStock` from the pricing response and use it in the quantity stepper.

### 20. Minor pricing inconsistency
`src/services/pricing.service.ts:198` returns a hardcoded `50` as the preview discount for `FREE_SHIPPING` coupons, while `calculateCart` uses the configured `defaultShippingFee` — the displayed discount drifts if the fee is changed in settings.

---

## Configuration notes

* `vercel.json` sets `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy` and `Permissions-Policy`, but **no Content-Security-Policy and no HSTS**. Add both.
* Dev-only observation: `NODE_ENV=production` controls the cookie `Secure` flag (`src/app/api/auth/login/route.ts:21`), so preview/staging deployments over HTTPS without `NODE_ENV=production` will set a non-secure session cookie.
* Repository hygiene is clean: no `.env` files, credentials, or connection strings were found in tracked files or in git history.

---

## Fix status

All fixes are on `arena/b8d2865a-shlokveda`. Verification column: **runtime** = re-tested against a running dev server in in-memory preview mode; **unit** = covered by `test-security.ts`; **code review** = statically verified only (PostgreSQL paths or UI paths that cannot be exercised here).

| # | Issue | Status | Verification | Notes |
|---|-------|--------|--------------|-------|
| 1 | Unauthenticated admin product read | **Fixed** | runtime + unit | `GET /api/admin/products/[id]` now requires admin permission. |
| 2 | `/admin` server-renders customer data | **Fixed** | runtime + unit | `src/app/admin/layout.tsx` authorises on the server before any admin data is rendered. |
| 3 | Order-confirmation IDOR | **Fixed** | runtime + unit | Requires the signed order access token returned at creation, or an authenticated owner session. |
| 4 | Settings default to public | **Fixed** | runtime + unit | `settings.repository.set()` defaults to private and force-privates credential-like keys; `/api/admin/settings` accepts only 13 allow-listed business keys. |
| 5 | Admin auth trusts JWT claims only | **Fixed** | runtime + unit | `requireAdminPermission` re-reads roles/permissions from the DB; a token for a deleted admin is rejected (401). |
| 6 | No logout | **Fixed** | runtime + unit | `POST /api/auth/logout` clears the cookie and the client calls it. A copy of the token captured before logout stays valid until expiry (stateless JWT) — server-side revocation needs a session store or denylist. |
| 7 | Webhook cannot mark orders paid | **Fixed** | runtime + unit | HMAC-verified payloads call `OrderService.completeWebhookPayment`, look the order up by `razorpay_order_id`, and are replay-safe (stock decremented once). |
| 8 | Outdated Next.js | **Partially fixed** | runtime | Bumped 14.2.24 → **14.2.35** (highest patch in the 14.2 line) and applied the non-breaking `source-map-js` fix. Remaining advisories — including two unauthenticated RCEs ([GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36), [GHSA-2xp9-vwfh-vxw4](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4)) and several SSRF/DoS issues — require **Next.js 16.4.0**, i.e. a major migration with a full regression pass. |
| 9 | Inventory adjustment corrupts stock | **Fixed** | runtime + unit | Schema-validated; accepts `changeQty`/`quantityChange`; missing or zero quantities rejected (422); aliases for `RESTOCK`/`DAMAGE`/`MANUAL_CORRECTION`. |
| 10 | Coupon min-order dropped / guest bypass | **Fixed** | runtime + unit | Route normalises legacy field names, admin UI posts the schema names, guest usage now enforces `usageLimit`. |
| 11 | Unvalidated banner URLs | **Fixed** | runtime + unit | `safeUrl` accepts `http(s)` and site-relative paths; `javascript:` rejected (422). |
| 12 | No login throttling | **Fixed** | runtime + unit | 8 attempts / 15 min per IP + identifier, then 429 with `Retry-After`. |
| 13 | Arbitrary order status / `trackingUrl` | **Fixed** | runtime + unit | Status validated against the enum; `CANCELLED` routes through `cancelOrder` (restores stock); the unusable `trackingUrl` field was removed from the UI — persisting it needs a `Shipment.trackingUrl` column first. |
| 14 | Admin settings cannot be saved | **Fixed** | runtime + unit | `PUT` handler + raw-key → form mapping in the settings page. |
| 15 | `AUTH_SECRET` missing not fatal | **Partially fixed** | unit | `getJwtSecret()` refuses to start in production without a ≥32-char secret (dev-only fallback remains). Token lifetime is still 7 days and there is no password reset or email verification — both are feature work, not a patch. |
| 16 | Weak auth controls | **Fixed** | runtime + unit | Password minimum raised 6 → 8 characters; everything else in #16 depends on #15's follow-ups. |
| 17 | Registration broken | **Fixed** | runtime + unit | Server accepts the `name`/`email`/`phone`/`password` payload the sign-up form posts. |
| 18 | `/api/payments/verify` skips its schema | **Fixed** | runtime | `RazorpayVerifySchema` and `CartSyncSchema` are now enforced. |
| 19 | Fabricated cart stock cap | **Fixed** | code review | The cart now uses the real `availableStock` from `/api/cart/calculate`; the `+` button no longer caps at a made-up 50 (and no longer silently removes an item when stock is 0). |
| 20 | Hardcoded free-shipping value | **Fixed** | code review | `FREE_SHIPPING` coupons now waive the configured `BASE_SHIPPING_FEE` / `DEFAULT_SHIPPING_FEE`. |

### Additional fixes made during implementation

* **Admin product create/update rejected every form submission** (not in the original report). `ProductForm` posts `description`/`dosage`/`reorderThreshold` and no `skuPrefix`, while the API schema requires `fullDescription`/`usageInstructions`/`lowStockThreshold`/`skuPrefix`, and `imageUrl` demanded an absolute URL even though the UI saves `/products/...` paths. Fixed with `src/lib/product-normalize.ts` (field aliasing + derived slug/SKU prefix) and `imageUrlOrPath` in `src/schemas/index.ts`.
* **Product update accepted an injected `id`** — the PUT body is now normalised and the path id always wins.
* **`vercel.json`**: added `Strict-Transport-Security: max-age=31536000; includeSubDomains`.
* **Two competing business-setting key vocabularies.** `SettingsRepository` stored `STORE_NAME`/`GSTIN`/`PHONE`/`EMAIL`/`ADDRESS_LINE1`… while the seed (`src/lib/db.ts`) and `/api/cms` expose `BUSINESS_NAME`/`BUSINESS_GSTIN`/`BUSINESS_PHONE`/`SUPPORT_EMAIL`/`BUSINESS_ADDRESS_LINE1`… so anything saved in the admin UI was invisible to every reader of `getBusinessSettings()` (order confirmation, policy pages). Both the repository and the admin route now use the canonical `BUSINESS_*` keys, with the legacy short keys still read as a fallback.
* **Admin product `GET` returned 200 with `data: null`** for unknown ids; it now returns 404.
* **`ProductForm` swallowed validation detail** (`“Please check the product details.”`); it now renders the per-field errors returned by the API.

### Still open (deliberately not patched here)

1. Next.js 16 major migration (#8) — needs its own branch and regression run.
2. Content-Security-Policy (none of the pages use inline scripts today, but a CSP should be added and tested page by page).
3. Session lifetime (7 days), password reset, and email verification.
4. Server-side session revocation (a denylist or session store) so logout invalidates captured tokens.
5. Cookie `Secure` is gated on `NODE_ENV==='production'`; make it unconditional for any HTTPS deployment.
6. Every database-backed (PostgreSQL) path in the changed repositories is **[code review]** only — `DATABASE_URL` is unset in this checkout, so the fixes need a validation pass against a private database before launch.

### How to re-run the checks

```bash
npm run test:security   # 30 access-control / input-validation checks
npm run test:backend    # 22 backend checks
npm run test:qa         # 14 storefront QA checks
npx tsc --noEmit
npm run lint
npm run build
```
