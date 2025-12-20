import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  getCurrentUser,
  logout as logoutAction,
  login as loginAction,
  register as registerAction,
  clearError
} from '../store/slices/authSlice';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  ethnicity?: string;
  location?: string;
  artistType?: string;
  genre?: string;
  talentCategories?: string[];
  role?: string;
}

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error, accessToken } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (accessToken && !user) {
      dispatch(getCurrentUser());
    }
  }, [accessToken, user, dispatch]);

  const login = async (identifier: string, password: string) => {
    const result = await dispatch(loginAction({ identifier, password }));
    if (loginAction.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
    return result.payload;
  };

  const register = async (data: RegisterData) => {
    const result = await dispatch(registerAction(data));
    if (registerAction.rejected.match(result)) {
      throw new Error(result.payload as string);
    }
    return result.payload;
  };

  const logout = async () => {
    await dispatch(logoutAction());
  };

  const clearAuthError = () => {
    dispatch(clearError());
  };

  const refreshUser = async () => {
    await dispatch(getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        clearAuthError,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
