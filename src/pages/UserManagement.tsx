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
  ArrowRight
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useUserContext, User } from "@/contexts/UserContext";
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

export default function UserManagement() {
  const { users, departments, addUser, updateUser, deleteUser, addDepartment, updateDepartment, deleteDepartment } = useUserContext();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

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
    role: "",
    email: "",
    phone: ""
  });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase()) ||
    u.staffId.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddDept = () => {
    if (!newDeptName) return;
    addDepartment({ name: newDeptName, description: "新增职能部门" });
    setNewDeptName("");
    toast({ title: "部门已添加" });
  };

  const openUserDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        staffId: user.staffId,
        department: user.department,
        role: user.role,
        email: user.email,
        phone: user.phone
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: "",
        staffId: "",
        department: departments[0]?.name || "",
        role: "",
        email: "",
        phone: ""
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = () => {
    if (!formData.name || !formData.staffId || !formData.department || !formData.email || !formData.phone) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }

    if (editingUser) {
      updateUser(editingUser.id, formData);
      toast({ title: "用户信息已更新" });
    } else {
      addUser({
        name: formData.name,
        staffId: formData.staffId,
        department: formData.department,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
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
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-xl border-border/50 text-sm">
                  <Building2 className="h-4 w-4 mr-2" />
                  管理部门
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
                              <p className="text-xs text-muted-foreground">成员: {users.filter(u => u.department === dept.name).length}人</p>
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

        {/* User Module Card */}
        <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm">
          <CardHeader className="pb-6 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">用户列表</CardTitle>
                <CardDescription className="text-sm">查看组织内全员信息，支持便捷调岗与实时在线状态监控</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/5 text-green-600 border-green-500/20 text-xs px-2 py-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                  当前在线: {users.filter(u => u.online).length}
                </Badge>
                <Badge variant="outline" className="text-xs px-2 py-1">
                  全员总计: {users.length}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="py-4 text-sm font-bold w-[15%] text-foreground px-6">人员</TableHead>
                  <TableHead className="text-sm font-bold w-[12%] text-foreground">工号/职级</TableHead>
                  <TableHead className="text-sm font-bold w-[12%] text-foreground">所属部门</TableHead>
                  <TableHead className="text-sm font-bold w-[20%] text-foreground">联系方式</TableHead>
                  <TableHead className="text-sm font-bold w-[20%] text-foreground">状态</TableHead>
                  <TableHead className="pr-6 text-sm font-bold w-[15%] text-foreground">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/5 transition-all group">
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/5 shadow-sm">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">{user.avatar}</AvatarFallback>
                        </Avatar>
                        <p className="font-bold text-[14px] text-foreground">{user.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{user.staffId}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-lg bg-secondary/40 font-medium text-xs px-2.5 py-0.5 whitespace-nowrap">
                        {user.department}
                      </Badge>
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
                        <p className="text-xs text-muted-foreground pl-4">最后登录时间: {user.lastLogin}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6 whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-primary hover:text-primary hover:bg-primary/5 text-xs font-bold border border-transparent hover:border-primary/20"
                          onClick={() => openUserDialog(user)}
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1" />
                          调岗/编辑
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

      {/* Add/Edit User Dialog */}
      <Dialog open={isUserUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingUser ? <Edit className="h-5 w-5 text-primary" /> : <UserPlus className="h-5 w-5 text-primary" />}
              {editingUser ? "编辑用户信息 / 调岗" : "录入新成员信息"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingUser ? "您可以通过修改部门来实现人员调岗，所有变更将实时同步至任务系统。" : "请准确填写以下信息以创建组织内人员账号。"}
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
              <Label htmlFor="role" className="text-right text-sm font-medium">职位/角色</Label>
              <Input
                id="role"
                placeholder="请输入当前担任职位"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="col-span-3 text-sm h-10 rounded-xl"
              />
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
