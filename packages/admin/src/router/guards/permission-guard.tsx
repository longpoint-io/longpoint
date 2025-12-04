import { useAuth } from '@/auth/auth-context';
import { Permission } from '@longpoint/types';
import { Spinner } from '@longpoint/ui/components/spinner';
import { NotFound } from '../../pages/not-found';
import { GuardProps } from '../types';

interface PermissionGuardProps extends GuardProps {
  permission: Permission;
}

/**
 * Require a specific permission for a route
 * Shows 404 if permission is missing
 */
export function PermissionGuard({
  children,
  permission,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Spinner />
        </div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <NotFound />;
  }

  return <>{children}</>;
}
