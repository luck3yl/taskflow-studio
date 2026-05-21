import { useState } from "react";
import { Edit, Key, Loader2, Plus, Shield, Trash2, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
  PERMISSION_LABELS,
  getRoleLabel,
  useUserContext,
} from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  addRoleUserApi,
  createRoleApi,
  deleteRoleApi,
  getAllPermissionsApi,
  getRolePermissionsApi,
  getRoleUsersApi,
  removeRoleUserApi,
  updateRoleApi,
  updateRolePermissionsApi,
} from "@/services/apis/roles";
import { getUsersApi } from "@/services/apis/users";
import type { Permission, RoleDto, RoleUserDto, UserDto } from "@/types/user";

const avatarFallbackClassName =
  "bg-primary text-xs font-medium text-primary-foreground";
const metaBadgeClassName =
  "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground";

function getDisplayName(name?: string | null) {
  return name?.trim() || "未命名用户";
}

function getAvatarLabel(name?: string | null) {
  return getDisplayName(name).slice(0, 1);
}

function getDisplayRoleName(role: RoleDto) {
  if (role.name?.trim()) return role.name;

  const builtinLabel = getRoleLabel(role.id);
  return builtinLabel === role.id ? "未命名角色" : builtinLabel;
}

export function RoleManagementContent() {
  const { roles, can, refreshRoles } = useUserContext();
  const { toast } = useToast();

  const canManage = can("role:manage");

  const [isRoleSheetOpen, setIsRoleSheetOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleForm, setRoleForm] = useState({ name: "", description: "" });

  const [isPermSheetOpen, setIsPermSheetOpen] = useState(false);
  const [permRole, setPermRole] = useState<RoleDto | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  const [isUsersSheetOpen, setIsUsersSheetOpen] = useState(false);
  const [usersRole, setUsersRole] = useState<RoleDto | null>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUserDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState("");

  const openRoleSheet = (role?: RoleDto) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ name: role.name, description: role.description });
    } else {
      setEditingRole(null);
      setRoleForm({ name: "", description: "" });
    }

    setIsRoleSheetOpen(true);
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.name.trim()) {
      toast({ title: "请填写角色名称", variant: "destructive" });
      return;
    }

    try {
      if (editingRole) {
        await updateRoleApi(editingRole.id, {
          name: roleForm.name,
          description: roleForm.description,
        });
        toast({ title: "角色已更新" });
      } else {
        await createRoleApi({
          name: roleForm.name,
          description: roleForm.description,
        });
        toast({ title: "角色已创建" });
      }

      await refreshRoles();
      setIsRoleSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId === "admin") {
      toast({ title: "系统管理员角色不可删除", variant: "destructive" });
      return;
    }

    try {
      await deleteRoleApi(roleId);
      await refreshRoles();
      toast({ title: "角色已删除" });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openPermSheet = async (role: RoleDto) => {
    setPermRole(role);
    setPermLoading(true);
    setIsPermSheetOpen(true);

    try {
      const [permissions, all] = await Promise.all([
        getRolePermissionsApi(role.id),
        getAllPermissionsApi(),
      ]);
      setRolePermissions(Array.isArray(permissions) ? permissions : []);
      setAllPermissions(Array.isArray(all) ? all : []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = (permission: Permission) => {
    setRolePermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission],
    );
  };

  const handleSavePerms = async () => {
    if (!permRole) return;

    try {
      await updateRolePermissionsApi(permRole.id, rolePermissions);
      toast({ title: "权限已保存" });
      setIsPermSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "保存失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openUsersSheet = async (role: RoleDto) => {
    setUsersRole(role);
    setUsersLoading(true);
    setIsUsersSheetOpen(true);
    setAddUserSearch("");

    try {
      const [users, all] = await Promise.all([
        getRoleUsersApi(role.id),
        getUsersApi(),
      ]);
      setRoleUsers(Array.isArray(users) ? users : []);
      setAllUsers(Array.isArray(all) ? all : []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUser = async (userId: string) => {
    if (!usersRole) return;

    try {
      await addRoleUserApi(usersRole.id, userId);
      const users = await getRoleUsersApi(usersRole.id);
      setRoleUsers(Array.isArray(users) ? users : []);
      toast({ title: "用户已加入角色" });
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!usersRole) return;

    try {
      await removeRoleUserApi(usersRole.id, userId);
      setRoleUsers((prev) => prev.filter((user) => user.id !== userId));
      toast({ title: "用户已移出角色" });
    } catch (error: any) {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const availableUsers = allUsers.filter(
    (user) =>
      !roleUsers.some((roleUser) => roleUser.id === user.id) &&
      (addUserSearch
        ? user.name.includes(addUserSearch) ||
          user.username.includes(addUserSearch) ||
          (user.department || "").includes(addUserSearch)
        : true),
  );

  const userDetailsById = new Map(allUsers.map((user) => [user.id, user]));

  const getPermissionLabel = (permission: Permission) =>
    PERMISSION_LABELS[permission] || "未命名权限";

  return (
    <>
      <Card className="border-border/50 bg-white/80 shadow-sm dark:bg-black/20">
        <div className="flex items-center justify-between border-b border-border/30 p-4 pb-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-semibold">
              <Shield className="h-5 w-5 text-primary" />
              角色列表
            </p>
            <p className="text-xs text-muted-foreground">
              角色用于控制页面访问范围和操作能力，与部门、工作组配置相互独立。
            </p>
          </div>
          {canManage && (
            <Button
              size="sm"
              className="h-8 rounded-lg gradient-primary text-xs"
              onClick={() => openRoleSheet()}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              新建角色
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-xs font-semibold">
                  角色
                </TableHead>
                <TableHead className="text-xs font-semibold">说明</TableHead>
                <TableHead className="text-xs font-semibold">状态</TableHead>
                <TableHead className="pr-4 text-xs font-semibold">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-muted/5">
                  <TableCell className="py-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-sm font-medium">
                        {getDisplayRoleName(role)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {role.description?.trim() || "暂无说明"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={role.isActive ? "default" : "outline"}
                      className="text-[11px]"
                    >
                      {role.isActive ? "启用" : "停用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => void openPermSheet(role)}
                      >
                        <Key className="mr-1 h-3 w-3" />
                        权限
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => void openUsersSheet(role)}
                      >
                        <Users className="mr-1 h-3 w-3" />
                        用户
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs"
                            onClick={() => openRoleSheet(role)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-1.5 text-xs text-destructive"
                            onClick={() => void handleDeleteRole(role.id)}
                            disabled={role.id === "admin"}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {roles.length === 0 && (
            <div className="py-12 text-center">
              <Shield className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">暂无角色</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isRoleSheetOpen} onOpenChange={setIsRoleSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle>{editingRole ? "编辑角色" : "新建角色"}</SheetTitle>
            <SheetDescription>
              填写角色名称和职责说明后即可保存。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">名称</Label>
                <Input
                  placeholder="请输入角色名称"
                  value={roleForm.name}
                  onChange={(event) =>
                    setRoleForm({ ...roleForm, name: event.target.value })
                  }
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">说明</Label>
                <Input
                  placeholder="可选，补充角色职责"
                  value={roleForm.description}
                  onChange={(event) =>
                    setRoleForm({
                      ...roleForm,
                      description: event.target.value,
                    })
                  }
                  className="h-10 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsRoleSheetOpen(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleRoleSubmit}
              className="rounded-lg gradient-primary"
            >
              {editingRole ? "保存" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isPermSheetOpen} onOpenChange={setIsPermSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-2xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              权限配置 / {permRole ? getDisplayRoleName(permRole) : ""}
            </SheetTitle>
            <SheetDescription>
              这里只展示中文权限名称，选项区域已压缩为更紧凑的列表样式。
            </SheetDescription>
          </SheetHeader>

          {permLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid flex-1 gap-2 overflow-y-auto p-6 sm:grid-cols-2">
              {allPermissions.map((permission) => (
                <label
                  key={permission}
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/50 bg-background px-3 py-2 transition-colors hover:bg-muted/30"
                >
                  <Checkbox
                    checked={rolePermissions.includes(permission)}
                    onCheckedChange={() => togglePermission(permission)}
                    disabled={!canManage}
                  />
                  <span className="text-sm leading-5">
                    {getPermissionLabel(permission)}
                  </span>
                </label>
              ))}
            </div>
          )}

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsPermSheetOpen(false)}
              className="rounded-lg"
            >
              关闭
            </Button>
            {canManage && (
              <Button
                onClick={handleSavePerms}
                className="rounded-lg gradient-primary"
              >
                保存
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isUsersSheetOpen} onOpenChange={setIsUsersSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-4xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {usersRole
                ? `${getDisplayRoleName(usersRole)} / 用户管理`
                : "用户管理"}
            </SheetTitle>
            <SheetDescription>
              这里只会把已有账号关联到当前角色，不会创建新账号。
            </SheetDescription>
          </SheetHeader>

          {usersLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">当前用户</Label>
                      <span className="text-xs text-muted-foreground">
                        {roleUsers.length} 人
                      </span>
                    </div>

                    <div className="space-y-2">
                      {roleUsers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          当前角色还没有关联用户
                        </div>
                      )}

                      {roleUsers.map((user) => {
                        const detail = userDetailsById.get(user.id);

                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 px-3 py-3"
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback
                                  className={avatarFallbackClassName}
                                >
                                  {getAvatarLabel(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {getDisplayName(user.name)}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1.5">
                                  <span className={metaBadgeClassName}>
                                    {detail?.department?.trim() || "未分配部门"}
                                  </span>
                                  <span className={metaBadgeClassName}>
                                    {detail?.staffId
                                      ? "已设置工号"
                                      : "未设置工号"}
                                  </span>
                                  <span className={metaBadgeClassName}>
                                    {detail?.email
                                      ? "已设置邮箱"
                                      : "未设置邮箱"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {canManage && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() => void handleRemoveUser(user.id)}
                              >
                                移除
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">
                        添加已有用户
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        这里只会把已有账号关联到当前角色。
                      </p>
                    </div>

                    <Input
                      placeholder="搜索姓名、账号或部门"
                      value={addUserSearch}
                      onChange={(event) => setAddUserSearch(event.target.value)}
                      className="h-10 rounded-lg text-sm"
                    />

                    <div className="space-y-2">
                      {availableUsers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          没有可加入的用户
                        </div>
                      )}

                      {availableUsers.slice(0, 24).map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between rounded-xl border border-border/50 bg-background px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback
                                className={avatarFallbackClassName}
                              >
                                {getAvatarLabel(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {getDisplayName(user.name)}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <span className={metaBadgeClassName}>
                                  {user.department?.trim() || "未分配部门"}
                                </span>
                                {!user.staffId && (
                                  <span className={metaBadgeClassName}>
                                    未设置工号
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => void handleAddUser(user.id)}
                          >
                            添加
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <SheetFooter className="border-t border-border/50 px-6 py-4">
                <Button
                  variant="ghost"
                  onClick={() => setIsUsersSheetOpen(false)}
                  className="rounded-lg"
                >
                  关闭
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
