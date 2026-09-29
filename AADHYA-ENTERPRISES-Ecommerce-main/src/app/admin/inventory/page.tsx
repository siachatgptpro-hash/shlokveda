'use client';

import React, { useState, useEffect } from 'react';
import { ProductVariant } from '@/types';
import { Boxes, Plus, Minus, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function InventoryLedgerPage() {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState<'RESTOCK' | 'DAMAGE' | 'MANUAL_CORRECTION'>('RESTOCK');
  const [adjusting, setAdjusting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchVariants = async () => {
    try {
      const res = await fetch('/api/admin/inventory');
      const data = await res.json();
      if (data.success && data.data) {
        setVariants(data.data.variants || []);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVariants();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setAdjusting(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantityChange: adjustReason === 'DAMAGE' ? -Math.abs(adjustQty) : Math.abs(adjustQty),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to adjust stock');
      }

      setMsg({ type: 'success', text: `Stock updated successfully for SKU ${selectedVariant.sku}` });
      setSelectedVariant(null);
      await fetchVariants();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error updating stock' });
    } finally {
      setAdjusting(false);
    }
  };

  const filteredVariants = variants.filter(
    (v) =>
      v.sku.toLowerCase().includes(search.toLowerCase()) ||
      v.sizeLabel.toLowerCase().includes(search.toLowerCase()) ||
      (v.product?.name || v.productName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Real-Time Inventory & Ledger
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Atomic database-enforced stock tracking with immutable ledger auditing.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>Zero Overselling Guarantee Active</span>
        </div>
      </div>

      {msg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-medium flex items-center gap-2 ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {msg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F3EFE6] flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by SKU, variant size, or formulation title..."
          className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading ledger...</div>
        ) : filteredVariants.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No SKUs matching search.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Formulation</th>
                  <th className="py-3 px-4">Size & Weight</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Adjust Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVariants.map((v) => {
                  const isLow = v.stockQuantity <= (v.reorderThreshold || 10);
                  const isOut = v.stockQuantity <= 0;

                  return (
                    <tr key={v.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">{v.sku}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{v.product?.name}</td>
                      <td className="py-3 px-4 text-gray-600">{v.sizeLabel}</td>
                      <td className="py-3 px-4 font-bold text-base text-gray-900">
                        {v.stockQuantity}
                      </td>
                      <td className="py-3 px-4 text-gray-500">{v.reorderThreshold || 10}</td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-700">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedVariant(v);
                            setAdjustQty(10);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#F3EFE6] text-[#1B4332] hover:bg-[#1B4332] hover:text-white font-bold text-xs transition-colors"
                        >
                          Modify Stock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADJUST STOCK MODAL */}
      {selectedVariant && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6]">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="font-serif text-lg font-bold text-gray-900">
                Adjust Stock: {selectedVariant.sku}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedVariant.product?.name} ({selectedVariant.sizeLabel})
              </p>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Adjustment Reason
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white"
                >
                  <option value="RESTOCK">RESTOCK (Warehouse Batch Received in Hathras)</option>
                  <option value="DAMAGE">DAMAGE (Expired or Broken in Transit)</option>
                  <option value="MANUAL_CORRECTION">MANUAL_CORRECTION (Physical Audit)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Quantity ({adjustReason === 'DAMAGE' ? 'Deduct' : 'Add'})
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold text-gray-900"
                />
              </div>

              <div className="p-3 bg-[#FAF7F2] rounded-xl text-xs text-gray-600">
                Current Stock: <strong>{selectedVariant.stockQuantity}</strong> → Resulting Stock:{' '}
                <strong>
                  {adjustReason === 'DAMAGE'
                    ? selectedVariant.stockQuantity - adjustQty
                    : selectedVariant.stockQuantity + adjustQty}
                </strong>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedVariant(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  {adjusting ? 'Updating Ledger...' : 'Confirm Ledger Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
