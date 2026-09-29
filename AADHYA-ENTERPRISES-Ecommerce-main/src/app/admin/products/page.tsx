'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Package } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success && data.data) {
        setProducts(data.data.products || []);
      }
    } catch (err) {
      console.error('Error fetching admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete formulation "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.ayurvedicFormulation?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Ayurvedic Formulations & SKUs</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage classical preparations, multi-variant weights, pricing, and AYUSH labels.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Formulation</span>
        </Link>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F3EFE6] flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter products by title, formulation type, or slug..."
          className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Package className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Formulation</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Variants & Stock</th>
                  <th className="py-3 px-4">Price Range</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((p) => {
                  const image = p.images?.find((i) => i.isPrimary)?.imageUrl || p.images?.[0]?.imageUrl || '';
                  const totalStock = p.variants?.reduce((acc, v) => acc + v.stockQuantity, 0) || 0;
                  const prices = p.variants?.map((v) => v.sellingPrice) || [0];
                  const minPrice = Math.min(...prices);
                  const maxPrice = Math.max(...prices);

                  return (
                    <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl bg-[#FAF7F2] overflow-hidden shrink-0 border border-gray-100">
                            {image ? (
                              <Image src={image} alt="" fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[10px]">🌿</div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-gray-900 block truncate max-w-[200px]">
                              {p.name}
                            </span>
                            <span className="text-[10px] text-[#B08968] font-bold uppercase">
                              {p.ayurvedicFormulation?.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-medium">
                        {p.category?.name || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900">
                          {p.variants?.length || 0} Variants
                        </span>
                        <span className={`block text-[10px] ${totalStock <= 10 ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>
                          Total Stock: {totalStock} units
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1B4332]">
                        {minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} - ₹${maxPrice}`}
                      </td>
                      <td className="py-3 px-4">
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            <XCircle className="w-3 h-3" /> Draft
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${p.id}`}
                            className="p-1.5 text-gray-500 hover:text-[#1B4332] hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Formulation"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
