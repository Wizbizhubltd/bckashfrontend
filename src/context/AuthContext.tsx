import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { env } from '../config/env';
import { authService } from '../services/auth.service';
import { useAppDispatch } from '../store/hooks';
import { clearLookups, hydrateLookups } from '../store/slices/lookupsSlice';
import {
  clearSession as clearAuthSession,
  setSession as setAuthSession } from
'../store/slices/authSlice';
export type Role = 'super_admin' | 'manager' | 'authorizer' | 'marketer';
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  branch?: string;
  avatar: string;
}
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  deviceId: string;
  pendingEmail: string | null;
  login: (
  email: string,
  password: string)
  => Promise<{
    success: boolean;
    requiresOtp: boolean;
  }>;
  verifyOtp: (otp: string) => Promise<{
    success: boolean;
    user: User;
    token: string;
  }>;
  logout: () => void;
  setPendingEmail: (email: string | null) => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AUTH_TOKEN_STORAGE_KEY = 'userToken';
export const AUTH_USER_STORAGE_KEY = 'userData';
export const AUTH_USER_DEVICEID_KEY = 'userDeviceId';

const getStoredSession = (): { user: User | null; token: string | null } => {
  const storedToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedToken || !storedUser) {
    return {
      user: null,
      token: null,
    };
  }

  try {
    const parsedUser = JSON.parse(storedUser) as User;
    return {
      user: parsedUser,
      token: storedToken,
    };
  } catch {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_DEVICEID_KEY);
    return {
      user: null,
      token: null,
    };
  }
};
// Mock users mapped by email
const mockUsersByEmail: Record<
  string,
  {
    user: User;
    password: string;
  }> =
{
  'admin@bckash.com': {
    password: 'password123',
    user: {
      id: 'USR-001',
      name: 'Adebayo Johnson',
      email: 'admin@bckash.com',
      role: 'super_admin',
      organizationId: 'org_mock_001',
      organizationName: 'Bckash Mfb',
      branch: 'Head Office',
      avatar: ''
    }
  },
  'manager.ikeja@bckash.com': {
    password: 'password123',
    user: {
      id: 'USR-002',
      name: 'Fatima Abubakar',
      email: 'manager.ikeja@bckash.com',
      role: 'manager',
      organizationId: 'org_mock_001',
      organizationName: 'Bckash Mfb',
      branch: 'Ikeja Branch',
      avatar: ''
    }
  },
  'auth@bckash.com': {
    password: 'password123',
    user: {
      id: 'USR-003',
      name: 'Chukwuma Okonkwo',
      email: 'auth@bckash.com',
      role: 'authorizer',
      organizationId: 'org_mock_001',
      organizationName: 'Bckash Mfb',
      branch: 'Head Office',
      avatar: ''
    }
  },
  'marketer@bckash.com': {
    password: 'password123',
    user: {
      id: 'USR-004',
      name: 'Aisha Bello',
      email: 'marketer@bckash.com',
      role: 'marketer',
      organizationId: 'org_mock_001',
      organizationName: 'Bckash Mfb',
      branch: 'Surulere Branch',
      avatar: ''
    }
  }
};
function generateDeviceId(): string {
  const stored = localStorage.getItem(AUTH_USER_DEVICEID_KEY) ?? localStorage.getItem('bckash_device_id');
  if (stored) {
    localStorage.setItem(AUTH_USER_DEVICEID_KEY, stored);
    return stored;
  }
  const id =
  'DEV-' +
  Math.random().toString(36).substring(2, 10).toUpperCase() +
  '-' +
  Date.now().toString(36).toUpperCase();
  localStorage.setItem(AUTH_USER_DEVICEID_KEY, id);
  return id;
}
export function AuthProvider({ children }: {children: ReactNode;}) {
  const dispatch = useAppDispatch();
  const [initialSession] = useState<{ user: User | null; token: string | null }>(() => getStoredSession());
  const [user, setUser] = useState<User | null>(initialSession.user);
  const [token, setToken] = useState<string | null>(initialSession.token);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [deviceId] = useState<string>(() => generateDeviceId());

  useEffect(() => {
    if (initialSession.user && initialSession.token) {
      dispatch(
        setAuthSession({
          user: initialSession.user,
          token: initialSession.token,
        }),
      );
      void dispatch(hydrateLookups());
    }
  }, [dispatch, initialSession.token, initialSession.user]);

  const setSession = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    setPendingEmail(null);
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser));
    dispatch(
      setAuthSession({
        user: nextUser,
        token: nextToken
      })
    );
    void dispatch(hydrateLookups());
  };

  const login = async (
  email: string,
  password: string)
  : Promise<{
    success: boolean;
    requiresOtp: boolean;
  }> => {
    const normalizedEmail = email.toLowerCase();

    if (env.enableMockAuth) {
      console.log('[Auth] Login attempt:', {
        email,
        deviceId,
        timestamp: new Date().toISOString()
      });

      const entry = mockUsersByEmail[normalizedEmail];
      if (!entry || entry.password !== password) {
        return {
          success: false,
          requiresOtp: false
        };
      }

      setPendingEmail(normalizedEmail);
      console.log('[Auth] OTP sent to:', email, '| Mock OTP: 123456');

      return {
        success: true,
        requiresOtp: true
      };
    }

    const response = await authService.login({
      email: normalizedEmail,
      password,
      deviceId
    });

    if (!response.success) {
      return {
        success: false,
        requiresOtp: false
      };
    }

    if (response.requiresOtp) {
      setPendingEmail(normalizedEmail);
      return {
        success: true,
        requiresOtp: true
      };
    }

    if (response.user && response.token) {
      setSession(response.user, response.token);
      return {
        success: true,
        requiresOtp: false
      };
    }

    return {
      success: true,
      requiresOtp: true
    };
  };

  const verifyOtp = async (
  otp: string)
  : Promise<{
    success: boolean;
    user: User;
    token: string;
  }> => {
    if (env.enableMockAuth) {
      console.log('[Auth] OTP verification:', {
        otp,
        deviceId,
        pendingEmail
      });

      if (otp.length !== 6) {
        throw new Error('Invalid OTP');
      }

      const entry = pendingEmail ? mockUsersByEmail[pendingEmail] : null;
      if (!entry) {
        throw new Error('Session expired. Please login again.');
      }

      const mockToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      btoa(
        JSON.stringify({
          userId: entry.user.id,
          email: entry.user.email,
          role: entry.user.role,
          deviceId,
          iat: Date.now()
        })
      );

      setSession(entry.user, mockToken);

      console.log('[Auth] Login successful:', {
        userId: entry.user.id,
        role: entry.user.role,
        token: mockToken.substring(0, 30) + '...'
      });

      return {
        success: true,
        user: entry.user,
        token: mockToken
      };
    }

    if (!pendingEmail) {
      throw new Error('Session expired. Please login again.');
    }

    const response = await authService.verifyOtp({
      email: pendingEmail,
      otp,
      deviceId
    });

    if (!response.success || !response.user || !response.token) {
      throw new Error('Invalid OTP. Please try again.');
    }

    setSession(response.user, response.token);

    return {
      success: true,
      user: response.user,
      token: response.token
    };
  };
  const logout = () => {
    setUser(null);
    setToken(null);
    setPendingEmail(null);
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    dispatch(clearAuthSession());
    dispatch(clearLookups());
  };
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        token,
        deviceId,
        pendingEmail,
        login,
        verifyOtp,
        logout,
        setPendingEmail
      }}>
      
      {children}
    </AuthContext.Provider>);

}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}