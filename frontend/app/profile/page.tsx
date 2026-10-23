'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '../../components/layout/AppShell';
import { useAuth } from '../../lib/auth';
import {
  fetchUserProfile,
  updateUserProfile,
  UserProfileData,
  UserAcademicSummary,
} from '../../lib/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  GraduationCap,
  Award,
  BookOpen,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  Edit3,
  Save,
  X,
  LogOut,
  RefreshCw,
  AlertCircle,
  FileText,
  Briefcase,
  Lock,
} from 'lucide-react';
import { useToast } from '../../components/common/Toast';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [academicSummary, setAcademicSummary] = useState<UserAcademicSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit Form Fields (personal/contact fields only)
  const [editPhone, setEditPhone] = useState('');
  const [editOffice, setEditOffice] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');

  const loadProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchUserProfile();
      if (data && data.profile) {
        setProfile(data.profile);
        setAcademicSummary(data.academicSummary || null);
        setEditPhone(data.profile.phone || '');
        setEditOffice(data.profile.office_location || '');
        setEditAddress(data.profile.address || '');
        setEditBio(data.profile.bio || '');
        setEditSpecialization(data.profile.specialization || '');
      } else {
        throw new Error('Unable to retrieve user profile data.');
      }
    } catch (err: any) {
      console.error('Error loading profile:', err);
      setErrorMessage(err.message || 'Unable to retrieve user profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const handleOpenEdit = () => {
    if (profile) {
      setEditPhone(profile.phone || '');
      setEditOffice(profile.office_location || '');
      setEditAddress(profile.address || '');
      setEditBio(profile.bio || '');
      setEditSpecialization(profile.specialization || '');
    }
    setIsEditing(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        phone: editPhone.trim() || undefined,
        office_location: editOffice.trim() || undefined,
        address: editAddress.trim() || undefined,
        bio: editBio.trim() || undefined,
        specialization: editSpecialization.trim() || undefined,
      });

      if (res && res.profile) {
        setProfile((prev) => (prev ? { ...prev, ...res.profile } : res.profile));
        setIsEditing(false);
        showToast('Profile Saved', 'Personal profile details updated successfully.', 'success');
      } else {
        throw new Error('Profile update was not confirmed by server.');
      }
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast('Save Failed', err.message || 'Unable to save profile changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isStudent = (profile?.role || user?.role) === 'Student';
  const isFaculty = (profile?.role || user?.role) === 'Faculty';
  const isAnalyst = (profile?.role || user?.role) === 'Analyst' || (profile?.role || user?.role) === 'Analytics';
  const isAdmin = (profile?.role || user?.role) === 'Administrator' || (profile?.role || user?.role) === 'Academic Administrator' || (profile?.role || user?.role) === 'System Administrator';

  return (
    <AppShell activeItem="profile">
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <span>Account</span>
              <span>/</span>
              <span className="text-slate-800 font-medium">User Profile</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-[#1e2238]">
              {isStudent
                ? 'Student Academic Profile'
                : isFaculty
                ? 'Faculty Academic Profile'
                : isAnalyst
                ? 'Institutional Analyst Profile'
                : 'Administrator Profile'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {isStudent
                ? 'Personal academic registration, conformed standing, and contact details'
                : isFaculty
                ? 'Academic credentials, department affiliation, and instructional scope'
                : isAnalyst
                ? 'Institutional research credentials, analytics access, and role preferences'
                : 'Institutional governance, warehouse administration, and security credentials'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!errorMessage && (
              <button
                type="button"
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Profile</span>
              </button>
            )}
            <button
              type="button"
              onClick={loadProfile}
              title="Refresh profile"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[#e7eaee] bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dedicated Error State: NEVER render mock/stale profile if API request fails */}
        {errorMessage ? (
          <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-2xs space-y-4 max-w-lg mx-auto my-12">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-base font-bold text-[#1e2238]">Unable to load profile</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              We couldn't retrieve your profile right now. Please try again.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={loadProfile}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#1e2438] text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        ) : isLoading ? (
          /* Loading State */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-80 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
            <div className="md:col-span-2 space-y-4">
              <div className="h-44 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
              <div className="h-44 bg-white rounded-lg border border-[#e7eaee] animate-pulse p-6" />
            </div>
          </div>
        ) : (
          /* Main Profile Grid: Rendered ONLY on Successful API Load */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Avatar & Core Identity */}
            <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-5">
              <div className="flex flex-col items-center text-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#1e2438] text-white text-2xl font-bold ring-4 ring-[#fff4ed]">
                  {profile?.avatar_initials || user?.avatarInitials || 'RP'}
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <h2 className="mt-3.5 text-base font-bold text-[#1e2238]">
                  {profile?.name || user?.name || 'Academic User'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  {profile?.email || user?.email}
                </p>

                <div className="mt-2.5 inline-flex items-center gap-1 rounded-full border border-[#fcd5bf] bg-[#fff4ed] px-3 py-0.5 text-xs font-semibold text-[#f87941]">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{profile?.role || user?.role}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Official Designation</span>
                  <span className="font-medium text-slate-800 text-right">{profile?.designation || user?.designation}</span>
                </div>

                {profile?.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Department</span>
                    <span className="font-medium text-slate-800 text-right">{profile.department}</span>
                  </div>
                )}

                {profile?.student_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Student Roll ID</span>
                    <span className="font-mono font-bold text-[#1e2238] bg-slate-100 px-2 py-0.5 rounded">
                      {profile.student_id}
                    </span>
                  </div>
                )}

                {profile?.semester && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Academic Term</span>
                    <span className="font-medium text-slate-800">{profile.semester}</span>
                  </div>
                )}

                {profile?.section && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Cohort Section</span>
                    <span className="font-medium text-slate-800">{profile.section}</span>
                  </div>
                )}

                {profile?.faculty_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Faculty Identifier</span>
                    <span className="font-mono font-bold text-[#1e2238] bg-slate-100 px-2 py-0.5 rounded">
                      {profile.faculty_id}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle className="h-3 w-3" /> Active &amp; Verified
                  </span>
                </div>

                {profile?.updated_at && (
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Last Profile Update</span>
                    <span className="font-mono">{profile.updated_at}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </div>

            {/* Right Two Columns: Role-Specific Details & Academic Context */}
            <div className="md:col-span-2 space-y-5">
              {/* Student Specific Card: Academic Standing & Degree Metrics */}
              {isStudent && (
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[#f87941]" />
                      <span>Academic Standing &amp; Degree Progress</span>
                    </h3>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        academicSummary?.isAtRisk
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {academicSummary?.standing || 'Good Standing'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider block">Cumulative CGPA</span>
                      <span className="text-xl font-bold text-[#1e2238] mt-1 block">
                        {academicSummary?.cgpa !== undefined ? academicSummary.cgpa.toFixed(2) : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400">Scale of 10.0</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider block">Attendance</span>
                      <span
                        className={`text-xl font-bold mt-1 block ${
                          (academicSummary?.attendancePercentage ?? 0) < 75.0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {academicSummary?.attendancePercentage !== undefined ? `${academicSummary.attendancePercentage.toFixed(1)}%` : '—'}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          (academicSummary?.attendancePercentage ?? 0) < 75.0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {(academicSummary?.attendancePercentage ?? 0) < 75.0 ? 'Below 75% cutoff' : 'Above 75% cutoff'}
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider block">Current Cycle</span>
                      <span className="text-base font-bold text-[#1e2238] mt-1 block">
                        {academicSummary?.semester || profile?.semester || 'Semester VI'}
                      </span>
                      <span className="text-[10px] text-slate-400">AY 2025–26</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider block">Active Deficits</span>
                      <span
                        className={`text-xl font-bold mt-1 block ${
                          (academicSummary?.backlogs ?? 0) > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {academicSummary?.backlogs ?? 0}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          (academicSummary?.backlogs ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {(academicSummary?.backlogs ?? 0) === 0
                          ? 'Zero Backlogs'
                          : academicSummary?.backlogs === 1
                          ? '1 Deficit Subject'
                          : `${academicSummary?.backlogs} Deficit Subjects`}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      Enrolled Program:{' '}
                      <strong className="text-slate-800">{profile?.program || 'B.Tech in Computer Engineering'}</strong>
                    </span>
                    <span className="text-slate-500 font-medium">
                      {academicSummary?.section || profile?.section || 'Section B'} · {academicSummary?.cohort || profile?.cohort || 'Cohort 2023–2027'}
                    </span>
                  </div>
                </div>
              )}

              {/* Faculty Specific Card: Teaching Scope & Assigned Courses */}
              {isFaculty && (
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#f87941]" />
                      <span>Teaching Assignment &amp; Academic Scope</span>
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                      Teaching &amp; Mentoring
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Academic lead responsible for undergraduate instruction, classroom assessments,
                    biometric attendance compliance, and student early risk intervention.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">CS601 · Advanced Algorithms</span>
                        <span className="text-[10px] font-bold text-[#f87941] bg-[#fff4ed] px-1.5 py-0.5 rounded">4.0 Credits</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Computer Engineering · Semester VI (120 Students)</p>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">CS603 · Distributed Cloud Computing</span>
                        <span className="text-[10px] font-bold text-[#f87941] bg-[#fff4ed] px-1.5 py-0.5 rounded">4.0 Credits</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Computer Engineering · Semester VI (118 Students)</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Analyst Specific Card: Analytical Responsibilities */}
              {isAnalyst && (
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#f87941]" />
                      <span>Analytical Workstreams &amp; Research Portfolio</span>
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Institutional Analytics
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Responsible for multi-dimensional warehouse slicing, predictive student retention modeling,
                    and curricular performance trend reports for accreditation.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">OLAP Cubes</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">5 Department Cubes</span>
                      <span className="text-[10px] text-slate-400">AY 2025–26 Matrix</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Mining Models</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">K-Means &amp; Apriori</span>
                      <span className="text-[10px] text-slate-400">Risk Association Rules</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Accreditation</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">NBA / NAAC Ready</span>
                      <span className="text-[10px] text-slate-400">Conformed Fact Lineage</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Administrator Specific Card: Governance Scope */}
              {isAdmin && (
                <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#f87941]" />
                      <span>Administrative Authority &amp; System Scope</span>
                    </h3>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Full Administrative Access
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Senior administrative officer empowered to oversee academic policies, audit logs,
                    data warehouse ETL cycles, and institutional accreditation dossiers.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Access Scope</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">Full Enterprise</span>
                      <span className="text-[10px] text-slate-400">All 5 Engineering Depts</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Governance</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">Academic Senate</span>
                      <span className="text-[10px] text-slate-400">Policy &amp; Standards</span>
                    </div>

                    <div className="p-3 rounded-lg bg-[#fafbfd] border border-[#e7eaee]">
                      <span className="text-[10.5px] font-semibold text-slate-500 uppercase block">Security Tier</span>
                      <span className="text-sm font-bold text-[#1e2238] mt-1 block">Tier 1 Sovereign</span>
                      <span className="text-[10px] text-slate-400">Audit Trail Enabled</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information & Bio Card */}
              <div className="bg-white rounded-lg border border-[#e7eaee] p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1e2238] flex items-center gap-2">
                    <User className="h-4 w-4 text-[#f87941]" />
                    <span>Contact Information &amp; Biography</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="text-xs font-semibold text-[#f87941] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Edit Information</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Primary Email</span>
                      <span className="font-medium text-slate-800">{profile?.email || user?.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Phone Number</span>
                      <span className="font-medium text-slate-800">{profile?.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Building className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">
                        {isStudent ? 'Campus Residence' : 'Campus Office'}
                      </span>
                      <span className="font-medium text-slate-800">{profile?.office_location || 'Campus Residence Hall 3'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Postal Address</span>
                      <span className="font-medium text-slate-800">{profile?.address || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Award className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">Academic Specialization</span>
                      <span className="font-medium text-slate-800">{profile?.specialization || 'General'}</span>
                    </div>
                  </div>
                </div>

                {profile?.bio && (
                  <div className="pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-500 block text-[11px] mb-1">Personal Biography / Statement</span>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50/70 p-3 rounded-md border border-slate-200">
                      &ldquo;{profile.bio}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Profile Modal Dialog */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-xl border border-[#e7eaee] shadow-xl max-w-lg w-full overflow-hidden">
              <div className="p-4 border-b border-[#e7eaee] flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-[#f87941]" />
                  <h3 className="text-sm font-bold text-[#1e2238]">Edit Personal Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="p-5 space-y-4 text-xs">
                {isStudent && (
                  <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-[11px]">
                      Student ID ({profile?.student_id || 'STU1178'}), Section ({profile?.section || 'Section B'}), and Academic Data are managed by Registrar &amp; Star Schema.
                    </span>
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 98000 00000"
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] focus:border-[#f87941] focus:ring-1 focus:ring-[#f87941] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isStudent ? 'Campus Residence / Dorm Room' : 'Office Location / Room'}
                  </label>
                  <input
                    type="text"
                    value={editOffice}
                    onChange={(e) => setEditOffice(e.target.value)}
                    placeholder={isStudent ? 'Campus Residence Hall 3, Room 204' : 'Computing Block B, Room 402'}
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] focus:border-[#f87941] focus:ring-1 focus:ring-[#f87941] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mailing Address
                  </label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    placeholder="Campus Residence Hall 3, Room 204"
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] focus:border-[#f87941] focus:ring-1 focus:ring-[#f87941] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {isStudent ? 'Academic Focus & Interests' : 'Research Specialization'}
                  </label>
                  <input
                    type="text"
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                    placeholder="Distributed Systems, Data Engineering"
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] focus:border-[#f87941] focus:ring-1 focus:ring-[#f87941] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Personal Statement / Biography
                  </label>
                  <textarea
                    rows={3}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Brief personal or academic statement..."
                    className="w-full px-3 py-2 rounded-md border border-[#e7eaee] focus:border-[#f87941] focus:ring-1 focus:ring-[#f87941] outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-[#e7eaee] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={isSaving}
                    className="px-3 py-1.5 rounded-md border border-[#e7eaee] bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-[#f87941] text-white font-semibold hover:bg-[#e06530] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
