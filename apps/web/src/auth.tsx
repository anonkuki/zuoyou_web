import { createContext, useContext, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, useLocation } from 'react-router-dom';
import { api, type User } from './api';
import { LoadingPanel } from './components';

interface AuthValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthValue>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await api<{ user: User | null }>('/api/auth/session')).user,
    retry: false,
  });
  return (
    <AuthContext.Provider value={{ user: query.data ?? null, loading: query.isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function Protected({ children, manager = false, adminOnly = false }: { children: ReactNode; manager?: boolean; adminOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingPanel label="正在核验公会凭证" />;
  if (!user) {
    return (
      <main className="auth-gate parchment-panel">
        <span className="eyebrow">ACCESS SEALED</span>
        <h1>需要公会身份验证</h1>
        <p>此区域保存成员档案与内部协作资料，请先登录。</p>
        <a className="guild-button" href={`/login?from=${encodeURIComponent(location.pathname)}`}>前往登录</a>
      </main>
    );
  }
  if (manager && user.role === 'MEMBER') return <Navigate to="/portal" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/admin/activities" replace />;
  return children;
}
