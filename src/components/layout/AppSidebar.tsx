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
  Building2,
  Shield,
  Circle,
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
import { useState, useCallback, useEffect } from "react";
import { logoutApi } from "@/services/apis/auth";
import {
  getProcessCategoriesGroupedApi,
  type ProcessCategoryGroup,
} from "@/services/apis/process-categories";

const staticNavItems = [
  { title: "工作台", url: "/", icon: LayoutDashboard, permission: null },
  { title: "待办中心", url: "/todos", icon: ClipboardList, permission: null },
  { title: "流程中心", url: "/processes", icon: Workflow, permission: null },
  { title: "文档中心", url: "/documents", icon: FileText, permission: null },
];

const identityNavItems = [
  { title: "部门管理", url: "/settings/departments", icon: Building2, permission: "user:manage" as const },
  { title: "用户管理", url: "/settings/users", icon: Users, permission: "user:manage" as const },
  { title: "角色管理", url: "/settings/roles", icon: Shield, permission: "user:manage" as const },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, can } = useUserContext();

  const isOnTasksPage = location.pathname.startsWith("/tasks");
  const isOnIdentityPage = location.pathname.startsWith("/settings/");

  // 根据权限过滤菜单项
  const visibleNavItems = staticNavItems.filter(item => {
    if (!item.permission) return true;
    return can(item.permission);
  });
  const visibleIdentityItems = identityNavItems.filter(item => can(item.permission));
  const [taskMenuOpen, setTaskMenuOpen] = useState(isOnTasksPage);
  const [identityMenuOpen, setIdentityMenuOpen] = useState(isOnIdentityPage);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // 从后端获取流程类别菜单
  const [categoryGroups, setCategoryGroups] = useState<ProcessCategoryGroup[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getProcessCategoriesGroupedApi({ activeOnly: true });
        const groups = Array.isArray(response) ? response : (response as any)?.data ?? [];
        setCategoryGroups(groups);
      } catch {
        // 接口失败时菜单为空
        setCategoryGroups([]);
      }
    };
    void loadCategories();
  }, []);

  const toggleGroup = useCallback((groupLabel: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupLabel]: !prev[groupLabel] }));
  }, []);

  const currentTaskType = (() => {
    const match = location.pathname.match(/^\/tasks\/(.+)$/);
    if (!match) return null;
    const raw = decodeURIComponent(match[1]);
    // 创建页面：/tasks/create/例会资料 → 提取类别名保持侧边栏高亮
    if (raw.startsWith("create/")) {
      return raw.slice("create/".length) || null;
    }
    if (raw === "create") return null;
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
              {visibleNavItems.slice(0, 2).map((item) => {
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
                      setTaskMenuOpen(true);
                    } else {
                      setTaskMenuOpen(v => !v);
                    }
                  }}
                  className={cn(
                    "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                    isOnTasksPage
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                  )}
                >
                  <FolderKanban className={cn(
                    "h-5 w-5 shrink-0",
                    isOnTasksPage ? "text-blue-600" : "text-sidebar-muted group-hover:text-primary"
                  )} />
                  {!collapsed && (
                    <>
                      <span className={cn(
                        "text-sm font-medium flex-1 text-left",
                        isOnTasksPage ? "text-blue-700" : "group-hover:text-foreground"
                      )}>任务中心</span>
                      {taskMenuOpen
                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      }
                    </>
                  )}
                </button>

                {/* 任务类型子菜单 */}
                {!collapsed && taskMenuOpen && (
                  <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-1 py-1">
                    {categoryGroups.map((group) => {
                      const isGroupCollapsed = !!collapsedGroups[group.menuGroup];
                      return (
                        <div key={group.menuGroup}>
                          <button
                            onClick={() => toggleGroup(group.menuGroup)}
                            className={cn(
                              "group w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-200 text-sm font-medium",
                              "text-sidebar-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground"
                            )}
                          >
                            <span className="flex-1 text-left">{group.menuGroup}</span>
                            {isGroupCollapsed
                              ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            }
                          </button>
                          {!isGroupCollapsed && (
                            <div className="space-y-0.5 mt-0.5">
                              {group.items.map((item) => {
                                const isTypeActive = currentTaskType === item.code;
                                return (
                                  <div key={item.code}>
                                    <NavLink
                                      to={`/tasks/${encodeURIComponent(item.code)}?name=${encodeURIComponent(item.name)}`}
                                      className={cn(
                                        "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-150 text-sm",
                                        isTypeActive
                                          ? "bg-primary/10 text-primary font-semibold"
                                          : "text-sidebar-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground"
                                      )}
                                    >
                                      <Circle className={cn("h-2 w-2 shrink-0 fill-current", isTypeActive ? "text-primary" : "text-muted-foreground/50")} />
                                      <span className="truncate">{item.name}</span>
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

              {/* 流程中心 + 文档中心 */}
              {visibleNavItems.slice(2).map((item) => {
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

              {/* 组织权限 — 可展开子菜单 */}
              {visibleIdentityItems.length > 0 && (
                <SidebarMenuItem>
                  <button
                    onClick={() => {
                      if (collapsed) {
                        navigate("/settings/departments");
                      } else {
                        setIdentityMenuOpen(v => !v);
                        if (!isOnIdentityPage) navigate("/settings/departments");
                      }
                    }}
                    className={cn(
                      "group w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                      isOnIdentityPage
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "text-sidebar-foreground hover:bg-white/60 dark:hover:bg-white/10"
                    )}
                  >
                    <Settings className={cn(
                      "h-5 w-5 shrink-0",
                      isOnIdentityPage ? "text-blue-600" : "text-sidebar-muted group-hover:text-primary"
                    )} />
                    {!collapsed && (
                      <>
                        <span className={cn(
                          "text-sm font-medium flex-1 text-left",
                          isOnIdentityPage ? "text-blue-700" : "group-hover:text-foreground"
                        )}>组织权限</span>
                        {identityMenuOpen
                          ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        }
                      </>
                    )}
                  </button>

                  {/* 组织权限子菜单 */}
                  {!collapsed && identityMenuOpen && (
                    <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-0.5 py-1">
                      {visibleIdentityItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.url;
                        return (
                          <NavLink
                            key={item.url}
                            to={item.url}
                            className={cn(
                              "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all duration-150 text-sm",
                              isActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-sidebar-foreground/80 hover:bg-white/50 dark:hover:bg-white/10 hover:text-foreground"
                            )}
                          >
                            <Icon className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            <span className="truncate">{item.title}</span>
                            {isActive && (
                              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </SidebarMenuItem>
              )}

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
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {currentUser.department} · {summarizeUserRole(currentUser)}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>个人信息</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={async () => {
                await logoutApi();
                navigate("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
