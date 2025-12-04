import { useAuth } from '@/auth';
import { Permission } from '@longpoint/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@longpoint/ui/components/tabs';
import { MailIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Users } from './index';
import { Registrations } from './registrations';
import { Roles } from './roles';

const VALID_TABS = ['users', 'roles', 'pending'] as const;
type TabValue = (typeof VALID_TABS)[number];

const TAB_ROUTES: Record<TabValue, string> = {
  users: '/users',
  roles: '/users/roles',
  pending: '/users/pending',
};

export function UsersAndRoles() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();
  const canReadUsers = hasPermission(Permission.USERS_READ);
  const canReadRoles = hasPermission(Permission.ROLES_READ);

  // Determine current tab from pathname
  const getCurrentTab = (): TabValue => {
    if (location.pathname === '/users/roles' && canReadRoles) return 'roles';
    if (location.pathname === '/users/pending' && canReadUsers)
      return 'pending';
    if (canReadUsers) return 'users';
    if (canReadRoles) return 'roles';
    return 'users'; // fallback
  };

  const currentTab = getCurrentTab();
  const currentTabRef = useRef(currentTab);

  useEffect(() => {
    // Make sure the current tab stays in sync when navigating back/forward
    const tab = getCurrentTab();
    if (VALID_TABS.includes(tab)) {
      currentTabRef.current = tab;
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    const tabValue = value as TabValue;
    // onValueChange triggers on mount, so do this to prevent redundant navigation
    if (tabValue !== currentTabRef.current) {
      currentTabRef.current = tabValue;
      navigate(TAB_ROUTES[tabValue]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Users & Roles</h2>
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          {canReadUsers && (
            <TabsTrigger value="users">
              <UserIcon className="h-4 w-4" />
              Users
            </TabsTrigger>
          )}
          {canReadRoles && (
            <TabsTrigger value="roles">
              <ShieldIcon className="h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
          {canReadUsers && (
            <TabsTrigger value="pending">
              <MailIcon className="h-4 w-4" />
              Pending Users
            </TabsTrigger>
          )}
        </TabsList>
        {canReadUsers && (
          <TabsContent value="users">
            <Users />
          </TabsContent>
        )}
        {canReadRoles && (
          <TabsContent value="roles">
            <Roles />
          </TabsContent>
        )}
        {canReadUsers && (
          <TabsContent value="pending">
            <Registrations />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
