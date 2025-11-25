import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@longpoint/ui/components/tabs';
import { BoxIcon, SearchIcon, SettingsIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { GeneralSettings } from './general-settings';
import { NotificationSettings } from './notification-settings';
import { SearchSettings } from './search-settings';
import { StorageSettings } from './storage-settings';

const VALID_TABS = ['general', 'storage', 'search'] as const;
type TabValue = (typeof VALID_TABS)[number];

export function Settings() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const currentTab: TabValue =
    tab && VALID_TABS.includes(tab as TabValue) ? (tab as TabValue) : 'general';

  const currentTabRef = useRef(currentTab);

  useEffect(() => {
    // Default path when tab is invalid
    if (!tab || !VALID_TABS.includes(tab as TabValue)) {
      navigate('/settings/general', { replace: true });
    }
  }, [tab, navigate]);

  useEffect(() => {
    // Make sure the current tab stays in sync when navigating back/forward
    const currentTab = location.pathname.split('/').pop() as TabValue;
    if (currentTab && VALID_TABS.includes(currentTab)) {
      currentTabRef.current = currentTab;
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    // onValueChange triggers on mount, so do this to prevent redundant navigation
    if (value !== currentTabRef.current) {
      currentTabRef.current = value as TabValue;
      navigate(`/settings/${value}`);
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
          <TabsTrigger value="storage">
            <BoxIcon className="h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="search">
            <SearchIcon className="h-4 w-4" />
            Search
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
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
