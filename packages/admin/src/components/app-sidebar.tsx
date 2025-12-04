import { useAuth } from '@/auth';
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
import {
  BookmarkIcon,
  ChevronDown,
  HomeIcon,
  ImagesIcon,
  LogOutIcon,
  PlugIcon,
  ScanSearchIcon,
  Settings2Icon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function AppSidebar() {
  const { signOut, session, hasPermission } = useAuth();
  const user = session?.user;

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
      url: '/classifiers',
      icon: ScanSearchIcon,
      visible: () => {
        return hasPermission(Permission.CLASSIFIERS_READ);
      },
    },
    {
      label: 'Plugins',
      url: '/plugins',
      icon: PlugIcon,
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
      url: '/settings',
      icon: Settings2Icon,
      subItems: [
        {
          label: 'General',
          url: '/settings/general',
        },
        {
          label: 'Storage',
          url: '/settings/storage',
        },
        {
          label: 'Search',
          url: '/settings/search',
          // icon: SearchIcon,
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
                <Avatar className="rounded-full">
                  <AvatarFallback className="rounded-full border">
                    L
                  </AvatarFallback>
                </Avatar>
                <span className=" font-semibold text-sidebar-foreground">
                  Longpoint Admin
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
                        {item.subItems.map((subItem) => (
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
