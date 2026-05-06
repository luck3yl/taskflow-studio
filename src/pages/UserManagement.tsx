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
  Upload,
  Edit,
  Trash2,
  Settings2,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight
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
import { formatRoleAssignmentLabel, getUserRoleAssignments, useUserContext, User } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const ORG_HIERARCHIES = {
  department: {
    label: "部级层级",
    description: "普通职员 -> 室主任 -> 分管副部长 -> 设备部长",
    roles: ["普通职员", "室主任", "分管副部长", "设备部长"],
  },
  factory: {
    label: "厂级层级",
    description: "普通职员 -> 设备组长 -> 设备厂长",
    roles: ["普通职员", "设备组长", "设备厂长"],
  },
} as const;

export default function UserManagement() {
  const { users, departments, addUser, updateUser, deleteUser, addDepartment, deleteDepartment } = useUserContext();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(
    departments.filter((dept) => !dept.parentId).map((dept) => dept.id)
  );

  // Department Dialog State
  const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  // User Dialog State
  const [isUserUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    staffId: "",
    department: "",
    orgSystem: "department" as "department" | "factory",
    role: "",
    additionalAssignments: [] as Array<{ role: string; department: string }>,
    email: "",
    phone: ""
  });

  const currentRoleOptions = ORG_HIERARCHIES[formData.orgSystem].roles;

  const getDescendantDepartmentNames = (departmentId: string): string[] => {
    const directChildren = departments.filter((dept) => dept.parentId === departmentId);
    const currentDept = departments.find((dept) => dept.id === departmentId);

    return [
      currentDept?.name,
      ...directChildren.flatMap((child) => getDescendantDepartmentNames(child.id)),
    ].filter((name): name is string => !!name);
  };

  const getUserDepartmentNames = (user: User): string[] => {
    return [...new Set(getUserRoleAssignments(user).map((assignment) => assignment.department))];
  };

  const filteredUsers = users.filter(u => {
    const assignedDepartments = getUserDepartmentNames(u);
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      assignedDepartments.some((departmentName) => departmentName.toLowerCase().includes(search.toLowerCase())) ||
      u.staffId.toLowerCase().includes(search.toLowerCase());
    const allowedDepartments = selectedDepartment === "all"
      ? null
      : getDescendantDepartmentNames(selectedDepartment);
    const matchesDepartment = !allowedDepartments || assignedDepartments.some((departmentName) => allowedDepartments.includes(departmentName));
    return matchesSearch && matchesDepartment;
  });

  const departmentStats = departments.map((dept) => ({
    ...dept,
    totalUsers: users.filter((user) => getUserDepartmentNames(user).some((departmentName) => getDescendantDepartmentNames(dept.id).includes(departmentName))).length,
    onlineUsers: users.filter((user) => user.online && getUserDepartmentNames(user).some((departmentName) => getDescendantDepartmentNames(dept.id).includes(departmentName))).length,
  }));
  const rootDepartments = departmentStats.filter((dept) => !dept.parentId);

  const toggleDepartment = (departmentId: string) => {
    setExpandedDeptIds((prev) =>
      prev.includes(departmentId)
        ? prev.filter((id) => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const titleLabel = selectedDepartment === "all"
    ? "用户列表"
    : `${departments.find((dept) => dept.id === selectedDepartment)?.name || "部门"} 用户列表`;

  const handleAddDept = () => {
    if (!newDeptName) return;
    addDepartment({ name: newDeptName, description: "新增职能部门" });
    setNewDeptName("");
    toast({ title: "部门已添加" });
  };

  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      const roleAssignments = getUserRoleAssignments(user);
      setFormData({
        name: user.name,
        staffId: user.staffId,
        department: user.department,
        orgSystem: user.orgSystem,
        role: user.role,
        additionalAssignments: roleAssignments.filter((assignment) => !(assignment.role === user.role && assignment.department === user.department)),
        email: user.email,
        phone: user.phone
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        staffId: "",
        department: departments[0]?.name || "",
        orgSystem: "department",
        role: ORG_HIERARCHIES.department.roles[0],
        additionalAssignments: [],
        email: "",
        phone: ""
      });
    }
    setIsUserDialogOpen(true);
  };

  const toggleAdditionalRole = (role: string, checked: boolean | "indeterminate") => {
    setFormData((prev) => ({
      ...prev,
      additionalAssignments: checked === true
        ? [...prev.additionalAssignments, { role, department: prev.department }]
        : prev.additionalAssignments.filter((item) => item.role !== role),
    }));
  };

  const updateAdditionalAssignmentDepartment = (role: string, department: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalAssignments: prev.additionalAssignments.map((item) =>
        item.role === role ? { ...item, department } : item
      ),
    }));
  };

  const handleUserSubmit = () => {
    if (!formData.name || !formData.staffId || !formData.department || !formData.email || !formData.phone) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    const submitData = {
      name: formData.name,
      staffId: formData.staffId,
      department: formData.department,
      orgSystem: formData.orgSystem,
      role: formData.role,
      roles: [...new Set([formData.role, ...formData.additionalAssignments.map((item) => item.role)])],
      roleAssignments: [
        { role: formData.role as User["role"], department: formData.department },
        ...formData.additionalAssignments.map((item) => ({ role: item.role as User["role"], department: item.department })),
      ],
      email: formData.email,
      phone: formData.phone,
    };

    if (editingUser) {
      updateUser(editingUser.id, submitData);
      toast({ title: "用户信息已更新" });
    } else {
      addUser({
        name: submitData.name,
        staffId: submitData.staffId,
        department: submitData.department,
        orgSystem: submitData.orgSystem,
        role: submitData.role,
        roles: submitData.roles,
        email: submitData.email,
        phone: submitData.phone,
        avatar: formData.name.charAt(0),
        lastLogin: "-",
        online: false
      });
      toast({ title: "用户已添加" });
    }
    setIsUserDialogOpen(false);
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
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" className="rounded-xl border-border/50 text-sm" onClick={() => toast({ title: "正在连接导入系统..." })}>
              <Upload className="h-4 w-4 mr-2" />
              导入人员数据
            </Button>

            <Button className="gradient-primary rounded-xl shadow-md shadow-blue-500/20 text-sm" onClick={() => openUserDialog()}>
              <UserPlus className="h-4 w-4 mr-2" />
              添加成员
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] items-start">
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm xl:sticky xl:top-6">
            <CardHeader className="pb-4 border-b border-border/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">部门筛选</CardTitle>
                </div>
                <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground">
                      维护
                    </Button>
                  </DialogTrigger>
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
                        <Label className="text-sm font-bold">部门列表 ({departments.length})</Label>
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2">
                          {departments.map(dept => (
                            <div key={dept.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/30 transition-colors group">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                  <Building2 className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{dept.name}</p>
                                  <p className="text-xs text-muted-foreground">成员: {users.filter((user) => getUserDepartmentNames(user).includes(dept.name)).length}人</p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => deleteDepartment(dept.id)}
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
                    {users.length}
                  </Badge>
                </div>
              </button>

              <div className="space-y-1.5">
                {rootDepartments.map((dept) => {
                  const children = departmentStats.filter((child) => child.parentId === dept.id);
                  const isExpanded = expandedDeptIds.includes(dept.id);
                  const isActive = selectedDepartment === dept.id;

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
                          <span className="shrink-0 text-xs text-muted-foreground">{dept.totalUsers}人</span>
                        </div>
                      </button>

                      {children.length > 0 && isExpanded && (
                        <div className="ml-7 space-y-1 border-l border-border/40 pl-3">
                          {children.map((child) => (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => setSelectedDepartment(child.id)}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedDepartment === child.id ? "bg-primary/10 text-primary" : "hover:bg-muted/40"}`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                  <p className="truncate">{child.name}</p>
                                <span className="shrink-0 text-xs text-muted-foreground">{child.totalUsers}人</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-6 border-b border-border/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">
                    {titleLabel}
                  </CardTitle>
                  <CardDescription className="text-sm">维护成员基础信息、任职信息和部门归属</CardDescription>
                </div>
                <p className="text-sm text-muted-foreground">
                  共 {filteredUsers.length} 人，在线 {filteredUsers.filter(u => u.online).length} 人
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-4 text-sm font-bold w-[24%] text-foreground px-6">成员</TableHead>
                    <TableHead className="text-sm font-bold w-[24%] text-foreground">任职信息</TableHead>
                    <TableHead className="text-sm font-bold w-[22%] text-foreground">联系方式</TableHead>
                    <TableHead className="text-sm font-bold w-[15%] text-foreground">状态</TableHead>
                    <TableHead className="pr-6 text-sm font-bold w-[15%] text-foreground">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const roleAssignments = getUserRoleAssignments(user);
                    const secondaryAssignments = roleAssignments.filter((assignment) => !(assignment.role === user.role && assignment.department === user.department));

                    return (
                      <TableRow key={user.id} className="hover:bg-muted/5 transition-all group">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 ring-2 ring-primary/5 shadow-sm">
                              <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.avatar}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-bold text-[14px] text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">工号 {user.staffId}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">{user.role}</p>
                            <p className="text-xs text-muted-foreground">{user.department}</p>
                            {secondaryAssignments.length > 0 && (
                              <p className="text-xs text-muted-foreground">其他任职：{secondaryAssignments.map(formatRoleAssignmentLabel).join("、")}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              <span>{user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${user.online ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-300'}`} />
                              <span className={`text-xs font-medium ${user.online ? 'text-green-600' : 'text-muted-foreground'}`}>
                                {user.online ? '在线' : '离线'}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-4">最近登录 {user.lastLogin}</p>
                          </div>
                        </TableCell>
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
                              onClick={() => deleteUser(user.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              删除
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {/* Add/Edit User Dialog */}
      <Dialog open={isUserUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser ? <Edit className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingUser ? "编辑成员信息" : "新增成员"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingUser ? "维护该成员的基础信息、任职和部门归属。" : "填写成员基础信息并设置当前任职。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-6">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right text-sm font-medium">姓名</Label>
              <Input
                id="name"
                placeholder="请输入真实姓名"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffId" className="text-right text-sm font-medium">工号</Label>
              <Input
                id="staffId"
                placeholder="请输入员工编号 (如 TX001)"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="dept" className="text-right text-sm font-medium">所属部门</Label>
              <Select
                value={formData.department}
                onValueChange={(v) => setFormData({ ...formData, department: v })}
              >
                <SelectTrigger className="col-span-3 text-sm h-10 rounded-xl">
                  <SelectValue placeholder="请选择分配部门" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.name} className="text-sm">{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orgSystem" className="text-right text-sm font-medium">岗位体系</Label>
              <Select
                value={formData.orgSystem}
                onValueChange={(value: "department" | "factory") => setFormData({
                  ...formData,
                  orgSystem: value,
                  role: ORG_HIERARCHIES[value].roles[0],
                  additionalAssignments: [],
                })}
              >
                <SelectTrigger className="col-span-3 text-sm h-10 rounded-xl">
                  <SelectValue placeholder="请选择岗位体系" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="department">部级层级</SelectItem>
                  <SelectItem value="factory">厂级层级</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="role" className="text-right text-sm font-medium pt-2">当前任职</Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    role: value,
                    additionalAssignments: formData.additionalAssignments.filter((item) => item.role !== value),
                  })}
                >
                  <SelectTrigger className="text-sm h-10 rounded-xl">
                    <SelectValue placeholder="请选择当前职级" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {currentRoleOptions.map((role) => (
                      <SelectItem key={role} value={role} className="text-sm">{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  可选岗位：{ORG_HIERARCHIES[formData.orgSystem].description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right text-sm font-medium pt-2">其他任职</Label>
              <div className="col-span-3 rounded-xl border border-border/50 bg-muted/10 px-4 py-3 space-y-3">
                <div className="space-y-2">
                  {currentRoleOptions.filter((role) => role !== formData.role).map((role) => {
                    const assignment = formData.additionalAssignments.find((item) => item.role === role);

                    return (
                      <div key={role} className="rounded-lg border border-border/50 bg-background/80 px-3 py-3">
                        <label className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={!!assignment}
                            onCheckedChange={(checked) => toggleAdditionalRole(role, checked)}
                          />
                          <span>{role}</span>
                        </label>

                        {assignment && (
                          <div className="mt-3 pl-6">
                            <Label className="text-xs text-muted-foreground">所属部门/科室</Label>
                            <Select
                              value={assignment.department}
                              onValueChange={(value) => updateAdditionalAssignmentDepartment(role, value)}
                            >
                              <SelectTrigger className="mt-1.5 h-9 text-sm rounded-lg">
                                <SelectValue placeholder="请选择归属部门" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
                                {departments.map((department) => (
                                  <SelectItem key={`${role}-${department.id}`} value={department.name} className="text-sm">
                                    {department.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  主任、组长等任职建议明确归属到具体部门或科室，列表里会按这个归属进行展示。
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right text-sm font-medium">电子邮箱</Label>
              <Input
                id="email"
                placeholder="请输入邮箱 (如 user@comp.com)"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right text-sm font-medium">联系电话</Label>
              <Input
                id="phone"
                placeholder="请输入手机号"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
            </div>
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
