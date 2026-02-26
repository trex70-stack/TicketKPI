import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE = 'http://localhost:3001/api';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        try {
          const response = await fetch(`${API_BASE}/users/${userData.id}`);
          if (response.ok) {
            const freshUserData = await response.json();
            localStorage.setItem('user', JSON.stringify(freshUserData));
            setUser(freshUserData);
          }
        } catch (e) {
          console.error('Failed to refresh user data:', e);
        }
      }
    } catch (e) {
      console.error('checkAuth error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const login = async (azureId, email, name) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ azureId, email, name })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const userData = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => user?.role === 'admin';
  const isManagement = () => user?.role === 'management' || user?.role === 'admin';
  const canViewManagement = () => user?.role === 'management' || user?.role === 'admin';

  const canViewReporter = (reporterId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.kuerzel === reporterId;
  };

  const canViewAgent = (agentId) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.kuerzel === agentId;
  };

  const isAuthenticated = () => !!user;

  const value = {
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    isAdmin,
    isManagement,
    canViewManagement,
    canViewReporter,
    canViewAgent
  };

  return (
    <AuthContext.Provider value={value}>
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

export default AuthContext;
