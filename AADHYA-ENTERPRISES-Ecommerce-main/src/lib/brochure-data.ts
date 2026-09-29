// Product names, pack sizes and MRP transcribed from the supplied 16-page
// Only Ayurveda brochure. Product images are extracted from the matching PDF
// product pages. The printed packaging remains as it appears in that source.

import { AyurvedicFormulation } from '@/types';

export interface BrochureProductDef {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  skuPrefix: string;
  shortDescription: string;
  fullDescription: string;
  ingredients: string;
  benefits: string;
  usageInstructions: string;
  precautions: string;
  ayurvedicFormulation: AyurvedicFormulation;
  ayushLicenseNo: string;
  fssaiLicenseNo: string;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  variants: Array<{
    id: string;
    sku: string;
    sizeLabel: string;
    mrp: number;
    sellingPrice: number;
    costPrice: number;
    stock: number;
    isDefault: boolean;
  }>;
  images: Array<{ id: string; url: string; isPrimary: boolean; sortOrder: number }>;
}

export const BROCHURE_CATEGORIES = [
  { id: 'cat_syrups_juices', name: 'Syrups & Juices', slug: 'syrups-juices', description: 'Syrup and juice products listed in the supplied catalogue.', displayOrder: 1 },
  { id: 'cat_arks_drops', name: 'Arks & Drops', slug: 'arks-drops', description: 'Ark and drop products listed in the supplied catalogue.', displayOrder: 2 },
  { id: 'cat_herbal_oils', name: 'Herbal Oils', slug: 'herbal-oils', description: 'Herbal oils listed in the supplied catalogue.', displayOrder: 3 },
  { id: 'cat_capsules', name: 'Herbal Capsules', slug: 'herbal-capsules', description: 'Herbal capsule products listed in the supplied catalogue.', displayOrder: 4 },
  { id: 'cat_vati_gutika', name: 'Tablets', slug: 'tablets', description: 'Tablet products listed in the supplied catalogue.', displayOrder: 5 },
  { id: 'cat_daily_wellness', name: 'Daily Wellness', slug: 'daily-wellness', description: 'Daily wellness products listed in the supplied catalogue.', displayOrder: 6 },
  { id: 'cat_immunity_rasayana', name: 'Immunity & Rasayana', slug: 'immunity-rasayana', description: 'Immunity and rasayana products listed in the supplied catalogue.', displayOrder: 7 },
  { id: 'cat_personal_care', name: 'Personal Care', slug: 'personal-care', description: 'Personal-care products listed in the supplied catalogue.', displayOrder: 8 },
];

interface CatalogRow {
  name: string;
  category: string;
  packs: Array<[string, number]>;
  page: number;
  image?: string;
  ingredients?: string;
  formulation?: AyurvedicFormulation;
}

const rows: CatalogRow[] = [
  { name: 'Aloe Vera with Honey, Amla & Tulsi', category: 'cat_syrups_juices', packs: [['1 L', 585]], page: 4, image: 'pdf-p4-i9.webp', ingredients: 'Aloe vera, honey, amla and tulsi.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Aloe Vera Juice', category: 'cat_syrups_juices', packs: [['1 L', 380]], page: 4, image: 'pdf-p4-i5.webp', ingredients: 'Refer to the product label.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Amrit Ras', category: 'cat_syrups_juices', packs: [['200 ml', 160], ['1 L', 480]], page: 6, image: 'pdf-p6-i5.webp', ingredients: 'Giloy ras, papita, tulsi, adusa, darunapushpi, nagarmotha, bhramhi and harad.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Anti Diabetes', category: 'cat_syrups_juices', packs: [['1 L', 540]], page: 7, image: 'pdf-p7-i4.webp', ingredients: 'Gudmar, bhumi amla, punarnava, makoy, kasni, jamun, dalchini, vijaysar, chirata, kutki and ashwagandha.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Arjun Capsule', category: 'cat_capsules', packs: [['60 capsules', 715]], page: 13, image: 'pdf-p13-i2.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'A2 Desi Ghee', category: 'cat_daily_wellness', packs: [['1 L', 1440]], page: 15, image: 'pdf-p15-i1.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'Allicin Capsule', category: 'cat_capsules', packs: [['60 capsules', 980]], page: 14, image: 'pdf-p14-i2.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Amla Ras', category: 'cat_syrups_juices', packs: [['1 L', 380]], page: 5, image: 'pdf-p5-i2.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Ashwagandha Capsule', category: 'cat_capsules', packs: [['60 capsules', 540]], page: 12, image: 'pdf-p12-i2.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Ajwain Ark', category: 'cat_arks_drops', packs: [['30 ml', 160]], page: 3, image: 'pdf-p3-i8.webp', ingredients: 'Ajwain ark; refer to the product label for the complete composition and directions.', formulation: AyurvedicFormulation.KWATH },
  { name: 'Bhumi Punarnava', category: 'cat_syrups_juices', packs: [['1 L', 580], ['200 ml', 160]], page: 5, image: 'pdf-p5-i4.webp', ingredients: 'Bhumi amla, punarnava, makoy, kasni and anantmool.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Bhumi Amla Capsule', category: 'cat_capsules', packs: [['60 capsules', 585]], page: 12, image: 'pdf-p12-i1.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Cough Care', category: 'cat_syrups_juices', packs: [['100 ml', 70]], page: 6, image: 'pdf-p6-i10.webp', ingredients: 'Yashtimadhu, sunthi, tulsi, somlata, slesmarak, bharangi, banfsa, jufah, vibhitak, vasaka, pudina and vach; honey base.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Castor Oil', category: 'cat_herbal_oils', packs: [['100 ml', 100]], page: 10, image: 'pdf-p10-i1.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Chyawanprash Kesar Yukta', category: 'cat_immunity_rasayana', packs: [['1 kg', 880]], page: 15, image: 'pdf-p15-i3.webp', formulation: AyurvedicFormulation.AWALEHA },
  { name: 'Curcumin Capsule', category: 'cat_capsules', packs: [['60 capsules', 980]], page: 13, image: 'pdf-p13-i5.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Cumin Ark', category: 'cat_arks_drops', packs: [['30 ml', 160]], page: 3, image: 'pdf-p3-i1.webp', formulation: AyurvedicFormulation.KWATH },
  { name: 'Dento Strong', category: 'cat_personal_care', packs: [['100 g', 160]], page: 14, image: 'pdf-p15-i4.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'Detox Capsule', category: 'cat_capsules', packs: [['60 capsules', 450]], page: 9, image: 'pdf-p14-i4.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Detox Syrup', category: 'cat_syrups_juices', packs: [['500 ml', 450]], page: 13, image: 'pdf-p14-i4.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Dhamasa Capsule', category: 'cat_capsules', packs: [['60 capsules', 540]], page: 10, image: 'pdf-p13-i6.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Eye Care', category: 'cat_daily_wellness', packs: [['200 ml', 180], ['500 ml', 430], ['1 L', 850]], page: 15, image: 'pdf-p10-i10.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Flax Seeds', category: 'cat_daily_wellness', packs: [['400 g', 180]], page: 11, image: 'pdf-p15-i6.webp', formulation: AyurvedicFormulation.RAW_HERB },
  { name: 'Flax Oil', category: 'cat_herbal_oils', packs: [['100 ml', 180]], page: 9, image: 'pdf-p11-i4.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Fat Melter', category: 'cat_syrups_juices', packs: [['1 L', 1050]], page: 9, image: 'pdf-p9-i10.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Gastro Sanjivani', category: 'cat_syrups_juices', packs: [['500 ml', 380], ['200 ml', 160]], page: 5, image: 'pdf-p5-i6.webp', ingredients: 'Amaltas, nagarmotha, methi, saunf, gulab patti, mulethi, triphala, giloy, aloe vera, nishoth, sanai and indrayan.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Grape Seed Extract', category: 'cat_capsules', packs: [['60 capsules', 715]], page: 15, image: 'pdf-p11-i2.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Green Tea Tablet', category: 'cat_capsules', packs: [['60 tablets', 480]], page: 12, image: 'pdf-p15-i4.webp', formulation: AyurvedicFormulation.TABLET },
  { name: 'Gokhru Capsule', category: 'cat_capsules', packs: [['60 capsules', 540]], page: 13, image: 'pdf-p12-i3.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Gymnema Capsule', category: 'cat_capsules', packs: [['60 capsules', 540]], page: 13, image: 'pdf-p13-i3.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Gau Amrit', category: 'cat_syrups_juices', packs: [['200 ml', 160], ['500 ml', 380]], page: 8, image: 'pdf-p8-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'H.B. Booster', category: 'cat_syrups_juices', packs: [['1 L', 580], ['200 ml', 160]], page: 8, image: 'pdf-p8-i5.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Heart Re Booster', category: 'cat_syrups_juices', packs: [['500 ml', 460]], page: 6, image: 'pdf-p6-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Heart Re Booster Premium', category: 'cat_syrups_juices', packs: [['200 ml', 270]], page: 11, image: 'pdf-p6-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Heart Fit', category: 'cat_capsules', packs: [['60 capsules', 450]], page: 4, image: 'pdf-p11-i1.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'IB-9 Drop (Immunity Drops)', category: 'cat_arks_drops', packs: [['25 ml', 180]], page: 6, image: 'pdf-p4-i7.webp', formulation: AyurvedicFormulation.OTHER, ingredients: 'Mulethi, ashwagandha, giloy, curcumin, honey bee propolis, tulsi, ginger, cinnamon, neem, vitamin C and black pepper.' },
  { name: 'Joint Re-Builder Syrup', category: 'cat_syrups_juices', packs: [['500 ml', 480]], page: 6, image: 'pdf-p6-i3.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Joint Re-Builder Tablet', category: 'cat_vati_gutika', packs: [['30 tablets', 190], ['60 tablets', 380]], page: 6, image: 'pdf-p6-i2.webp', formulation: AyurvedicFormulation.TABLET },
  { name: 'Joint Re-Builder Syrup Premium', category: 'cat_syrups_juices', packs: [['500 ml', 580]], page: 6, image: 'pdf-p6-i3.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Joint Tablet Premium', category: 'cat_vati_gutika', packs: [['60 tablets', 440]], page: 6, image: 'pdf-p6-i2.webp', formulation: AyurvedicFormulation.TABLET },
  { name: 'Joint Pain Oil', category: 'cat_herbal_oils', packs: [['100 ml', 180]], page: 6, image: 'pdf-p6-i7.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Joint Pain Liniment (Oil)', category: 'cat_herbal_oils', packs: [['75 ml', 210]], page: 6, image: 'pdf-p6-i7.webp', formulation: AyurvedicFormulation.TAILA, ingredients: 'Sesame oil, flax oil, wintergreen oil, eucalyptus oil, ajwain oil, camphor oil, turpentine oil, peppermint oil, boswellia oil and turmeric oil.' },
  { name: 'Kalonji Oil', category: 'cat_herbal_oils', packs: [['100 ml', 160]], page: 10, image: 'pdf-p10-i1.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Kidney Reactivator', category: 'cat_syrups_juices', packs: [['500 ml', 570]], page: 8, image: 'pdf-p8-i3.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Kwach Capsule', category: 'cat_capsules', packs: [['30 capsules', 460]], page: 11, image: 'pdf-p11-i3.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Lipid Care', category: 'cat_syrups_juices', packs: [['200 ml', 220]], page: 4, image: 'pdf-p4-i10.webp', ingredients: 'Bhringraj, kasni, sarpunkha, bhumi amla, aloe vera, haritaki, punarnava, kalmegh, giloy, kutki, papaya, saunth, ajwain, marich, syonak, amla, arjuna, brahmi, adrak, ashwagandha, sarpgandha, guggul, shankhpushpi, allicin and pushkarmool.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Lungs Cleaner', category: 'cat_syrups_juices', packs: [['500 ml', 715], ['200 ml', 315]], page: 9, image: 'pdf-p9-i10.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Liv CA Capsule', category: 'cat_capsules', packs: [['60 capsules', 360]], page: 14, image: 'pdf-p14-i1.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Liver Reactivator', category: 'cat_syrups_juices', packs: [['500 ml', 380], ['200 ml', 160]], page: 5, image: 'pdf-p5-i1.webp', ingredients: 'Bhringraj, kasni, sarpunkha, bhumi amla, aloe vera, haritaki, punarnava, kalmegh, giloy, kutki, papaya, saunth, ajwain, marich and syonak.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Memory Booster', category: 'cat_syrups_juices', packs: [['1 L', 580], ['200 ml', 160]], page: 7, image: 'pdf-p7-i3.webp', ingredients: 'Brahmi, semal, niacin, shankhpushpi, yashtimadhu, ashwagandha, jatamasi, vach, tagar, malkangni and sarpgandha.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Miracle Roots', category: 'cat_syrups_juices', packs: [['500 ml', 580]], page: 7, image: 'pdf-p7-i1.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Musheal Capsule', category: 'cat_capsules', packs: [['60 capsules', 630]], page: 14, image: 'pdf-p14-i6.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Migraine Care', category: 'cat_syrups_juices', packs: [['200 ml', 190], ['500 ml', 460], ['1 L', 920]], page: 10, image: 'pdf-p10-i5.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Neem Oil', category: 'cat_herbal_oils', packs: [['100 ml', 180]], page: 11, image: 'pdf-p11-i5.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Neuro Care', category: 'cat_syrups_juices', packs: [['500 ml', 450]], page: 8, image: 'pdf-p8-i1.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Noni', category: 'cat_syrups_juices', packs: [['500 ml', 390], ['1 L', 690]], page: 8, image: 'pdf-p8-i2.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Neem Capsule', category: 'cat_capsules', packs: [['60 capsules', 450]], page: 12, image: 'pdf-p12-i4.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'PC-9 (Piles Care)', category: 'cat_syrups_juices', packs: [['1 L', 960], ['200 ml', 190]], page: 9, image: 'pdf-p9-i9.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Punarnava Capsule', category: 'cat_capsules', packs: [['60 capsules', 980]], page: 12, image: 'pdf-p12-i6.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Purush Rasayan', category: 'cat_syrups_juices', packs: [['1 L', 1350]], page: 9, image: 'pdf-p3-i4.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Panch Tulsi', category: 'cat_arks_drops', packs: [['30 ml', 120]], page: 3, image: 'pdf-p3-i3.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'Power Tulsi', category: 'cat_arks_drops', packs: [['25 ml', 180]], page: 3, image: 'pdf-p3-i7.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'PR Drops', category: 'cat_arks_drops', packs: [['25 ml', 190]], page: 3, image: 'pdf-p3-i4.webp', ingredients: 'Ashwagandha, ginseng, safed musli, maca root, horny goat weed, tongkat ali, akarkara, cordyceps and honey.', formulation: AyurvedicFormulation.OTHER },
  { name: 'Renal Fit Capsule', category: 'cat_capsules', packs: [['60 capsules', 540]], page: 11, image: 'pdf-p11-i6.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Resurrection Capsule', category: 'cat_capsules', packs: [['60 capsules', 1890]], page: 14, image: 'pdf-p14-i5.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Saunf Ark', category: 'cat_arks_drops', packs: [['30 ml', 160]], page: 3, image: 'pdf-p3-i2.webp', formulation: AyurvedicFormulation.KWATH },
  { name: 'Skin Ark', category: 'cat_syrups_juices', packs: [['500 ml', 580]], page: 4, image: 'pdf-p4-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Skin Oil', category: 'cat_herbal_oils', packs: [['100 ml', 480]], page: 4, image: 'pdf-p4-i6.webp', formulation: AyurvedicFormulation.TAILA },
  { name: 'Stone Away', category: 'cat_syrups_juices', packs: [['200 ml', 160]], page: 6, image: 'pdf-p6-i4.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Stri Sanjivani', category: 'cat_syrups_juices', packs: [['1 L', 480], ['200 ml', 160]], page: 7, image: 'pdf-p7-i5.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Sarva Dhatu Pushti', category: 'cat_immunity_rasayana', packs: [['400 g', 1170]], page: 15, image: 'pdf-p15-i1.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'Sea Buckthorn Capsule', category: 'cat_capsules', packs: [['60 capsules', 760]], page: 13, image: 'pdf-p13-i1.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Shatawari Capsule', category: 'cat_capsules', packs: [['60 capsules', 715]], page: 12, image: 'pdf-p12-i5.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Silymarine Milk Thistle Capsule', category: 'cat_capsules', packs: [['60 capsules', 720]], page: 14, image: 'pdf-p14-i3.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Spirulina Capsule', category: 'cat_capsules', packs: [['60 capsules', 715]], page: 13, image: 'pdf-p13-i4.webp', formulation: AyurvedicFormulation.CAPSULE },
  { name: 'Stevia Drop', category: 'cat_arks_drops', packs: [['25 ml', 180]], page: 15, image: 'pdf-p3-i5.webp', formulation: AyurvedicFormulation.OTHER },
  { name: 'Sugar Normal', category: 'cat_syrups_juices', packs: [['500 ml', 585]], page: 7, image: 'pdf-p7-i2.webp', ingredients: 'Shyam tulsi, papaya leaf, periwinkle leaf, wheat leaf, noni fruit, Indian rhubarb, turmeric, ginger, punarnava root, lemon chaff, ashwagandha, mulethi, kalonji seed, kachnar, dalchini and green tea.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Thyro Booster', category: 'cat_syrups_juices', packs: [['500 ml', 480]], page: 7, image: 'pdf-p7-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Triphala Ras', category: 'cat_syrups_juices', packs: [['500 ml', 270]], page: 5, image: 'pdf-p5-i3.webp', ingredients: 'Amla, behra and harad.', formulation: AyurvedicFormulation.SYRUP },
  { name: '19 Berries', category: 'cat_syrups_juices', packs: [['500 ml', 1170]], page: 8, image: 'pdf-p8-i4.webp', ingredients: 'Grape seed, acai berry, blueberry, cranberry, blackberry, gooseberry, raspberry, strawberry, mulberry, dewberry, bayberry, bilberry, bearberry, crowberry, goji berry, elderberry, sea buckthorn, green tea, ginseng, ganoderma and mangosteen.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Triphala Ashtamrit', category: 'cat_syrups_juices', packs: [['500 ml', 380]], page: 5, image: 'pdf-p5-i5.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Wheat Grass with Moringa', category: 'cat_syrups_juices', packs: [['1 L', 585]], page: 10, image: 'pdf-p10-i6.webp', ingredients: 'Wheat grass, aloe vera and moringa.', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Wheat Grass', category: 'cat_syrups_juices', packs: [['500 ml', 280], ['1 L', 580]], page: 10, image: 'pdf-p10-i6.webp', formulation: AyurvedicFormulation.SYRUP },
  { name: 'Wonder Berries', category: 'cat_syrups_juices', packs: [['500 ml', 970]], page: 9, image: 'pdf-p9-i11.webp', formulation: AyurvedicFormulation.SYRUP },
];

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const BROCHURE_PRODUCTS: BrochureProductDef[] = rows.map((row, index) => {
  const slug = slugify(row.name);
  const id = `pdf_${slug.replace(/-/g, '_')}`;
  const variants = row.packs.map(([sizeLabel, mrp], variantIndex) => {
    const sizeSlug = slugify(sizeLabel).replace(/-/g, '');
    const variantId = `pdfv_${slug.replace(/-/g, '_')}_${sizeSlug}`;
    return {
      id: variantId,
      sku: `SV-${String(index + 1).padStart(3, '0')}-${String(variantIndex + 1).padStart(2, '0')}`,
      sizeLabel,
      mrp,
      sellingPrice: mrp,
      costPrice: 0,
      stock: 25,
      isDefault: variantIndex === 0,
    };
  });
  const sizeSummary = row.packs.map(([size]) => size).join(' / ');
  return {
    id,
    categoryId: row.category,
    name: row.name,
    slug,
    skuPrefix: `SV-${String(index + 1).padStart(3, '0')}`,
    shortDescription: `Pack size: ${sizeSummary}. Listed in the supplied brochure on page ${row.page}.`,
    fullDescription: `${row.name} is listed in the supplied product brochure on page ${row.page}. Pack size and printed MRP are transcribed from that source. See the original product label for complete product information.`,
    ingredients: row.ingredients || 'Composition is not transcribed here. Please refer to the product packaging.',
    benefits: 'No additional therapeutic claims are made on this page. Please read the product label and consult a qualified healthcare professional.',
    usageInstructions: 'Follow the directions printed on the product label or the advice of a qualified healthcare professional.',
    precautions: 'This product information is not medical advice. Consult a qualified healthcare professional before use, especially if pregnant, nursing, taking medication or managing a health condition.',
    ayurvedicFormulation: row.formulation || (row.category === 'cat_capsules' ? AyurvedicFormulation.CAPSULE : row.category === 'cat_herbal_oils' ? AyurvedicFormulation.TAILA : row.category === 'cat_arks_drops' ? AyurvedicFormulation.OTHER : AyurvedicFormulation.SYRUP),
    ayushLicenseNo: '',
    fssaiLicenseNo: '',
    isFeatured: index < 8,
    isBestseller: false,
    isNewArrival: false,
    variants,
    images: row.image ? [{ id: `pdfimg_${slug.replace(/-/g, '_')}`, url: `/products/${row.image}`, isPrimary: true, sortOrder: 0 }] : [],
  };
});

// The brochure's printed price list contains 95 line entries; rows represent
// deduplicated products and variants are the separate pack-size options.
export const PDF_CATALOG_ENTRY_COUNT = 95;
