import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAuthToken, removeAuthToken } from '../services/api';

export interface User {
  user_id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  title?: string;
  avatar?: string;
  created_at?: string;
}

export const DEMO_PERSONAS: User[] = [
  { user_id: 1, name: 'Alex Chen', email: 'alex.chen@campus.edu', role: 'student', title: 'React & Docker Teacher', avatar: 'AC' },
  { user_id: 2, name: 'Priya Sharma', email: 'priya.sharma@campus.edu', role: 'student', title: 'PostgreSQL & SQL Teacher', avatar: 'PS' },
  { user_id: 3, name: 'Marcus Johnson', email: 'marcus.johnson@campus.edu', role: 'student', title: 'Python 1-on-1 Teacher', avatar: 'MJ' },
  { user_id: 4, name: 'Elena Rostova', email: 'elena.rostova@campus.edu', role: 'student', title: 'Student Learner (Elena)', avatar: 'ER' },
  { user_id: 5, name: 'Devon Vance', email: 'devon.vance@campus.edu', role: 'student', title: 'Student Learner (Devon)', avatar: 'DV' },
  { user_id: 6, name: 'Campus Admin', email: 'admin@campus.edu', role: 'admin', title: 'Campus Administrator', avatar: 'CA' },
];

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  switchDemoUser: (email: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(DEMO_PERSONAS[0]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('seatsync_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('seatsync_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('seatsync_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const fetchCurrentUser = async () => {
    try {
      if (token) {
        const res = await api.getMe();
        if (res.user) {
          setUser(res.user);
        }
      } else {
        await switchDemoUser('alex.chen@campus.edu');
      }
    } catch (err) {
      console.warn('Session expired or DB unavailable, keeping demo user session:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, role = 'student') => {
    const res = await api.register({ name, email, password, role });
    setAuthToken(res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const switchDemoUser = async (email: string) => {
    const persona = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === email.toLowerCase()) || DEMO_PERSONAS[0];
    // Immediate optimistic state update guarantees instantaneous UI response
    setUser(persona);

    try {
      const res = await api.demoLogin(email);
      if (res && res.token) {
        setAuthToken(res.token);
        setToken(res.token);
        if (res.user) {
          setUser({ ...persona, ...res.user });
        }
      }
    } catch (err) {
      console.warn('API demo login fallback active:', err);
    }
  };

  const logout = () => {
    removeAuthToken();
    setToken(null);
    setUser(DEMO_PERSONAS[0]);
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await api.getMe();
        if (res.user) setUser(res.user);
      } catch (err) {
        console.warn('Refresh user error:', err);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAdmin: user?.role === 'admin',
        theme,
        toggleTheme,
        login,
        register,
        switchDemoUser,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
