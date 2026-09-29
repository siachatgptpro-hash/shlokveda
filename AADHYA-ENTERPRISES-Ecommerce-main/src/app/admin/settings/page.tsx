'use client';

import React, { useState, useEffect } from 'react';
import { BusinessSettings } from '@/types';
import { Settings, Save, CheckCircle2, AlertCircle, Building, Phone, ShieldCheck } from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [storeName, setStoreName] = useState('Sholkveda');
  const [gstin, setGstin] = useState('09ANCPV6879P1ZP');
  const [phone, setPhone] = useState('7017840020');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('B.H Oil Meal Road, Next to Bank of Maharashtra');
  const [addressLine2, setAddressLine2] = useState('Dobra Bal Colony');
  const [city, setCity] = useState('Hathras');
  const [state, setState] = useState('Uttar Pradesh');
  const [postalCode, setPostalCode] = useState('204101');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(999);
  const [baseShippingFee, setBaseShippingFee] = useState(50);
  const [enableCod, setEnableCod] = useState(true);
  const [announcementText, setAnnouncementText] = useState(
    'Sholkveda product names, pack sizes and listed MRPs from the supplied brochure'
  );

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.success && data.data) {
          const s = data.data;
          setSettings(s);
          setStoreName(s.storeName);
          setGstin(s.gstin);
          setPhone(s.phone);
          setEmail(s.email);
          setAddressLine1(s.addressLine1);
          setAddressLine2(s.addressLine2 || '');
          setCity(s.city);
          setState(s.state);
          setPostalCode(s.postalCode);
          setFreeShippingThreshold(s.freeShippingThreshold);
          setBaseShippingFee(s.baseShippingFee);
          setEnableCod(s.enableCod);
          setAnnouncementText(s.announcementText || '');
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName: storeName.trim(),
          gstin: gstin.trim(),
          phone: phone.trim(),
          email: email.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          freeShippingThreshold: Number(freeShippingThreshold),
          baseShippingFee: Number(baseShippingFee),
          enableCod,
          announcementText: announcementText.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update settings');
      }

      setMsg({ type: 'success', text: 'Hathras business profile updated successfully!' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error updating settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Hathras Business Profile & Commerce Settings
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure enterprise legal details, Hathras location, and logistics parameters.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#2D6A4F] transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
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
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BUSINESS LEGAL ENTITY */}
        <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1B4332]" />
            <span>Legal Business Entity</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Business / Enterprise Legal Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                GSTIN / UIN Identifier *
              </label>
              <input
                type="text"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Helpline Phone *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Official Email *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* HATHRAS ADDRESS */}
        <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-[#1B4332]" />
            <span>Hathras Physical Facility Address</span>
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Street / Facility Road *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Colony / Landmark
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  PIN
                </label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-mono font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* LOGISTICS & ANNOUNCEMENT BANNER */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
          <h2 className="font-serif text-lg font-bold text-gray-900">
            Logistics Parameters & Header Notice
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Free Shipping Threshold (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Base Courier Shipping Fee (₹)
              </label>
              <input
                type="number"
                required
                min={0}
                value={baseShippingFee}
                onChange={(e) => setBaseShippingFee(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm font-bold"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCod}
                  onChange={(e) => setEnableCod(e.target.checked)}
                  className="w-5 h-5 text-[#1B4332] rounded focus:ring-[#1B4332]"
                />
                <div>
                  <span className="text-xs font-bold text-gray-900 block">
                    Cash on Delivery (COD)
                  </span>
                  <span className="text-[10px] text-gray-500">Enable Cash on Delivery at checkout</span>
                </div>
              </label>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Top Announcement Bar Message
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-xs"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
