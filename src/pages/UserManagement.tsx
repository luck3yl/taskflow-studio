import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Building2,
  Plus,
  Search,
  UserPlus,
  Edit,
  Trash2,
  Settings2,
  Mail,
  ChevronDown,
  ChevronRight,
  Shield,
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
import {
  useUserContext,
  getRoleLabel,
  flattenDepartmentTree,
  getDescendantIds,
} from "@/contexts/UserContext";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserApi, updateUserApi, deleteUserApi } from "@/services/apis/users";
import { createDepartmentApi, deleteDepartmentApi } from "@/services/apis/departments";
import type { UserDto, DepartmentDto } from "@/types/user";

export default function UserManagement() {
  const {
    users,
    departments,
    departmentTree,
    userDtos,
    roles,
    can,
    refreshUsers,
    refreshDepartments,
  } = useUserContext();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(
    departmentTree.map((d) => d.id)
  );

  // Department Dialog State
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // User Dialog State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    staffId: "",
    departmentId: "",
    email: "",
    avatar: "",
    roleIds: [] as string[],
  });

  const canManageUsers = can("user:manage");
  const canManageDepts = can("dept:manage");

  // --- 部门筛选逻辑 ---

  const allFlatDepts = flattenDepartmentTree(departmentTree);

  const getDescendantDeptIds = (deptId: string): string[] => {
    return getDescendantIds(departmentTree, deptId);
  };

  const filteredUsers = userDtos.filter(u => {
    const matchesSearch =
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.staffId || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.department || "").toLowerCase().includes(search.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      getDescendantDeptIds(selectedDepartment).includes(u.departmentId);

    return matchesSearch && matchesDepartment;
  });

  // --- 部门树统计 ---

  const getDeptMemberCount = (deptId: string): number => {
    const deptIds = getDescendantDeptIds(deptId);
    return userDtos.filter(u => deptIds.includes(u.departmentId)).length;
  };

  const toggleDepartment = (departmentId: string) => {
    setExpandedDeptIds((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const titleLabel = selectedDepartment === "all"
    ? "用户列表"
    : `${allFlatDepts.find((d) => d.id === selectedDepartment)?.name || "部门"} 用户列表`;

  // --- 部门操作 ---

  const handleAddDept = async () => {
    if (!newDeptName) return;
    try {
      await createDepartmentApi({
        name: newDeptName,
        parentId: "root",
      });
      setNewDeptName("");
      await refreshDepartments();
      toast({ title: "部门已添加" });
    } catch (error: any) {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteDept = async (deptId: string) => {
    try {
      await deleteDepartmentApi(deptId);
      await refreshDepartments();
      toast({ title: "部门已删除" });
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  // --- 用户操作 ---

  const openUserDialog = (user?: UserDto) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: "",
        firstName: user.firstName,
        lastName: user.lastName,
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
        firstName: "",
        lastName: "",
        staffId: "",
        departmentId: allFlatDepts[0]?.id || "",
        email: "",
        avatar: "",
        roleIds: ["staff"],
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    try {
      if (editingUser) {
        await updateUserApi(editingUser.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          staffId: formData.staffId || undefined,
          departmentId: formData.departmentId || undefined,
          avatar: formData.avatar || undefined,
        });
        toast({ title: "用户信息已更新" });
      } else {
        if (!formData.username || !formData.password) {
          toast({ title: "新用户需要填写用户名和密码", variant: "destructive" });
          return;
        }
        await createUserApi({
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          staffId: formData.staffId || undefined,
          departmentId: formData.departmentId || undefined,
          avatar: formData.avatar || formData.lastName.charAt(0) || formData.firstName.charAt(0),
          roleIds: formData.roleIds,
        });
        toast({ title: "用户已添加" });
      }
      await Promise.all([refreshUsers(), refreshDepartments()]);
      setIsUserDialogOpen(false);
    } catch (error: any) {
      toast({ title: "操作失败", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUserApi(userId);
      await Promise.all([refreshUsers(), refreshDepartments()]);
      toast({ title: "用户已删除" });
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  const toggleRole = (roleId: string, checked: boolean | "indeterminate") => {
    setFormData((prev) => ({
      ...prev,
      roleIds: checked === true
        ? [...prev.roleIds, roleId]
        : prev.roleIds.filter((r) => r !== roleId),
    }));
  };

  // --- 渲染部门树节点 ---

  const renderDeptTreeNode = (dept: DepartmentDto) => {
    const children = dept.children || [];
    const isExpanded = expandedDeptIds.includes(dept.id);
    const isActive = selectedDepartment === dept.id;
    const memberCount = dept.memberCount ?? getDeptMemberCount(dept.id);

    return (
      <div key={dept.id} className="space-y-1">
        <button
          type="button"
          onClick={() => setSelectedDepartment(dept.id)}
          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/40"}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
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
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </span>
              ) : (
                <span className="w-4 shrink-0" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{dept.name}</p>
              </div>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">{memberCount}人</span>
          </div>
        </button>

        {children.length > 0 && isExpanded && (
          <div className="ml-7 space-y-1 border-l border-border/40 pl-3">
            {children.map((child) => renderDeptTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout title="用户管理">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
            <Input
              placeholder="搜索用户姓名、部门或工号..."
              className="pl-10 rounded-xl bg-white/50 border-border/50 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManageUsers && (
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Button className="gradient-primary rounded-xl shadow-md shadow-blue-500/20 text-sm" onClick={() => openUserDialog()}>
                <UserPlus className="h-4 w-4 mr-2" />
                添加成员
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] items-start">
          {/* 部门筛选侧栏 */}
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm xl:sticky xl:top-6">
            <CardHeader className="pb-4 border-b border-border/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">部门筛选</CardTitle>
                </div>
                {canManageDepts && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setIsDeptDialogOpen(true)}
                  >
                    维护
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
              <button
                type="button"
                onClick={() => setSelectedDepartment("all")}
                className={`w-full rounded-xl px-3 py-3 text-left transition-colors border ${
                  selectedDepartment === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/70 border-border/40 hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">全部</p>
                  </div>
                  <Badge variant={selectedDepartment === "all" ? "secondary" : "outline"} className="shrink-0">
                    {userDtos.length}
                  </Badge>
                </div>
              </button>

              <div className="space-y-1.5">
                {departmentTree.map((dept) => renderDeptTreeNode(dept))}
              </div>
            </CardContent>
          </Card>

          {/* 用户列表 */}
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-border/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{titleLabel}</CardTitle>
                  <CardDescription className="text-sm">维护成员基础信息、角色和部门归属</CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">
                  共 {filteredUsers.length} 人
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 text-sm font-bold w-[28%] text-foreground px-6">成员</TableHead>
                    <TableHead className="text-sm font-bold w-[22%] text-foreground">部门</TableHead>
                    <TableHead className="text-sm font-bold w-[22%] text-foreground">角色</TableHead>
                    <TableHead className="text-sm font-bold w-[15%] text-foreground">状态</TableHead>
                    {canManageUsers && (
                      <TableHead className="pr-6 text-sm font-bold w-[13%] text-foreground">操作</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/5 transition-all group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-primary/5 shadow-sm">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {user.avatar || user.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-[14px] text-foreground">{user.name || `${user.lastName}${user.firstName}`}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {user.staffId && <span className="text-xs text-muted-foreground">工号 {user.staffId}</span>}
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.department || "未分配"}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(user.roles || []).map((role) => (
                            <Badge key={role} variant="secondary" className="text-xs">
                              {getRoleLabel(role)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "outline"} className="text-xs">
                          {user.isActive ? "活跃" : "已停用"}
                        </Badge>
                      </TableCell>
                      {canManageUsers && (
                        <TableCell className="text-right pr-6 whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => openUserDialog(user)}
                            >
                              <Settings2 className="h-3.5 w-3.5 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/5 text-xs font-bold"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredUsers.length === 0 && (
                <div className="text-center py-24 bg-muted/5 border-t border-border/30">
                  <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">暂无符合条件的成员信息</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 部门维护 Dialog */}
      <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>部门信息维护</DialogTitle>
            <DialogDescription>查看、编辑并管理公司各职能部门</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-bold">新增部门</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入新部门名称"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  className="text-sm rounded-lg"
                />
                <Button onClick={handleAddDept} className="text-sm rounded-lg gradient-primary">
                  <Plus className="h-4 w-4 mr-1" /> 添加
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold">部门列表 ({allFlatDepts.length})</Label>
              <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                {allFlatDepts.map(dept => (
                  <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{dept.name}</p>
                        <p className="text-xs text-muted-foreground">成员: {dept.memberCount ?? 0}人</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteDept(dept.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加/编辑用户 Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser ? <Edit className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingUser ? "编辑成员信息" : "新增成员"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingUser ? "维护该成员的基础信息、角色和部门归属。" : "填写成员基础信息并设置角色。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            {/* 用户名（仅新建时） */}
            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right text-sm font-medium">用户名</Label>
                <Input
                  id="username"
                  placeholder="登录用户名"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="col-span-3 text-sm h-10 rounded-xl"
                />
              </div>
            )}
            {/* 密码（仅新建时） */}
            {!editingUser && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right text-sm font-medium">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="设置登录密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="col-span-3 text-sm h-10 rounded-xl"
                />
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="lastName" className="text-right text-sm font-medium">姓</Label>
              <Input
                id="lastName"
                placeholder="姓氏"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="firstName" className="text-right text-sm font-medium">名</Label>
              <Input
                id="firstName"
                placeholder="名字"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffId" className="text-right text-sm font-medium">工号</Label>
              <Input
                id="staffId"
                placeholder="员工编号（如 T001）"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-sm font-medium">邮箱</Label>
              <Input
                id="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right text-sm font-medium">所属部门</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(v) => setFormData({ ...formData, departmentId: v })}
              >
                <SelectTrigger className="col-span-3 text-sm h-10 rounded-xl">
                  <SelectValue placeholder="请选择部门" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {allFlatDepts.map(d => (
                    <SelectItem key={d.id} value={d.id} className="text-sm">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* 角色选择（仅新建时，编辑角色通过角色管理页面） */}
            {!editingUser && (
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right text-sm font-medium pt-2">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3.5 w-3.5" />
                    角色
                  </div>
                </Label>
                <div className="col-span-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3 space-y-2">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={formData.roleIds.includes(role.id)}
                        onCheckedChange={(checked) => toggleRole(role.id, checked)}
                      />
                      <span>{getRoleLabel(role.id)}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground">— {role.description}</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="bg-muted/10 -mx-6 -mb-6 p-4 border-t border-border/30 px-6">
            <Button variant="ghost" onClick={() => setIsUserDialogOpen(false)} className="text-sm rounded-xl">取消</Button>
            <Button onClick={handleUserSubmit} className="gradient-primary text-sm rounded-xl px-8 shadow-md">
              {editingUser ? "完成修改" : "确认录入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
