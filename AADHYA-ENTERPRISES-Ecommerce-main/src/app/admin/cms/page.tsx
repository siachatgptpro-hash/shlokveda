'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Banner } from '@/types';
import { ImageIcon, Plus, CheckCircle2, XCircle, Trash2, Edit2, AlertCircle } from 'lucide-react';

export default function AdminCmsPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [ctaText, setCtaText] = useState('Explore Formulations');
  const [ctaLink, setCtaLink] = useState('/shop');
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80'
  );
  const [slot, setSlot] = useState('HERO_PRIMARY');

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/cms/banners');
      const data = await res.json();
      if (data.success && data.data) {
        setBanners(data.data.banners || []);
      }
    } catch (err) {
      console.error('Error fetching banners:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setErrorMsg('Banner title is required.');

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/cms/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim() || undefined,
          ctaText: ctaText.trim() || undefined,
          ctaLink: ctaLink.trim() || '/shop',
          imageUrl: imageUrl.trim(),
          slot,
          isActive: true,
          sortOrder: banners.length,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to create banner');
      }

      await fetchBanners();
      setShowModal(false);
      setTitle('');
      setSubtitle('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/admin/cms/banners/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBanners(banners.filter((b) => b.id !== id));
      }
    } catch (err) {
      console.error('Delete banner error:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            CMS & Storefront Banners
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Manage homepage visual merchandising, hero banners, and promotional CTAs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs hover:bg-[#2D6A4F] transition-all flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Hero Banner</span>
        </button>
      </div>

      {/* Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-3xl border border-[#F3EFE6] overflow-hidden shadow-sm flex flex-col justify-between"
          >
            <div className="relative aspect-video w-full bg-[#FAF7F2]">
              <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
              <div className="absolute top-3 left-3 bg-[#1B4332]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Slot: {b.slot}
              </div>
            </div>

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-serif font-bold text-base text-gray-900">{b.title}</h3>
                {b.subtitle && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{b.subtitle}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-[#1B4332] font-bold">
                  <span>CTA: &ldquo;{b.ctaText || 'Shop'}&rdquo; → {b.ctaLink}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  Active On Homepage
                </span>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
                  title="Delete banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE BANNER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#F3EFE6]">
            <h3 className="font-serif text-lg font-bold text-gray-900">Add Homepage Banner</h3>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateBanner} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Main Headline *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Classical Rasayana & Awaleha Season"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Subtitle Description
                </label>
                <textarea
                  rows={2}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. 100% handcrafted in copper vessels according to Charaka Samhita."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  High-Res Image URL *
                </label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
