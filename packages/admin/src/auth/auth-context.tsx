import { Permission } from '@longpoint/types';
import { createContext, useContext, type ReactNode } from 'react';
import { authClient } from './auth-client';

interface AuthContextValue {
  session: ReturnType<typeof authClient.useSession>['data'];
  isLoading: boolean;
  error: ReturnType<typeof authClient.useSession>['error'];
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending, error, refetch } = authClient.useSession();

  const signOut = async () => {
    await authClient.signOut();
  };

  const refreshSession = async () => {
    await refetch();
  };

  const hasPermission = (permission: Permission) => {
    const user = session?.user;
    if (user) {
      if ('permissions' in user) {
        const permissions = user.permissions as Record<Permission, boolean>;
        return permissions[permission] || permissions[Permission.SUPER];
      }
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: isPending,
        error,
        signOut,
        refreshSession,
        hasPermission,
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
