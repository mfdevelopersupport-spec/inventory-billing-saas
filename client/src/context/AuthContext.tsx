import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Branch } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  branches: Branch[];
  selectedBranch: Branch | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setSelectedBranch: (branch: Branch | null) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshBranches: () => Promise<void>;
  isSuperAdmin: boolean;
  isBranchManager: boolean;
  isCashier: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('saas_token'));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(
    (localStorage.getItem('saas_theme') as 'dark' | 'light') || 'dark'
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('saas_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const refreshBranches = async () => {
    try {
      const data = await api.getBranches();
      setBranches(data.branches);

      // Select default branch
      if (data.branches.length > 0 && !selectedBranch) {
        if (user?.branchId) {
          const userB = data.branches.find((b: Branch) => b.id === user.branchId);
          setSelectedBranch(userB || data.branches[0]);
        } else {
          setSelectedBranch(data.branches[0]);
        }
      }
    } catch (err) {
      console.error('Error al cargar sucursales:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('saas_token');
      if (storedToken) {
        try {
          const res = await api.getMe();
          setUser(res.user);
          await refreshBranches();
        } catch (err) {
          console.error('Sesión expirada o token inválido');
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('saas_token', newToken);
    setToken(newToken);
    setUser(newUser);
    refreshBranches();
  };

  const logout = () => {
    localStorage.removeItem('saas_token');
    setToken(null);
    setUser(null);
    setSelectedBranch(null);
  };

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isBranchManager = user?.role === 'BRANCH_MANAGER';
  const isCashier = user?.role === 'CASHIER';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        branches,
        selectedBranch,
        theme,
        toggleTheme,
        setSelectedBranch,
        login,
        logout,
        refreshBranches,
        isSuperAdmin,
        isBranchManager,
        isCashier,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
