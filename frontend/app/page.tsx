'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { getRoleLandingRoute } from '../lib/rbac';

export default function RootPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        router.replace(getRoleLandingRoute(user.role, user.studentId));
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f5f7] text-[#1e2238] font-sans antialiased">
      <div className="flex flex-col items-center gap-3 p-6 text-center max-w-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1e2438] text-white font-bold text-base shadow-sm ring-1 ring-white/10">
          UA
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-[#1e2238]">
            Uni<span className="text-[#f87941]">Analytics</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Academic Performance Data Warehouse & Mining
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-[#e7eaee] bg-white px-3 py-1 text-[11px] text-slate-600 shadow-2xs mt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#f87941] animate-ping" />
          <span>Verifying institutional session...</span>
        </div>
      </div>
    </div>
  );
}
