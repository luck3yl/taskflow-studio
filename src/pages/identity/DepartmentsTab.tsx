import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Crown,
  Edit,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { flattenDepartmentTree, useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import {
  addDepartmentMemberApi,
  createDepartmentApi,
  deleteDepartmentApi,
  getDepartmentMembersApi,
  removeDepartmentMemberApi,
  updateDepartmentApi,
} from "@/services/apis/departments";
import { getUsersApi } from "@/services/apis/users";
import type { DepartmentDto, DepartmentMemberDto, UserDto } from "@/types/user";

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

export function DepartmentsTab() {
  const { departmentTree, userDtos, can, refreshDepartments } =
    useUserContext();
  const { toast } = useToast();

  const canManageDepts = can("dept:manage");
  const allFlatDepts = flattenDepartmentTree(departmentTree);

  const [expandedIds, setExpandedIds] = useState<string[]>(
    departmentTree.map((dept) => dept.id),
  );
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(null);

  const [isDeptSheetOpen, setIsDeptSheetOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDto | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
    parentId: "root",
    managerId: "",
  });

  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [deptMembers, setDeptMembers] = useState<DepartmentMemberDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const openDeptSheet = (dept?: DepartmentDto) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        description: dept.description || "",
        parentId: dept.parentId || "root",
        managerId: dept.managerId || "",
      });
    } else {
      setEditingDept(null);
      setDeptForm({
        name: "",
        description: "",
        parentId: "root",
        managerId: "",
      });
    }

    setIsDeptSheetOpen(true);
  };

  const handleDeptSubmit = async () => {
    if (!deptForm.name.trim()) {
      toast({ title: "请填写部门名称", variant: "destructive" });
      return;
    }

    const managerId =
      deptForm.managerId && deptForm.managerId !== "__none__"
        ? deptForm.managerId
        : undefined;

    try {
      if (editingDept) {
        await updateDepartmentApi(editingDept.id, {
          name: deptForm.name,
          description: deptForm.description || undefined,
          managerId,
        });
        toast({ title: "部门已更新" });
      } else {
        await createDepartmentApi({
          name: deptForm.name,
          description: deptForm.description || undefined,
          parentId: deptForm.parentId,
          managerId,
        });
        toast({ title: "部门已创建" });
      }

      await refreshDepartments();
      setIsDeptSheetOpen(false);
    } catch (error: any) {
      toast({
        title: "操作失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteDept = async (deptId: string) => {
    try {
      await deleteDepartmentApi(deptId);
      await refreshDepartments();
      if (selectedDept?.id === deptId) {
        setSelectedDept(null);
      }
      toast({ title: "部门已删除" });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openMembersSheet = async (dept: DepartmentDto) => {
    setSelectedDept(dept);
    setMembersLoading(true);
    setIsMembersSheetOpen(true);
    setAddMemberSearch("");

    try {
      const [members, users] = await Promise.all([
        getDepartmentMembersApi(dept.id),
        getUsersApi(),
      ]);
      setDeptMembers(Array.isArray(members) ? members : []);
      setAllUsers(Array.isArray(users) ? users : []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedDept) return;

    try {
      await addDepartmentMemberApi(selectedDept.id, userId);
      const members = await getDepartmentMembersApi(selectedDept.id);
      setDeptMembers(Array.isArray(members) ? members : []);
      await refreshDepartments();
      toast({ title: "用户已加入部门" });
    } catch (error: any) {
      toast({
        title: "加入失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedDept) return;

    try {
      await removeDepartmentMemberApi(selectedDept.id, userId);
      setDeptMembers((prev) => prev.filter((member) => member.id !== userId));
      await refreshDepartments();
      toast({ title: "成员已移除" });
    } catch (error: any) {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const availableUsersToAdd = allUsers.filter(
    (user) =>
      !deptMembers.some((member) => member.id === user.id) &&
      (addMemberSearch
        ? user.name.includes(addMemberSearch) ||
          user.username.includes(addMemberSearch) ||
          (user.staffId || "").includes(addMemberSearch)
        : true),
  );

  const renderNode = (dept: DepartmentDto, depth = 0) => {
    const children = dept.children || [];
    const isExpanded = expandedIds.includes(dept.id);
    const isActive = selectedDept?.id === dept.id;
    const managerUser = userDtos.find((user) => user.id === dept.managerId);

    return (
      <div key={dept.id}>
        <div
          className={`flex items-start gap-2 rounded-xl px-3 py-3 transition-colors ${
            isActive
              ? "bg-primary/10 ring-1 ring-primary/20"
              : "hover:bg-muted/30"
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {children.length > 0 ? (
            <button
              type="button"
              className="mt-0.5 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => toggleExpand(dept.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="mt-0.5 w-4 shrink-0" />
          )}

          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{dept.name}</span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {dept.memberCount ?? 0} 人
              </Badge>
            </div>

            {dept.description ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {dept.description}
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                暂无部门说明
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className={metaBadgeClassName}>
                {children.length} 个子部门
              </span>
              <span className={metaBadgeClassName}>
                {dept.groups?.length ?? 0} 个工作组
              </span>
              <span className={metaBadgeClassName}>
                {managerUser ? (
                  <span className="inline-flex items-center gap-1">
                    <Crown className="h-3 w-3" />
                    {getDisplayName(managerUser.name)}
                  </span>
                ) : (
                  "未设置负责人"
                )}
              </span>
            </div>
          </div>

          {canManageDepts && (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => void openMembersSheet(dept)}
              >
                <Users className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => openDeptSheet(dept)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={() => void handleDeleteDept(dept.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {children.length > 0 && isExpanded && (
          <div className="ml-6 border-l border-border/30">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Card className="border-border/50 bg-white/80 shadow-sm dark:bg-black/20">
        <CardHeader className="border-b border-border/30 p-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">部门组织架构</span>
              </div>
              <p className="text-xs text-muted-foreground">
                部门说明、负责人和数量信息直接展示在列表中，可在右侧快速维护成员。
              </p>
            </div>
            {canManageDepts && (
              <Button
                size="sm"
                className="h-9 rounded-lg gradient-primary text-xs"
                onClick={() => openDeptSheet()}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                新建部门
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {departmentTree.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">暂无部门数据</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {departmentTree.map((dept) => renderNode(dept))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={isDeptSheetOpen} onOpenChange={setIsDeptSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle>{editingDept ? "编辑部门" : "新建部门"}</SheetTitle>
            <SheetDescription>
              填写名称、层级和负责人后即可保存，系统会自动完成关联信息。
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">名称</Label>
                <Input
                  placeholder="请输入部门名称"
                  value={deptForm.name}
                  onChange={(event) =>
                    setDeptForm({ ...deptForm, name: event.target.value })
                  }
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">说明</Label>
                <Input
                  placeholder="可选，补充部门职责"
                  value={deptForm.description}
                  onChange={(event) =>
                    setDeptForm({
                      ...deptForm,
                      description: event.target.value,
                    })
                  }
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">上级部门</Label>
                <Select
                  value={deptForm.parentId}
                  onValueChange={(value) =>
                    setDeptForm({ ...deptForm, parentId: value })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="root" className="text-sm">
                      设为顶级部门
                    </SelectItem>
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

              <div className="space-y-1.5">
                <Label className="text-sm">负责人</Label>
                <Select
                  value={deptForm.managerId}
                  onValueChange={(value) =>
                    setDeptForm({ ...deptForm, managerId: value })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg text-sm">
                    <SelectValue placeholder="可选，设置部门负责人" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem
                      value="__none__"
                      className="text-sm text-muted-foreground"
                    >
                      暂不设置
                    </SelectItem>
                    {userDtos.map((user) => (
                      <SelectItem
                        key={user.id}
                        value={user.id}
                        className="text-sm"
                      >
                        {getDisplayName(user.name)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsDeptSheetOpen(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleDeptSubmit}
              className="rounded-lg gradient-primary"
            >
              {editingDept ? "保存" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-4xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedDept ? `${selectedDept.name} / 成员管理` : "成员管理"}
            </SheetTitle>
            <SheetDescription>
              右侧仅用于把已有账号加入当前部门，不会创建新账号。
            </SheetDescription>
          </SheetHeader>

          {membersLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)]">
                  <div className="min-w-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">当前成员</Label>
                      <span className="text-xs text-muted-foreground">
                        {deptMembers.length} 人
                      </span>
                    </div>

                    <div className="space-y-2">
                      {deptMembers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          当前部门还没有成员
                        </div>
                      )}

                      {deptMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/10 px-3 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback
                                className={avatarFallbackClassName}
                              >
                                {getAvatarLabel(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {getDisplayName(member.name)}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <span className={metaBadgeClassName}>
                                  {member.staffId ? "已设置工号" : "未设置工号"}
                                </span>
                                <span className={metaBadgeClassName}>
                                  {member.email ? "已设置邮箱" : "未设置邮箱"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {canManageDepts && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                              onClick={() => void handleRemoveMember(member.id)}
                            >
                              移除
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">
                        加入已有用户
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        这里只调整部门归属，不会新增账号。
                      </p>
                    </div>

                    <Input
                      placeholder="搜索姓名、账号或工号"
                      value={addMemberSearch}
                      onChange={(event) =>
                        setAddMemberSearch(event.target.value)
                      }
                      className="h-10 rounded-lg text-sm"
                    />

                    <div className="space-y-2">
                      {availableUsersToAdd.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          没有可加入的用户
                        </div>
                      )}

                      {availableUsersToAdd.slice(0, 24).map((user) => (
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
                            onClick={() => void handleAddMember(user.id)}
                          >
                            加入
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
                  onClick={() => setIsMembersSheetOpen(false)}
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
