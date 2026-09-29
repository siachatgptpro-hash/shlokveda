'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types';
import { Users, Search, Mail, Phone, Calendar, Shield } from 'lucide-react';

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.success && data.data) {
          setUsers(data.data.users || []);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.fullName || u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone && u.phone.includes(search))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">
            Registered Customers & Accounts
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Direct-to-consumer customer base and role-based access management.
          </p>
        </div>

        <div className="text-xs font-bold text-[#1B4332] bg-[#FAF7F2] px-3.5 py-2 rounded-xl border border-[#F3EFE6]">
          Total Members: {users.length}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F3EFE6] flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, email address, or phone..."
          className="w-full text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-3xl border border-[#F3EFE6] shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400">Loading directory...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-[#FAF7F2] text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Registered Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-bold text-xs uppercase">
                          {(u.fullName || u.name || 'C').charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{u.fullName || u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-mono">{u.email}</td>
                    <td className="py-3 px-4 text-gray-600">{u.phone ? `+91 ${u.phone}` : '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.roles?.includes('SUPER_ADMIN' as any) || u.role === 'SUPER_ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.roles?.includes('STORE_ADMIN' as any) || u.role === 'STORE_ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        {u.role || u.roles?.[0] || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
