'use client';

import React, { useState, useEffect } from 'react';
import { Review } from '@/types';
import { MessageSquare, Star, CheckCircle2, XCircle, Trash2, Check } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      const data = await res.json();
      if (data.success && data.data) {
        setReviews(data.data.reviews || []);
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApprove = async (id: string, isApproved: boolean) => {
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: !isApproved }),
      });
      if (res.ok) {
        setReviews(
          reviews.map((r) => (r.id === id ? { ...r, isApproved: !isApproved } : r))
        );
      }
    } catch (err) {
      console.error('Error moderating review:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Review Moderation & Feedback Desk
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Audit customer testimonials, verified buyer tags, and star ratings.
          </p>
        </div>

        <div className="text-xs font-bold text-[#1B4332] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#F3EFE6]">
          Total Reviews: {reviews.length}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#F3EFE6] space-y-2">
            <MessageSquare className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-bold text-gray-700">No reviews found to moderate.</p>
          </div>
        ) : (
          reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 bg-white rounded-3xl border border-[#F3EFE6] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex text-[#C5A880]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < rev.rating ? 'fill-current text-[#C5A880]' : 'text-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-gray-900">{rev.user?.name || 'Customer'}</span>
                  {rev.isVerifiedPurchase && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      Verified Buyer
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-[#1B4332]">
                  Product: {rev.product?.name || 'Ayurvedic Formulation'}
                </p>

                {rev.title && <h5 className="font-bold text-xs text-gray-900">{rev.title}</h5>}
                <p className="text-xs text-gray-600 leading-relaxed">{rev.comment}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleApprove(rev.id, rev.isApproved)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    rev.isApproved
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{rev.isApproved ? 'Approved (Active)' : 'Approve Review'}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
