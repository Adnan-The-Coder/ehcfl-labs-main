"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Users, Mail, Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

type UserProfile = {
  id?: string;
  uuid?: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  created_at?: string;
  updated_at?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function UsersTable() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(API_ENDPOINTS.getAllProfiles, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch users');
      }

      const json = await res.json();
      const data = json?.data ?? [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('❌ Failed to load users', err);
      setError(err?.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const stats = useMemo(() => {
    const total = users.length;
    const withPhone = users.filter((u) => u.phone).length;
    const withCity = users.filter((u) => u.city).length;
    return { total, withPhone, withCity };
  }, [users]);

  return (
    <div className="bg-[#1a2332] border border-gray-800 rounded-2xl p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-sm text-gray-400">Directory of all profiles</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400 bg-gray-800/60 px-3 py-1.5 rounded-full border border-gray-700/80">
            Total: {stats.total}
          </div>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-60"
            disabled={loading}
            aria-label="Refresh users"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <StatPill label="With Phone" value={stats.withPhone} color="green" />
        <StatPill label="With City" value={stats.withCity} color="blue" />
        <StatPill label="Total Users" value={stats.total} color="purple" />
      </div>

      <div className="overflow-auto rounded-xl border border-gray-800 bg-[#111827]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">User</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading users...</div>
                </td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No users found.</td>
              </tr>
            )}
            {!loading && users.map((user) => (
              <tr key={user.uuid || user.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-semibold">
                      {user.full_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-medium text-white">{user.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">UUID: {user.uuid || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="space-y-1 text-gray-300">
                    <div className="flex items-center gap-2 text-sm"><Mail size={14} className="text-gray-400" />{user.email || '—'}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-400"><Phone size={13} />{user.phone || 'Not provided'}</div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <MapPin size={14} className="text-gray-400" />
                    <span>{user.city || user.state || user.pincode ? `${user.city ?? ''}${user.city && user.state ? ', ' : ''}${user.state ?? ''}` : 'Not set'}</span>
                  </div>
                  {user.pincode && <div className="text-xs text-gray-500 ml-5">{user.pincode}</div>}
                </td>
                <td className="px-4 py-4 text-gray-300">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: 'green' | 'blue' | 'purple' }) {
  const colorMap: Record<'green' | 'blue' | 'purple', string> = {
    green: 'from-green-500/20 to-emerald-500/10 text-green-300 border-green-500/30',
    blue: 'from-blue-500/20 to-cyan-500/10 text-blue-300 border-blue-500/30',
    purple: 'from-purple-500/20 to-pink-500/10 text-purple-300 border-purple-500/30',
  } as const;

  return (
    <div className={`rounded-xl border px-4 py-3 bg-gradient-to-br ${colorMap[color]}`}>
      <div className="text-xs text-white/80">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
