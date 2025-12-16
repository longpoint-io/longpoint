import { useAuth } from '@/auth';
import { useClient } from '@/hooks/common/use-client';
import { Permission } from '@longpoint/types';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@longpoint/ui/components/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@longpoint/ui/components/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@longpoint/ui/components/sidebar';
import { useQuery } from '@tanstack/react-query';
import {
  BookmarkIcon,
  ChevronDown,
  HomeIcon,
  ImagesIcon,
  LogOutIcon,
  Move3dIcon,
  ScanSearchIcon,
  Settings2Icon,
  SettingsIcon,
  UsersIcon,
  WorkflowIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppSidebar() {
  const { signOut, session, hasPermission } = useAuth();
  const user = session?.user;
  const client = useClient();

  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => client.system.getSystemStatus(),
  });

  const sidebarItems = [
    {
      label: 'Home',
      url: '/',
      icon: HomeIcon,
    },
    {
      label: 'Assets',
      url: '/assets',
      icon: ImagesIcon,
      visible: () => {
        return hasPermission(Permission.ASSETS_READ);
      },
    },
    {
      label: 'Collections',
      url: '/collections',
      icon: BookmarkIcon,
      visible: () => {
        return hasPermission(Permission.COLLECTIONS_READ);
      },
    },
    {
      label: 'Classifiers',
      url: '/classifier-templates',
      icon: ScanSearchIcon,
      visible: () => {
        return hasPermission(Permission.CLASSIFIERS_READ);
      },
    },
    {
      label: 'Transformers',
      url: '/transform/templates',
      icon: Move3dIcon,
      visible: () => {
        return hasPermission(Permission.TRANSFORM_TEMPLATES_READ);
      },
    },
    {
      label: 'Rules',
      url: '/rules',
      icon: WorkflowIcon,
      visible: () => {
        return hasPermission(Permission.RULES_READ);
      },
    },
    {
      label: 'Users & Roles',
      url: '/users',
      icon: UsersIcon,
      visible: () => {
        return hasPermission(Permission.USERS_READ);
      },
    },
    {
      label: 'Settings',
      url: '/settings/general',
      icon: Settings2Icon,
      visible: () => {
        return [
          Permission.STORAGE_UNITS_READ,
          Permission.SEARCH_INDEXES_READ,
          Permission.PLUGINS_READ,
        ].some(hasPermission);
      },
      subItems: [
        {
          label: 'General',
          url: '/settings/general',
        },
        {
          label: 'Storage',
          url: '/settings/storage',
          visible: () => {
            return hasPermission(Permission.STORAGE_UNITS_READ);
          },
        },
        {
          label: 'Search',
          url: '/settings/search',
          // icon: SearchIcon,
          visible: () => {
            return hasPermission(Permission.SEARCH_INDEXES_READ);
          },
        },
        {
          label: 'Plugins',
          url: '/settings/plugins',
          visible: () => {
            return hasPermission(Permission.PLUGINS_READ);
          },
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="hover:bg-transparent active:bg-transparent"
            >
              <div className="flex items-center gap-2">
                <Avatar className="rounded-full border-[0.5px]">
                  <AvatarImage
                    src={systemStatus?.logoUrl ?? undefined}
                    alt="Site logo"
                  />
                  <AvatarFallback className="rounded-full border">
                    {systemStatus?.name?.charAt(0)?.toUpperCase() || 'L'}
                  </AvatarFallback>
                </Avatar>
                <span className=" font-semibold text-sidebar-foreground">
                  {systemStatus?.name || 'Longpoint Admin'}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* <SidebarSeparator /> */}
      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel>Dashboard</SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarItems
                .filter((item) => (item.visible ? item.visible() : true))
                .map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.subItems && (
                      <SidebarMenuSub>
                        {item.subItems
                          .filter((subItem) =>
                            subItem.visible ? subItem.visible() : true
                          )
                          .map((subItem) => (
                            <SidebarMenuSubItem key={subItem.label}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span>{subItem.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-full">
                    <AvatarImage
                      src={user?.image ?? undefined}
                      alt={user?.name}
                    />
                    <AvatarFallback className="rounded-full border">
                      {user?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <SettingsIcon />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut}>
                  <LogOutIcon />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      {/* <SidebarRail /> */}
    </Sidebar>
  );
}
