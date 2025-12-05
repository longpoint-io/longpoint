import { useAuth } from '@/auth';
import { Permission } from '@longpoint/types';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@longpoint/ui/components/tabs';
import { BoxIcon, PlugIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GeneralSettings } from './general-settings';
import { NotificationSettings } from './notification-settings';
import { PluginSettings } from './plugins/plugin-settings';
import { SearchSettings } from './search-settings';
import { StorageSettings } from './storage-settings';

const VALID_TABS = ['general', 'storage', 'search', 'plugins'] as const;
type TabValue = (typeof VALID_TABS)[number];

const TAB_ROUTES: Record<TabValue, string> = {
  general: '/settings/general',
  storage: '/settings/storage',
  search: '/settings/search',
  plugins: '/settings/plugins',
};

export function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  // Determine current tab from pathname
  const getCurrentTab = (): TabValue => {
    const pathname = location.pathname;
    if (pathname === '/settings/storage') return 'storage';
    if (pathname === '/settings/search') return 'search';
    if (pathname.startsWith('/settings/plugins')) return 'plugins';
    return 'general'; // default to general
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
    if (tabValue !== currentTabRef.current && VALID_TABS.includes(tabValue)) {
      currentTabRef.current = tabValue;
      navigate(TAB_ROUTES[tabValue]);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Settings</h2>
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="mb-6">
          <TabsTrigger value="general">
            <SettingsIcon className="h-4 w-4" />
            General
          </TabsTrigger>
          {hasPermission(Permission.STORAGE_UNITS_READ) && (
            <TabsTrigger value="storage">
              <BoxIcon className="h-4 w-4" />
              Storage
            </TabsTrigger>
          )}
          {hasPermission(Permission.SEARCH_INDEXES_READ) && (
            <TabsTrigger value="search">
              <SearchIcon className="h-4 w-4" />
              Search
            </TabsTrigger>
          )}
          <TabsTrigger value="plugins">
            <PlugIcon className="h-4 w-4" />
            Plugins
          </TabsTrigger>
          {/* <TabsTrigger value="notifications">
            <BellIcon className="h-4 w-4" />
            Notifications
          </TabsTrigger> */}
        </TabsList>
        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>
        <TabsContent value="storage">
          <StorageSettings />
        </TabsContent>
        <TabsContent value="search">
          <SearchSettings />
        </TabsContent>
        <TabsContent value="plugins">
          <PluginSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
