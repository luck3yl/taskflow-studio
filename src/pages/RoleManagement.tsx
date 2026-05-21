import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Users,
  Key,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserContext, getRoleLabel, PERMISSION_LABELS } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  createRoleApi,
  updateRoleApi,
  deleteRoleApi,
  getRolePermissionsApi,
  updateRolePermissionsApi,
  getRoleUsersApi,
  addRoleUserApi,
  removeRoleUserApi,
  getAllPermissionsApi,
} from "@/services/apis/roles";
import { getUsersApi } from "@/services/apis/users";
import type { RoleDto, Permission, RoleUserDto, UserDto } from "@/types/user";

export default function RoleManagement() {
  const { roles, can, refreshRoles } = useUserContext();
  const { toast } = useToast();
  const canManageRoles = can("role:manage");

  // --- 角色编辑 Dialog ---
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleForm, setRoleForm] = useState({ id: "", name: "", description: "" });

  // --- 权限配置 Dialog ---
  const [isPermDialogOpen, setIsPermDialogOpen] = useState(false);
  const [permRole, setPermRole] = useState<RoleDto | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [permLoading, setPermLoading] = useState(false);

  // --- 用户管理 Dialog ---
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [usersRole, setUsersRole] = useState<RoleDto | null>(null);
  const [roleUsers, setRoleUsers] = useState<RoleUserDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [addUserSearch, setAddUserSearch] = useState("");

  // --- 角色 CRUD ---

  const openRoleDialog = (role?: RoleDto) => {
    if (role) {
      setEditingRole(role);
      setRoleForm({ id: role.id, name: role.name, description: role.description });
    } else {
      setEditingRole(null);
      setRoleForm({ id: "", name: "", description: "" });
    }
    setIsRoleDialogOpen(true);
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.name) {
      toast({ title: "请填写角色名称", variant: "destructive" });
      return;
    }
    try {
      if (editingRole) {
        await updateRoleApi(editingRole.id, { name: roleForm.name, description: roleForm.description });
        toast({ title: "角色已更新" });
      } else {
        await createRoleApi({
          id: roleForm.id || undefined,
          name: roleForm.name,
          description: roleForm.description,
        });
        toast({ title: "角色已创建" });
      }
      await refreshRoles();
      setIsRoleDialogOpen(false);
    } catch (error: any) {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (roleId === "admin") {
      toast({ title: "admin 角色不可删除", variant: "destructive" });
      return;
    }
    try {
      await deleteRoleApi(roleId);
      await refreshRoles();
      toast({ title: "角色已删除" });
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  // --- 权限配置 ---

  const openPermDialog = async (role: RoleDto) => {
    setPermRole(role);
    setPermLoading(true);
    setIsPermDialogOpen(true);
    try {
      const [perms, all] = await Promise.all([
        getRolePermissionsApi(role.id),
        getAllPermissionsApi(),
      ]);
      setRolePermissions(Array.isArray(perms) ? perms : []);
      setAllPermissions(Array.isArray(all) ? all : []);
    } catch (error: any) {
      toast({ title: "加载权限失败", description: error.message, variant: "destructive" });
    } finally {
      setPermLoading(false);
    }
  };

  const togglePermission = (perm: Permission) => {
    setRolePermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSavePermissions = async () => {
    if (!permRole) return;
    try {
      await updateRolePermissionsApi(permRole.id, rolePermissions);
      toast({ title: "权限已更新" });
      setIsPermDialogOpen(false);
    } catch (error: any) {
      toast({ title: "保存失败", description: error.message, variant: "destructive" });
    }
  };

  // --- 用户管理 ---

  const openUsersDialog = async (role: RoleDto) => {
    setUsersRole(role);
    setUsersLoading(true);
    setIsUsersDialogOpen(true);
    setAddUserSearch("");
    try {
      const [users, all] = await Promise.all([
        getRoleUsersApi(role.id),
        getUsersApi(),
      ]);
      setRoleUsers(Array.isArray(users) ? users : []);
      setAllUsers(Array.isArray(all) ? all : []);
    } catch (error: any) {
      toast({ title: "加载用户失败", description: error.message, variant: "destructive" });
    } finally {
      setUsersLoading(false);
    }
  };

  const handleAddUserToRole = async (userId: string) => {
    if (!usersRole) return;
    try {
      await addRoleUserApi(usersRole.id, userId);
      const users = await getRoleUsersApi(usersRole.id);
      setRoleUsers(Array.isArray(users) ? users : []);
      toast({ title: "用户已添加到角色" });
    } catch (error: any) {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveUserFromRole = async (userId: string) => {
    if (!usersRole) return;
    try {
      await removeRoleUserApi(usersRole.id, userId);
      setRoleUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: "用户已从角色移除" });
    } catch (error: any) {
      toast({ title: "移除失败", description: error.message, variant: "destructive" });
    }
  };

  const availableUsersToAdd = allUsers.filter(
    (u) =>
      !roleUsers.some((ru) => ru.id === u.id) &&
      (addUserSearch
        ? u.name.includes(addUserSearch) || u.username.includes(addUserSearch) || (u.staffId || "").includes(addUserSearch)
        : true)
  );

  return (
    <AppLayout title="角色与权限">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold">角色管理</h2>
            <p className="text-sm text-muted-foreground">管理系统角色、配置功能权限、分配用户</p>
          </div>
          {canManageRoles && (
            <Button className="gradient-primary rounded-xl shadow-md shadow-blue-500/20 text-sm" onClick={() => openRoleDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              新建角色
            </Button>
          )}
        </div>

        {/* Roles Table */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 text-sm font-bold text-foreground px-6 w-[20%]">角色</TableHead>
                  <TableHead className="text-sm font-bold text-foreground w-[35%]">描述</TableHead>
                  <TableHead className="text-sm font-bold text-foreground w-[15%]">状态</TableHead>
                  <TableHead className="pr-6 text-sm font-bold text-foreground w-[30%]">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id} className="hover:bg-muted/5 transition-all group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{getRoleLabel(role.id)}</p>
                          <p className="text-xs text-muted-foreground">{role.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{role.description || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.isActive ? "default" : "outline"} className="text-xs">
                        {role.isActive ? "启用" : "停用"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => openPermDialog(role)}
                        >
                          <Key className="h-3.5 w-3.5 mr-1" />
                          权限
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => openUsersDialog(role)}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          用户
                        </Button>
                        {canManageRoles && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => openRoleDialog(role)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/5 text-xs"
                              onClick={() => handleDeleteRole(role.id)}
                              disabled={role.id === "admin"}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
              <div className="text-center py-16">
                <Shield className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">暂无角色数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 角色编辑 Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingRole ? "编辑角色" : "新建角色"}</DialogTitle>
            <DialogDescription>
              {editingRole ? "修改角色基本信息" : "创建新的系统角色"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingRole && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">角色 ID</Label>
                <Input
                  placeholder="如 qa_lead（可选，不填自动生成）"
                  value={roleForm.id}
                  onChange={(e) => setRoleForm({ ...roleForm, id: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-sm font-medium">角色名称</Label>
              <Input
                placeholder="如 质量负责人"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">描述</Label>
              <Input
                placeholder="角色职责描述"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRoleDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleRoleSubmit} className="gradient-primary rounded-xl">确认</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 权限配置 Dialog */}
      <Dialog open={isPermDialogOpen} onOpenChange={setIsPermDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              配置权限 — {permRole ? getRoleLabel(permRole.id) : ""}
            </DialogTitle>
            <DialogDescription>勾选该角色拥有的功能权限</DialogDescription>
          </DialogHeader>
          {permLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {allPermissions.map((perm) => (
                <label
                  key={perm}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={rolePermissions.includes(perm)}
                    onCheckedChange={() => togglePermission(perm)}
                    disabled={!canManageRoles}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{PERMISSION_LABELS[perm] || perm}</p>
                    <p className="text-xs text-muted-foreground font-mono">{perm}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          {canManageRoles && (
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsPermDialogOpen(false)} className="rounded-xl">取消</Button>
              <Button onClick={handleSavePermissions} className="gradient-primary rounded-xl">保存权限</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 角色用户管理 Dialog */}
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              用户管理 — {usersRole ? getRoleLabel(usersRole.id) : ""}
            </DialogTitle>
            <DialogDescription>管理该角色下的用户</DialogDescription>
          </DialogHeader>
          {usersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* 当前用户列表 */}
              <div>
                <Label className="text-sm font-bold">当前用户 ({roleUsers.length})</Label>
                <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                  {roleUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无用户</p>
                  )}
                  {roleUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border/40 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.avatar || user.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                      {canManageRoles && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleRemoveUserFromRole(user.id)}
                        >
                          移除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 添加用户 */}
              {canManageRoles && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-bold">添加用户</Label>
                    <Input
                      placeholder="搜索用户名/姓名/工号..."
                      value={addUserSearch}
                      onChange={(e) => setAddUserSearch(e.target.value)}
                      className="mt-2 rounded-xl"
                    />
                    <div className="mt-2 space-y-1 max-h-[150px] overflow-y-auto">
                      {availableUsersToAdd.slice(0, 10).map((user) => (
                        <div key={user.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                                {user.avatar || user.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.department}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAddUserToRole(user.id)}
                          >
                            添加
                          </Button>
                        </div>
                      ))}
                      {availableUsersToAdd.length === 0 && addUserSearch && (
                        <p className="text-xs text-muted-foreground text-center py-3">无匹配用户</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
