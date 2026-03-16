import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  FileText,
  ChevronRight,
  LogOut,
  Settings,
  User as UserIcon,
  Sparkles,
  Workflow,
  Users
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useUserContext } from "@/contexts/UserContext";

const mainNavItems = [
  { title: "工作台", url: "/", icon: LayoutDashboard },
  { title: "待办中心", url: "/todos", icon: ClipboardList },
  { title: "任务中心", url: "/tasks", icon: FolderKanban },
  { title: "流程中心", url: "/processes", icon: Workflow },
  { title: "文档中心", url: "/documents", icon: FileText },
  { title: "用户管理", url: "/settings/users", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { currentUser, users, switchUser } = useUserContext();

  return (
    <Sidebar
      className="border-r border-sidebar-border bg-sidebar shadow-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-4 pb-6">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          collapsed && "justify-center"
        )}>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-600/30">
            <FolderKanban className="h-5 w-5 text-white" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-base font-semibold text-sidebar-foreground flex items-center gap-1.5">
                任务协同
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </span>
              <span className="text-xs text-sidebar-muted">企业管理平台</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {mainNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <NavLink
                        to={item.url}
                        className={cn(
                          "group flex items-center gap-4 rounded-xl px-4 py-5 transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                            : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                        )}
                      >
                        <item.icon className={cn(
                          "h-8 w-8 shrink-0 transition-colors",
                          isActive ? "text-white" : "text-sidebar-muted group-hover:text-primary"
                        )} />
                        {!collapsed && (
                          <>
                            <span className={cn(
                              "text-base font-medium transition-colors",
                              isActive ? "text-white" : "group-hover:text-foreground"
                            )}>{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-5 w-5 text-white/70" />
                            )}
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "group flex items-center gap-3 w-full rounded-lg p-2 hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200",
              collapsed && "justify-center"
            )}>
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-blue-600/20 ring-offset-2 ring-offset-sidebar-background transition-all group-hover:ring-blue-600/40">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-sm font-semibold">
                    {currentUser.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-sidebar-background" />
              </div>
              {!collapsed && (
                <div className="flex flex-col items-start animate-fade-in truncate">
                  <span className="text-sm font-medium text-sidebar-foreground truncate w-full text-left">{currentUser.name}</span>
                  <span className="text-xs text-sidebar-muted truncate w-full text-left">{currentUser.department}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5 text-xs font-normal text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>切换身份 (仅测试用)</span>
            </DropdownMenuLabel>
            <div className="max-h-48 overflow-y-auto">
              {users.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  className={cn(
                    "cursor-pointer flex items-center justify-between",
                    user.id === currentUser.id && "bg-accent/50 font-medium"
                  )}
                  onClick={() => switchUser(user.id)}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span>{user.name}</span>
                  </div>
                  {user.id === currentUser.id && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>个人信息</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>设置</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
