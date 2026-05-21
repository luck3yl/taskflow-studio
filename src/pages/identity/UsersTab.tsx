import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Edit,
  Search,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flattenDepartmentTree,
  getDescendantIds,
  getRoleLabel,
  useUserContext,
} from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
} from "@/services/apis/users";
import type { DepartmentDto, UserDto } from "@/types/user";

export function UsersTab() {
  const { departmentTree, userDtos, roles, can, refreshUsers } =
    useUserContext();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(
    departmentTree.map((d) => d.id),
  );
  const [displayUsers, setDisplayUsers] = useState<UserDto[]>(userDtos);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [isUserSheetOpen, setIsUserSheetOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    staffId: "",
    departmentId: "",
    email: "",
    avatar: "",
    roleIds: [] as string[],
  });

  const canManageUsers = can("user:manage");
  const allFlatDepts = flattenDepartmentTree(departmentTree);

  const loadUsers = useCallback(
    async (deptId?: string, searchText?: string) => {
      setLoadingUsers(true);
      try {
        const params: { departmentId?: string; search?: string } = {};
        if (deptId && deptId !== "all") params.departmentId = deptId;
        if (searchText) params.search = searchText;
        const data = await getUsersApi(params);
        setDisplayUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load users", error);
        setDisplayUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUsers(selectedDepartment, search);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadUsers, search, selectedDepartment]);

  const getDeptMemberCount = (deptId: string) => {
    const deptIds = getDescendantIds(departmentTree, deptId);
    return userDtos.filter((user) => deptIds.includes(user.departmentId))
      .length;
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDeptIds((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId],
    );
  };

  const openUserSheet = (user?: UserDto) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        name: user.name || `${user.lastName}${user.firstName}`,
        staffId: user.staffId || "",
        departmentId: user.departmentId || "",
        email: user.email || "",
        avatar: user.avatar || "",
        roleIds: user.roles || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: "",
        password: "",
        name: "",
        staffId: "",
        departmentId: allFlatDepts[0]?.id || "",
        email: "",
        avatar: "",
        roleIds: ["staff"],
      });
    }

    setIsUserSheetOpen(true);
  };

  const handleUserSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({ title: "请填写姓名和邮箱", variant: "destructive" });
      return;
    }

    const fullName = formData.name.trim();
    const lastName = fullName.charAt(0);
    const firstName = fullName.slice(1) || fullName;

    try {
      if (editingUser) {
        await updateUserApi(editingUser.id, {
          firstName,
          lastName,
          email: formData.email,
          staffId: formData.staffId || undefined,
          departmentId: formData.departmentId || undefined,
          avatar: formData.avatar || undefined,
        });
        toast({ title: "用户信息已更新" });
      } else {
        if (!formData.username.trim() || !formData.password.trim()) {
          toast({ title: "请填写用户名和密码", variant: "destructive" });
          return;
        }

        await createUserApi({
          username: formData.username,
          password: formData.password,
          firstName,
          lastName,
          email: formData.email,
          staffId: formData.staffId || undefined,
          departmentId: formData.departmentId || undefined,
          avatar: formData.avatar || lastName,
          roleIds: formData.roleIds,
        });
        toast({ title: "用户已创建" });
      }

      await refreshUsers();
      await loadUsers(selectedDepartment, search);
      setIsUserSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserApi(userId);
      await refreshUsers();
      await loadUsers(selectedDepartment, search);
      toast({ title: "用户已停用" });
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleRole = (roleId: string, checked: boolean | "indeterminate") => {
    setFormData((prev) => ({
      ...prev,
      roleIds:
        checked === true
          ? [...prev.roleIds, roleId]
          : prev.roleIds.filter((id) => id !== roleId),
    }));
  };

  const renderDeptTreeNode = (dept: DepartmentDto) => {
    const children = dept.children || [];
    const isExpanded = expandedDeptIds.includes(dept.id);
    const isActive = selectedDepartment === dept.id;
    const memberCount = dept.memberCount ?? getDeptMemberCount(dept.id);

    return (
      <div key={dept.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSelectedDepartment(dept.id)}
          className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            isActive
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {children.length > 0 ? (
                <span
                  role="button"
                  tabIndex={0}
                  className="shrink-0 text-muted-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleDepartment(dept.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      toggleDepartment(dept.id);
                    }
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </span>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="truncate">{dept.name}</span>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {memberCount}
            </span>
          </div>
        </button>

        {children.length > 0 && isExpanded && (
          <div className="ml-5 space-y-0.5 border-l border-border/40 pl-2.5">
            {children.map((child) => renderDeptTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="grid items-start gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="border-border/50 bg-white/80 shadow-sm xl:sticky xl:top-6 dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-4 pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">部门筛选</span>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto p-2.5">
            <button
              type="button"
              onClick={() => setSelectedDepartment("all")}
              className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                selectedDepartment === "all"
                  ? "bg-primary font-medium text-primary-foreground"
                  : "hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>全部用户</span>
                <span className="text-xs opacity-70">{userDtos.length}</span>
              </div>
            </button>
            {departmentTree.map((dept) => renderDeptTreeNode(dept))}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white/80 shadow-sm dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-4 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索姓名、工号、部门..."
                  className="h-9 rounded-lg pl-9 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {loadingUsers ? "加载中..." : `${displayUsers.length} 人`}
                </span>
                {canManageUsers && (
                  <Button
                    size="sm"
                    className="h-9 rounded-lg gradient-primary text-xs"
                    onClick={() => openUserSheet()}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                    新建用户
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-4 py-3 text-xs font-semibold text-foreground">
                    用户
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    部门
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    角色
                  </TableHead>
                  <TableHead className="text-xs font-semibold text-foreground">
                    状态
                  </TableHead>
                  {canManageUsers && (
                    <TableHead className="pr-4 text-xs font-semibold text-foreground">
                      操作
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayUsers.map((user) => (
                  <TableRow key={user.id} className="group hover:bg-muted/5">
                    <TableCell className="pl-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {user.avatar ||
                              (user.name || user.username || "?").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {user.name || `${user.lastName}${user.firstName}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.staffId ? `${user.staffId} · ` : ""}
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.department || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(user.roles || []).map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className="px-1.5 py-0 text-[11px]"
                          >
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`inline-flex items-center gap-1.5 text-xs ${
                          user.isActive
                            ? "text-green-600"
                            : "text-muted-foreground"
                        }`}
                      >
                        <div
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.isActive ? "bg-green-500" : "bg-slate-300"
                          }`}
                        />
                        {user.isActive ? "启用" : "停用"}
                      </div>
                    </TableCell>
                    {canManageUsers && (
                      <TableCell className="pr-4">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => openUserSheet(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!loadingUsers && displayUsers.length === 0 && (
              <div className="py-16 text-center">
                <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">暂无用户</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={isUserSheetOpen} onOpenChange={setIsUserSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              {editingUser ? (
                <Edit className="h-5 w-5 text-primary" />
              ) : (
                <UserPlus className="h-5 w-5 text-primary" />
              )}
              {editingUser ? "编辑用户" : "新建用户"}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {!editingUser && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-sm">用户名</Label>
                    <Input
                      placeholder="登录用户名"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">密码</Label>
                    <Input
                      type="password"
                      placeholder="登录密码"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="h-10 rounded-lg text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">姓名</Label>
                  <Input
                    placeholder="如 张三"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">邮箱</Label>
                  <Input
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">工号</Label>
                  <Input
                    placeholder="T001（可选）"
                    value={formData.staffId}
                    onChange={(e) =>
                      setFormData({ ...formData, staffId: e.target.value })
                    }
                    className="h-10 rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">部门</Label>
                  <Select
                    value={formData.departmentId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, departmentId: value })
                    }
                  >
                    <SelectTrigger className="h-10 rounded-lg text-sm">
                      <SelectValue placeholder="选择部门" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {allFlatDepts.map((dept) => (
                        <SelectItem
                          key={dept.id}
                          value={dept.id}
                          className="text-sm"
                        >
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">角色</Label>
                <div className="grid gap-2 rounded-xl border border-border/50 bg-muted/10 p-4 md:grid-cols-2">
                  {roles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start gap-2 rounded-lg border border-transparent px-2 py-2 text-sm transition-colors hover:border-border/60 hover:bg-background/80"
                    >
                      <Checkbox
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={(checked) =>
                          toggleRole(role.id, checked)
                        }
                      />
                      <span className="min-w-0">
                        <span className="block font-medium">
                          {getRoleLabel(role.id)}
                        </span>
                        {role.description && (
                          <span className="block text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsUserSheetOpen(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleUserSubmit}
              className="gradient-primary rounded-lg"
            >
              {editingUser ? "保存" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
