import { 
  LayoutDashboard, 
  ClipboardList, 
  FolderKanban, 
  FileText, 
  ChevronRight,
  LogOut,
  Settings,
  User
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
      className="border-r border-sidebar-border"
      collapsible="icon"
    >
      <SidebarHeader className="p-4">
        <div className={cn(
          "flex items-center gap-3 transition-all duration-200",
          collapsed && "justify-center"
        )}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-md">
            <FolderKanban className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-base font-semibold text-sidebar-foreground">任务协同</span>
              <span className="text-xs text-sidebar-foreground/60">企业管理平台</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-xs font-medium text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-2",
            collapsed && "sr-only"
          )}>
            主导航
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
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
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                          isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {!collapsed && <span className="font-medium">{item.title}</span>}
                        {!collapsed && isActive && (
                          <ChevronRight className="ml-auto h-4 w-4" />
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
              "flex items-center gap-3 w-full rounded-lg p-2 hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center"
            )}>
              <Avatar className="h-9 w-9 border-2 border-sidebar-primary/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
                  张
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-sidebar-foreground">张明</span>
                  <span className="text-xs text-sidebar-foreground/60">技术部 · 经理</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              个人信息
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              系统设置
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
