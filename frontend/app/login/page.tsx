'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  BookOpen,
  BarChart3,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getRoleLandingRoute } from '../../lib/rbac';

interface RoleOption {
  id: 'admin' | 'faculty' | 'analytics' | 'student';
  title: string;
  subtitle: string;
  email: string;
  password: string;
  roleName: string;
  userName: string;
  userRole: string;
  landingRoute: string;
  badge: string;
  accessScope: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    id: 'admin',
    title: 'Administrator',
    subtitle: 'System administration & warehouse control',
    email: 'admin@university.edu',
    password: 'admin123',
    roleName: 'Administrator',
    userName: 'Dr. Sarah Jenkins',
    userRole: 'Academic Administrator',
    landingRoute: '/dashboard',
    badge: 'System Admin',
    accessScope: 'Full administrative access, warehouse status & ETL pipeline management.',
    icon: ShieldCheck,
  },
  {
    id: 'faculty',
    title: 'Faculty',
    subtitle: 'Academic monitoring & student performance',
    email: 'faculty@university.edu',
    password: 'faculty123',
    roleName: 'Faculty',
    userName: 'Prof. Rajesh Sharma',
    userRole: 'Faculty · Computer Engineering',
    landingRoute: '/faculty',
    badge: 'Teaching & Mentoring',
    accessScope: 'Faculty teaching workspace, class performance trends, attendance correlation & at-risk interventions.',
    icon: BookOpen,
  },
  {
    id: 'analytics',
    title: 'Analytics',
    subtitle: 'OLAP, data mining & institutional analytics',
    email: 'analyst@university.edu',
    password: 'analyst123',
    roleName: 'Analytics',
    userName: 'Priya Nair',
    userRole: 'Institutional Research Analyst',
    landingRoute: '/analytics/olap',
    badge: 'OLAP / Mining',
    accessScope: 'Multi-dimensional OLAP cube matrix, K-Means clustering, Apriori rules & Decision Trees.',
    icon: BarChart3,
  },
  {
    id: 'student',
    title: 'Student',
    subtitle: 'Personal academic performance & insights',
    email: 'student@university.edu',
    password: 'student123',
    roleName: 'Student',
    userName: 'Riya Patil',
    userRole: 'Student (STU1178)',
    landingRoute: '/student',
    badge: 'STU1178',
    accessScope: 'Strictly personal academic record, CGPA/SGPA, subject marks, attendance & personalized suggestions.',
    icon: GraduationCap,
  },
];

export default function LoginPage() {
  const [selectedRoleId, setSelectedRoleId] = useState<'admin' | 'faculty' | 'analytics' | 'student'>('admin');
  const [email, setEmail] = useState('admin@university.edu');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getRoleLandingRoute(user.role, user.studentId));
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Handle role selection card click
  const handleSelectRole = (opt: RoleOption) => {
    setSelectedRoleId(opt.id);
    setEmail(opt.email);
    setPassword(opt.password);
    setError(null);
  };

  // Sync selected card if user manually types known email
  const handleEmailChange = (val: string) => {
    setEmail(val);
    const matched = ROLE_OPTIONS.find((r) => r.email.toLowerCase() === val.trim().toLowerCase());
    if (matched) {
      setSelectedRoleId(matched.id);
      setPassword(matched.password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setError('An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeOption = ROLE_OPTIONS.find((r) => r.id === selectedRoleId) || ROLE_OPTIONS[0];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#f4f5f7] text-[#1e2238] font-sans antialiased selection:bg-[#fff4ed] selection:text-[#f87941]">
      {/* Top Institutional Header */}
      <header className="h-14 border-b border-[#e7eaee] bg-white px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#1e2438] text-white font-bold text-xs">
            UA
          </div>
          <span className="font-bold text-sm tracking-tight text-[#1e2238]">UniAnalytics</span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500 font-medium">Institutional Academic Performance Platform</span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Warehouse: StarSchema_Academic</span>
        </div>
      </header>

      {/* Main Login Center Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-2xl space-y-4">
          <div className="rounded-lg p-6 sm:p-7 shadow-xs border border-[#e7eaee] bg-white">
            {/* Header badge & title */}
            <div className="text-center space-y-1 pb-5 border-b border-[#f1f3f5]">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#fff4ed] border border-[#fcd5bf] px-3 py-1 text-[11px] font-semibold text-[#f87941] mb-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>UniAnalytics Institutional Access Gate</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
                Academic Portal Authentication
              </h1>
              <p className="text-xs text-slate-500 max-w-lg mx-auto">
                Select your institutional role to authenticate with server-side RBAC permissions.
                Access to warehouse cubes, student records, and analytics is strictly enforced.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Role Choices (Four Visibly Supported Roles) */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Select Institutional Role (4 Supported Roles)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Click to switch profile</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {ROLE_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedRoleId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`role-btn-${opt.id}`}
                      data-role-id={opt.id}
                      type="button"
                      onClick={() => handleSelectRole(opt)}
                      className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-[#f87941] bg-[#fff5ee] ring-1 ring-[#f87941] shadow-2xs'
                          : 'border-[#e7eaee] bg-white hover:bg-[#fafbfd] hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                              isSelected
                                ? 'bg-[#f87941] text-white border-[#f87941]'
                                : 'bg-[#f7f8fa] text-slate-600 border-[#e7eaee]'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-xs text-[#1e2238]">{opt.title}</span>
                        </div>

                        <span
                          className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white text-[#f87941] border border-[#fcd5bf]'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isSelected ? 'Selected' : opt.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug">
                        {opt.subtitle}
                      </p>

                      <div className="mt-2 pt-1.5 border-t border-[#f1f3f5] flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>{opt.email}</span>
                        <span className="font-semibold text-slate-600">→ {opt.landingRoute}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Role Scope Context Banner */}
            <div className="mt-4 rounded-md border border-[#e7eaee] bg-[#fafbfd] p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#f87941]" />
                  Active Profile: <span className="text-[#1e2238] font-bold">{activeOption.title}</span>
                  <span className="text-slate-400 font-normal">({activeOption.userName} · {activeOption.userRole})</span>
                </span>
                <span className="font-mono text-[10.5px] font-bold text-[#f87941] bg-[#fff5ee] border border-[#fcd5bf] px-1.5 py-0.5 rounded">
                  Destination: {activeOption.landingRoute}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {activeOption.accessScope}
              </p>
            </div>

            {/* Login Credentials Form */}
            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="e.g. student@university.edu"
                    className="w-full rounded-md border border-[#e5e7eb] bg-[#f8f9fa] py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#f87941] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-[#e5e7eb] bg-[#f8f9fa] py-2 pl-9 pr-3 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#f87941] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-[#1e2438] py-2.5 text-xs font-semibold text-white hover:bg-[#2c334d] transition-colors shadow-2xs cursor-pointer mt-2"
              >
                <span>
                  {isSubmitting
                    ? `Authenticating as ${activeOption.title}...`
                    : `Sign In as ${activeOption.title}`}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>

          {/* Institutional Lineage Notice */}
          <div className="text-center space-y-1 text-[10px] text-slate-400 font-mono">
            <p>University Academic Performance Data Warehouse & Mining System</p>
            <p>Conformed Star Schema Fact Tables · Role-Based Access Control · AY 2025–26</p>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="h-10 border-t border-[#e7eaee] bg-white px-6 flex items-center justify-between text-[11px] text-slate-400">
        <span>UniAnalytics Platform · DWM Capstone Project</span>
        <span>Conformed RBAC Session Gate</span>
      </footer>
    </div>
  );
}
