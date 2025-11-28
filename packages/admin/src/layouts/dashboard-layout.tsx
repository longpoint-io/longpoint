import { AppSidebar } from '@/components/app-sidebar';
import { SearchBar } from '@/components/search-bar';
import { UploadDialog } from '@/components/upload-dialog';
import { UploadProvider, useUploadContext } from '@/contexts/upload-context';
import { useSearchStatus } from '@/hooks/domain/use-search-status';
import { Button } from '@longpoint/ui/components/button';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@longpoint/ui/components/sidebar';
import { UploadIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
  children: ReactNode;
}

function HeaderContent() {
  const { isSearchSetup, isLoading: isSearchStatusLoading } = useSearchStatus();
  const { openDialog } = useUploadContext();

  return (
    <div className="flex items-center gap-2 p-4 border-b">
      <SidebarTrigger className="h-8 w-8" />
      {!isSearchStatusLoading && isSearchSetup && <SearchBar />}
      <div className="ml-auto">
        <Button onClick={() => openDialog()} variant="outline">
          <UploadIcon className="h-4 w-4" />
          Upload
        </Button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <UploadProvider>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1">
            <HeaderContent />
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              {children}
            </div>
          </main>
        </SidebarProvider>
        <UploadDialog />
      </UploadProvider>
    </div>
  );
}
