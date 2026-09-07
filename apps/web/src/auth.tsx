import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { isExecutiveRole } from '@guild/contracts';
import { api, AUTH_SESSION_EXPIRED_EVENT, json, type User } from './api';
import { LoadingPanel } from './components';

interface AuthValue {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthValue>({ user: null, loading: true });
export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function clearAuthenticatedCache(client: QueryClient) {
  void client.cancelQueries();
  client.setQueryData(AUTH_QUERY_KEY, null);
  client.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async ({ signal }) => (await api<{ user: User | null }>('/api/auth/session', { signal })).user,
    retry: false,
  });
  useEffect(() => {
    const expireSession = () => clearAuthenticatedCache(client);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, expireSession);
  }, [client]);
  return (
    <AuthContext.Provider value={{ user: query.data ?? null, loading: query.isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export function useLogout() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: () => api<{ loggedOut: boolean }>('/api/auth/logout', json('POST')),
    onSuccess: () => {
      clearAuthenticatedCache(client);
      navigate('/', { replace: true });
    },
  });
}

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
  if (adminOnly && !isExecutiveRole(user.role)) return <Navigate to="/admin/activities" replace />;
  return children;
}
