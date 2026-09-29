'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductVariant, AyurvedicFormulation } from '@/types';
import { Plus, Trash2, Save, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: { id: string; name: string }[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct;

  const [name, setName] = useState(initialProduct?.name || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || categories[0]?.id || '');
  const [ayurvedicFormulation, setAyurvedicFormulation] = useState<AyurvedicFormulation>(
    initialProduct?.ayurvedicFormulation || AyurvedicFormulation.CHURNA
  );
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [ingredients, setIngredients] = useState(initialProduct?.ingredients || '');
  const [dosage, setDosage] = useState(initialProduct?.dosage || '');
  const [benefits, setBenefits] = useState(initialProduct?.benefits || '');
  const [isBestseller, setIsBestseller] = useState(initialProduct?.isBestseller || false);
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isActive, setIsActive] = useState(initialProduct ? initialProduct.isActive : true);

  // Images
  const [primaryImageUrl, setPrimaryImageUrl] = useState(
    initialProduct?.images?.find((i) => i.isPrimary)?.imageUrl ||
      initialProduct?.images?.[0]?.imageUrl ||
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
  );
  const [secondaryImageUrl, setSecondaryImageUrl] = useState(
    initialProduct?.images?.[1]?.imageUrl || ''
  );

  // Variants Array
  const [variants, setVariants] = useState<
    {
      id?: string;
      sku: string;
      sizeLabel: string;
      weightInGrams: number;
      mrp: number;
      sellingPrice: number;
      costPrice: number;
      stockQuantity: number;
      reorderThreshold: number;
    }[]
  >(
    initialProduct?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeLabel: v.sizeLabel,
      weightInGrams: v.weightInGrams || 100,
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      costPrice: v.costPrice || Math.round(v.sellingPrice * 0.5),
      stockQuantity: v.stockQuantity,
      reorderThreshold: v.reorderThreshold || 10,
    })) || [
      {
        sku: 'HERB-100G',
        sizeLabel: '100g Jar',
        weightInGrams: 100,
        mrp: 350,
        sellingPrice: 299,
        costPrice: 150,
        stockQuantity: 50,
        reorderThreshold: 10,
      },
    ]
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto slugify
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isEditing) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
      );
    }
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        sizeLabel: '250g Jar',
        weightInGrams: 250,
        mrp: 500,
        sellingPrice: 420,
        costPrice: 200,
        stockQuantity: 30,
        reorderThreshold: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert('A product must have at least one variant.');
      return;
    }
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: string, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) return setErrorMsg('Product name is required.');
    if (!slug.trim()) return setErrorMsg('Product slug is required.');
    if (!description.trim()) return setErrorMsg('Product description is required.');

    const imagesList = [
      { imageUrl: primaryImageUrl.trim(), isPrimary: true, sortOrder: 0 },
    ];
    if (secondaryImageUrl.trim()) {
      imagesList.push({ imageUrl: secondaryImageUrl.trim(), isPrimary: false, sortOrder: 1 });
    }

    const payload = {
      name: name.trim(),
      slug: slug.trim(),
      categoryId,
      ayurvedicFormulation,
      description: description.trim(),
      ingredients: ingredients.trim() || undefined,
      dosage: dosage.trim() || undefined,
      benefits: benefits.trim() || undefined,
      isBestseller,
      isFeatured,
      isActive,
      images: imagesList,
      variants: variants.map((v) => ({
        ...v,
        mrp: Number(v.mrp),
        sellingPrice: Number(v.sellingPrice),
        costPrice: Number(v.costPrice),
        stockQuantity: Number(v.stockQuantity),
        weightInGrams: Number(v.weightInGrams),
        reorderThreshold: Number(v.reorderThreshold),
      })),
    };

    setSaving(true);

    try {
      const url = isEditing ? `/api/admin/products/${initialProduct.id}` : '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to save product');
      }

      setSuccessMsg('Ayurvedic formulation saved successfully!');
      setTimeout(() => {
        router.push('/admin/products');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving formulation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              {isEditing ? `Edit: ${initialProduct.name}` : 'New Classical Formulation'}
            </h1>
            <p className="text-xs text-gray-500">
              Hathras Botanical Pharmacopeia & Variant Architecture
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#2D6A4F] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Formulation'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN METADATA & DESCRIPTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">General Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Classical Ashwagandha Churna"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="classical-ashwagandha-churna"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Ayurvedic Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Shastriya Formulation Type *
                </label>
                <select
                  value={ayurvedicFormulation}
                  onChange={(e) => setAyurvedicFormulation(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
                >
                  <option value="AWALEHA">AWALEHA (Herbal Jam / Chyawanprash)</option>
                  <option value="CHURNA">CHURNA (Herbal Powder)</option>
                  <option value="TAILA">TAILA (Medicated Oil)</option>
                  <option value="VATI">VATI / GUTIKA (Ayurvedic Tablet)</option>
                  <option value="ASAVA_ARISHTA">ASAVA / ARISHTA (Naturally Fermented Tonic)</option>
                  <option value="GHRITA">GHRITA (Medicated Cow Ghee)</option>
                  <option value="KWATHA">KWATHA (Decoction Blend)</option>
                  <option value="BHASMA">BHASMA / RASAYANA (Classical Mineral Calx)</option>
                  <option value="LEPA">LEPA (Topical Herbal Paste)</option>
                  <option value="OTHER">OTHER Classical Preparation</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description & Classical Reference *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description, historical references, and Shastriya preparation highlights..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Herbal Ingredients & Composition
                </label>
                <textarea
                  rows={2}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="e.g. Pure Withania somnifera (Ashwagandha Root) 100%..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Dosage & Anupana
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 3-6g twice daily with warm milk"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Health Benefits & Indications
                </label>
                <input
                  type="text"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="e.g. Rasayana, Balya, Ojas builder"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          </div>

          {/* MULTI-VARIANT INVENTORY MATRIX */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900">
                  Multi-Variant SKUs & Pricing
                </h2>
                <p className="text-xs text-gray-500">
                  Define distinct packaging weights, pricing tiers, and stock limits
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-end"
                >
                  <div className="sm:col-span-2 md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Size Label
                    </label>
                    <input
                      type="text"
                      required
                      value={v.sizeLabel}
                      onChange={(e) => handleVariantChange(idx, 'sizeLabel', e.target.value)}
                      placeholder="e.g. 250g Jar"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      required
                      value={v.sku}
                      onChange={(e) => handleVariantChange(idx, 'sku', e.target.value)}
                      placeholder="SKU-01"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.mrp}
                      onChange={(e) => handleVariantChange(idx, 'mrp', Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Selling (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.sellingPrice}
                      onChange={(e) =>
                        handleVariantChange(idx, 'sellingPrice', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-bold text-[#1B4332] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.stockQuantity}
                      onChange={(e) =>
                        handleVariantChange(idx, 'stockQuantity', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Threshold
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={v.reorderThreshold}
                      onChange={(e) =>
                        handleVariantChange(idx, 'reorderThreshold', Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: MEDIA & STATUS CONTROLS */}
        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Product Media</h2>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Primary Image URL *
              </label>
              <input
                type="url"
                required
                value={primaryImageUrl}
                onChange={(e) => setPrimaryImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Secondary Image URL (Optional)
              </label>
              <input
                type="url"
                value={secondaryImageUrl}
                onChange={(e) => setSecondaryImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          {/* Visibility and Flags */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Storefront Status</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-[#1B4332] rounded focus:ring-[#1B4332]"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Published & Active</span>
                <span className="text-[10px] text-gray-500">Visible to customers in the catalog</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={(e) => setIsBestseller(e.target.checked)}
                className="w-4 h-4 text-[#1B4332] rounded focus:ring-[#1B4332]"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Mark as Bestseller</span>
                <span className="text-[10px] text-gray-500">Featured in homepage bestseller grid</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-[#1B4332] rounded focus:ring-[#1B4332]"
              />
              <div>
                <span className="text-xs font-bold text-gray-900 block">Featured Collection</span>
                <span className="text-[10px] text-gray-500">Highlighted in seasonal promotions</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
