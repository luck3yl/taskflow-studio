import {
  LayoutDashboard,
  ClipboardList,
  FolderKanban,
  FileText,
  ChevronRight,
  ChevronDown,
  LogOut,
  Settings,
  User as UserIcon,
  Sparkles,
  Workflow,
  Users,
  Search,
  GraduationCap,
  Star,
  Presentation,
  Bell,
  Map,
  Mountain,
  Grid3X3,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
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
import { summarizeUserRole, useUserContext } from "@/contexts/UserContext";
import { useState, useCallback } from "react";
import { TaskType } from "@/contexts/TaskContext";

interface TaskTypeNavItem {
  type: TaskType;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface TaskTypeGroup {
  groupLabel: string;
  items: TaskTypeNavItem[];
}

const taskTypeGroups: TaskTypeGroup[] = [
  {
    groupLabel: "综合管理",
    items: [
      { type: "调研反馈", label: "调研反馈", icon: Search, color: "text-blue-500" },
      { type: "例会反馈", label: "例会反馈", icon: Users, color: "text-indigo-500" },
      { type: "例会资料", label: "例会资料", icon: Presentation, color: "text-rose-500" },
      { type: "督办事务", label: "督办事务", icon: Bell, color: "text-orange-500" },
    ],
  },
  {
    groupLabel: "对标找差",
    items: [
      { type: "行动计划", label: "行动计划", icon: Map, color: "text-green-500" },
      { type: "培训交流", label: "培训交流", icon: GraduationCap, color: "text-cyan-500" },
      { type: "他山之石", label: "他山之石", icon: Mountain, color: "text-teal-500" },
      { type: "标杆机组评价", label: "标杆机组评价", icon: Star, color: "text-amber-500" },
      { type: "体系能力评价", label: "体系能力评价", icon: Grid3X3, color: "text-purple-500" },
    ],
  },
];

const staticNavItems = [
  { title: "工作台", url: "/", icon: LayoutDashboard },
  { title: "待办中心", url: "/todos", icon: ClipboardList },
  { title: "流程中心", url: "/processes", icon: Workflow },
  { title: "文档中心", url: "/documents", icon: FileText },
  { title: "用户管理", url: "/settings/users", icon: Users },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, users, switchUser } = useUserContext();

  const isOnTasksPage = location.pathname.startsWith("/tasks");
  const [taskMenuOpen, setTaskMenuOpen] = useState(isOnTasksPage);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = useCallback((groupLabel: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  }, []);

  const currentTaskType = (() => {
    const match = location.pathname.match(/^\/tasks\/(.+)$/);
    if (!match) return null;
    const raw = decodeURIComponent(match[1]);
    if (raw.startsWith("create")) return null;
    return raw;
  })();

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
            <SidebarMenu className="space-y-0.5">

              {/* 工作台 + 待办中心 */}
              {staticNavItems.slice(0, 2).map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                            : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-sidebar-muted group-hover:text-primary")} />
                        {!collapsed && (
                          <span className={cn("text-sm font-medium", isActive ? "text-white" : "group-hover:text-foreground")}>{item.title}</span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* 任务中心 — 可展开 */}
              <SidebarMenuItem>
                <button
                  onClick={() => {
                    if (collapsed) {
                      navigate("/tasks");
                    } else {
                      setTaskMenuOpen(v => !v);
                      if (!isOnTasksPage) navigate("/tasks");
                    }
                  }}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                    isOnTasksPage && !currentTaskType
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                      : isOnTasksPage
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                  )}
                >
                  <FolderKanban className={cn(
                    "h-5 w-5 shrink-0",
                    isOnTasksPage ? (currentTaskType ? "text-blue-600" : "text-white") : "text-sidebar-muted group-hover:text-primary"
                  )} />
                  {!collapsed && (
                    <>
                      <span className={cn(
                        "text-sm font-medium flex-1 text-left",
                        isOnTasksPage && !currentTaskType ? "text-white" : isOnTasksPage ? "text-blue-700" : "group-hover:text-foreground"
                      )}>任务中心</span>
                      {taskMenuOpen
                        ? <ChevronDown className={cn("h-4 w-4 transition-transform", isOnTasksPage && !currentTaskType ? "text-white/70" : "text-muted-foreground")} />
                        : <ChevronRight className={cn("h-4 w-4 transition-transform", isOnTasksPage && !currentTaskType ? "text-white/70" : "text-muted-foreground")} />
                      }
                    </>
                  )}
                </button>

                {/* 任务类型子菜单 */}
                {!collapsed && taskMenuOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-1 py-1">
                    {taskTypeGroups.map((group) => {
                      const isGroupCollapsed = !!collapsedGroups[group.groupLabel];
                      return (
                        <div key={group.groupLabel}>
                          <button
                            onClick={() => toggleGroup(group.groupLabel)}
                            className={cn(
                              "group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 text-sm font-medium",
                              "text-sidebar-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground"
                            )}
                          >
                            <span className="flex-1 text-left">{group.groupLabel}</span>
                            {isGroupCollapsed
                              ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            }
                          </button>
                          {!isGroupCollapsed && (
                            <div className="space-y-0.5 mt-0.5">
                              {group.items.map((item) => {
                                const Icon = item.icon;
                                const isTypeActive = currentTaskType === item.type;
                                return (
                                  <div key={item.type}>
                                    <NavLink
                                      to={`/tasks/${encodeURIComponent(item.type)}`}
                                      className={cn(
                                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-150 text-sm",
                                        isTypeActive
                                          ? "bg-primary/10 text-primary font-semibold"
                                          : "text-sidebar-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground"
                                      )}
                                    >
                                      <Icon className={cn("h-3.5 w-3.5 shrink-0", isTypeActive ? "text-primary" : item.color)} />
                                      <span className="truncate">{item.label}</span>
                                      {isTypeActive && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                      )}
                                    </NavLink>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </SidebarMenuItem>

              {/* 其余静态菜单 */}
              {staticNavItems.slice(2).map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                          isActive
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                            : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-white" : "text-sidebar-muted group-hover:text-primary")} />
                        {!collapsed && (
                          <span className={cn("text-sm font-medium", isActive ? "text-white" : "group-hover:text-foreground")}>{item.title}</span>
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
                  <span className="text-sm font-medium truncate w-full text-left">{currentUser.name}</span>
                  <span className="text-xs truncate w-full text-left">
                    {currentUser.department} <span className="opacity-50">|</span> {summarizeUserRole(currentUser)}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
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
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-medium leading-tight">{user.name}</span>
                      <span className="text-xs text-muted-foreground leading-tight truncate">{user.department} · {summarizeUserRole(user)}</span>
                    </div>
                  </div>
                  {user.id === currentUser.id && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
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
