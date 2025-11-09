import React, { createContext, useState, useContext, type ReactNode, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  profilePic: string;
  dob?: string;
  gender?: string;
  country?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize user from localStorage on component mount
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  const login = useCallback((userData: User) => {
    setUser(userData);
    // Save user data to localStorage
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // Remove user data from localStorage
    localStorage.removeItem('user');
  }, []);

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const value = { user, isAuthenticated: !!user, isLoading, login, logout, setLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;

};
