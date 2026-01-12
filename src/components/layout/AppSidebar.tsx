import { 
  LayoutDashboard, 
  ClipboardList, 
  FolderKanban, 
  FileText, 
  ChevronRight,
  LogOut,
  Settings,
  User,
  Sparkles
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
} from "@/components/ui/dropdown-menu";

const mainNavItems = [
  { title: "工作台", url: "/", icon: LayoutDashboard },
  { title: "待办中心", url: "/todos", icon: ClipboardList },
  { title: "任务中心", url: "/tasks", icon: FolderKanban },
  { title: "文档中心", url: "/documents", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar 
      className="border-r border-sidebar-border/50 gradient-sidebar shadow-sidebar"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-300",
          collapsed && "justify-center"
        )}>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <FolderKanban className="h-5 w-5 text-primary-foreground" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent animate-pulse" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-base font-semibold text-sidebar-foreground flex items-center gap-1.5">
                任务协同
                <Sparkles className="h-3.5 w-3.5 text-accent" />
              </span>
              <span className="text-xs text-sidebar-foreground/50">企业管理平台</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-[10px] font-semibold text-sidebar-foreground/40 uppercase tracking-widest px-3 mb-3",
            collapsed && "sr-only"
          )}>
            主导航
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
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
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                          isActive 
                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20" 
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-white/20" 
                            : "bg-sidebar-accent/50 group-hover:bg-sidebar-accent"
                        )}>
                          <item.icon className="h-4 w-4 shrink-0" />
                        </div>
                        {!collapsed && (
                          <>
                            <span className="font-medium">{item.title}</span>
                            {isActive && (
                              <ChevronRight className="ml-auto h-4 w-4 animate-slide-right" />
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

      <SidebarFooter className="p-3 border-t border-sidebar-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "group flex items-center gap-3 w-full rounded-xl p-2.5 hover:bg-sidebar-accent transition-all duration-200",
              collapsed && "justify-center"
            )}>
              <div className="relative">
                <Avatar className="h-9 w-9 ring-2 ring-primary/20 ring-offset-2 ring-offset-sidebar-background transition-all group-hover:ring-primary/40">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-semibold">
                    张
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-sidebar-background" />
              </div>
              {!collapsed && (
                <div className="flex flex-col items-start animate-fade-in">
                  <span className="text-sm font-medium text-sidebar-foreground">张明</span>
                  <span className="text-xs text-sidebar-foreground/50">产品经理</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
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
