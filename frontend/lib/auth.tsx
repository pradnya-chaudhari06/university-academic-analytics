'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, getRoleLandingRoute } from './rbac';

export type { UserRole };

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  designation: string;
  avatarInitials: string;
}

/**
 * Conformed institutional accounts with fixed academic roles.
 * Users cannot choose or alter their role; role is strictly derived from verified credentials.
 */
export const DEMO_USERS: Record<string, AuthUser & { passwordHash: string }> = {
  'sysadmin@university.edu': {
    id: 'usr-sysadmin-01',
    name: 'Dr. Alan Turing',
    email: 'sysadmin@university.edu',
    passwordHash: 'sysadmin123',
    role: 'System Administrator',
    designation: 'Chief Data Architect & System Administrator',
    avatarInitials: 'AT',
  },
  'admin@university.edu': {
    id: 'usr-admin-01',
    name: 'Dr. Sarah Jenkins',
    email: 'admin@university.edu',
    passwordHash: 'admin123',
    role: 'Academic Administrator',
    designation: 'Dean of Academic Affairs',
    avatarInitials: 'SJ',
  },
  'hod.ce@university.edu': {
    id: 'usr-hod-ce-01',
    name: 'Dr. Vikram Kelkar',
    email: 'hod.ce@university.edu',
    passwordHash: 'hod123',
    role: 'HOD',
    department: 'Computer Engineering',
    designation: 'Head of Department · Computer Engineering',
    avatarInitials: 'VK',
  },
  'faculty@university.edu': {
    id: 'usr-faculty-01',
    name: 'Prof. Rajesh Sharma',
    email: 'faculty@university.edu',
    passwordHash: 'faculty123',
    role: 'Faculty',
    department: 'Computer Engineering',
    designation: 'Senior Faculty · Computer Engineering',
    avatarInitials: 'RS',
  },
  'student@university.edu': {
    id: 'usr-student-01',
    name: 'Riya Patil',
    email: 'student@university.edu',
    passwordHash: 'student123',
    role: 'Student',
    department: 'Computer Engineering',
    studentId: 'STU1178',
    designation: 'Undergraduate Student (STU1178) · Computer Engineering',
    avatarInitials: 'RP',
  },
  // Legacy / Analyst account compatibility
  'analyst@university.edu': {
    id: 'usr-analyst-01',
    name: 'Priya Nair',
    email: 'analyst@university.edu',
    passwordHash: 'analyst123',
    role: 'Analyst',
    designation: 'Institutional Research Analyst',
    avatarInitials: 'PN',
  },
};

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'uni_academic_auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Restore authenticated session from localStorage on initial page load / refresh
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate against registered conformed user database to ensure role integrity
        if (parsed && parsed.email && DEMO_USERS[parsed.email.toLowerCase().trim()]) {
          const registered = DEMO_USERS[parsed.email.toLowerCase().trim()];
          const { passwordHash: _, ...safeUser } = registered;
          setUser(safeUser);
        } else {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const target = DEMO_USERS[email.toLowerCase().trim()];
    if (!target || target.passwordHash !== pass) {
      return { success: false, error: 'Invalid institutional credentials. Please try again.' };
    }

    const { passwordHash: _, ...safeUser } = target;
    setUser(safeUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));

    // Dynamic landing route governed strictly by the user's fixed role
    const landing = getRoleLandingRoute(safeUser.role, safeUser.studentId);
    router.push(landing);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    router.replace('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
