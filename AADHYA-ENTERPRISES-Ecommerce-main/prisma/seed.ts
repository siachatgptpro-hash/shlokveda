// ==============================================================================
// PRISMA SEED ARCHITECTURE — SHOLKVEDA
// Seeds Official Business Info (Hathras), Super Admin, Ayurvedic Catalog & CMS
// ==============================================================================

import { db } from '../src/lib/db';
import { SettingsRepository } from '../src/repositories/settings.repository';
import { ProductRepository } from '../src/repositories/product.repository';
import { UserRepository } from '../src/repositories/user.repository';

async function main() {
  console.log('Seeding SHOLKVEDA Database...');

  // Ensure singleton DB is seeded
  db.seedInitialData();

  const businessName = await SettingsRepository.get('BUSINESS_NAME');
  const products = await ProductRepository.listProducts();
  const users = await UserRepository.listAll();

  console.log(`✓ Business Name: ${businessName}`);
  console.log(`✓ Seeded ${products.products.length} Ayurvedic Products with multi-size variants`);
  console.log(`✓ Seeded ${users.length} Users (Super Admin & Test Customer)`);
  console.log('✓ Seeding complete!');
}

main().catch((e) => {
  console.error('Seeding error:', e);
  process.exit(1);
});
