import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { adminAuthAPI } from '../services/api';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: 'admin' | 'super_admin';
  avatarUrl?: string;
  twoFactorEnabled: boolean;
}

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isAdminAuthenticated: boolean;
  isAdminLoading: boolean;
  adminLogin: (identifier: string, password: string) => Promise<{ requires2FA: boolean; tempToken?: string }>;
  adminVerify2FA: (tempToken: string, code: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  refreshAdminSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Storage keys for admin tokens (separate from regular user tokens)
const ADMIN_ACCESS_TOKEN_KEY = 'adminAccessToken';
const ADMIN_REFRESH_TOKEN_KEY = 'adminRefreshToken';
const ADMIN_USER_KEY = 'adminUser';

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem(ADMIN_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const isAdminAuthenticated = !!adminUser && !!localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);

  // Verify admin session on mount
  useEffect(() => {
    const verifyAdminSession = async () => {
      const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
      if (!token) {
        setIsAdminLoading(false);
        return;
      }

      try {
        const response = await adminAuthAPI.getSession();
        setAdminUser(response.data.user);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(response.data.user));
      } catch (error) {
        // Token invalid - try refresh
        const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
        if (refreshToken) {
          try {
            const refreshResponse = await adminAuthAPI.refreshToken(refreshToken);
            localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, refreshResponse.data.accessToken);
            localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshResponse.data.refreshToken);
            // Retry session fetch
            const sessionResponse = await adminAuthAPI.getSession();
            setAdminUser(sessionResponse.data.user);
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(sessionResponse.data.user));
          } catch {
            // Refresh failed - clear admin auth
            clearAdminAuth();
          }
        } else {
          clearAdminAuth();
        }
      } finally {
        setIsAdminLoading(false);
      }
    };

    verifyAdminSession();
  }, []);

  const clearAdminAuth = () => {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
    setAdminUser(null);
  };

  const adminLogin = async (identifier: string, password: string): Promise<{ requires2FA: boolean; tempToken?: string }> => {
    const response = await adminAuthAPI.login(identifier, password);
    const data = response.data;

    if (data.requires2FA) {
      return { requires2FA: true, tempToken: data.tempToken };
    }

    // Store tokens and user
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
    setAdminUser(data.user);

    return { requires2FA: false };
  };

  const adminVerify2FA = async (tempToken: string, code: string): Promise<void> => {
    const response = await adminAuthAPI.verify2FA(tempToken, code);
    const data = response.data;

    // Store tokens and user
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(data.user));
    setAdminUser(data.user);
  };

  const adminLogout = async (): Promise<void> => {
    try {
      await adminAuthAPI.logout();
    } catch {
      // Ignore logout errors
    }
    clearAdminAuth();
  };

  const refreshAdminSession = useCallback(async (): Promise<void> => {
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const response = await adminAuthAPI.refreshToken(refreshToken);
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, response.data.accessToken);
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, response.data.refreshToken);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        isAdminAuthenticated,
        isAdminLoading,
        adminLogin,
        adminVerify2FA,
        adminLogout,
        refreshAdminSession
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}

// Helper to get admin access token for API calls
export function getAdminAccessToken(): string | null {
  return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
}
