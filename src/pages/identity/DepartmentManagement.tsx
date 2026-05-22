import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Edit,
  Loader2,
  Network,
  Plus,
  Trash2,
  UserPlus,
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
  createDepartmentApi,
  deleteDepartmentApi,
  updateDepartmentApi,
} from "@/services/apis/departments";
import {
  addGroupMemberApi,
  createGroupApi,
  deleteGroupApi,
  getGroupMembersApi,
  getGroupsApi,
  removeGroupMemberApi,
} from "@/services/apis/groups";
import { getUsersApi } from "@/services/apis/users";
import type {
  DepartmentDto,
  GroupDto,
  GroupMemberDto,
  UserDto,
} from "@/types/user";

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

export function DepartmentManagement() {
  const { departmentTree, userDtos, can, refreshDepartments } = useUserContext();
  const { toast } = useToast();

  const canManageDepts = can("dept:manage");
  const canManageGroups = can("group:manage");
  const allFlatDepts = flattenDepartmentTree(departmentTree);

  // ─── 部门树展开状态 ──────────────────────────────
  const [expandedIds, setExpandedIds] = useState<string[]>(
    departmentTree.map((d) => d.id),
  );
  const [selectedDept, setSelectedDept] = useState<DepartmentDto | null>(
    departmentTree[0] || null,
  );

  useEffect(() => {
    if (!selectedDept && departmentTree[0]) {
      setSelectedDept(departmentTree[0]);
    }
  }, [departmentTree, selectedDept]);

  // ─── 部门表单 Sheet ──────────────────────────────
  const [isDeptSheetOpen, setIsDeptSheetOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentDto | null>(null);
  const [deptForm, setDeptForm] = useState({
    name: "",
    description: "",
    parentId: "root",
    managerId: "",
  });

  // ─── 工作组列表 ────────────────────────────────
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // ─── 工作组创建 Sheet ──────────────────────────
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: "", actions: "" });

  // ─── 工作组成员 Sheet ──────────────────────────
  const [isGroupMembersOpen, setIsGroupMembersOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberDto[]>([]);
  const [groupAllUsers, setGroupAllUsers] = useState<UserDto[]>([]);
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [addGroupMemberSearch, setAddGroupMemberSearch] = useState("");

  // ─── 选中部门变化时加载工作组 ────────────────────
  useEffect(() => {
    if (!selectedDept?.id) {
      setGroups([]);
      return;
    }

    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const data = await getGroupsApi({ departmentId: selectedDept.id });
        setGroups(Array.isArray(data) ? data : []);
      } catch {
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    void loadGroups();
  }, [selectedDept?.id]);

  // ─── 部门 CRUD ──────────────────────────────────

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
        setSelectedDept(departmentTree[0] || null);
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

  // ─── 工作组 CRUD ────────────────────────────────

  const handleCreateGroup = async () => {
    if (!selectedDept) return;
    if (!newGroupForm.name.trim()) {
      toast({ title: "请填写工作组名称", variant: "destructive" });
      return;
    }

    try {
      await createGroupApi({
        name: newGroupForm.name,
        departmentId: selectedDept.id,
        actions: newGroupForm.actions
          ? newGroupForm.actions
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      });

      toast({ title: "工作组已创建" });
      setIsCreateGroupOpen(false);
      setNewGroupForm({ name: "", actions: "" });
      const data = await getGroupsApi({ departmentId: selectedDept.id });
      setGroups(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({
        title: "创建失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupApi(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast({ title: "工作组已删除" });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // ─── 工作组成员 ────────────────────────────────

  const openGroupMembers = async (group: GroupDto) => {
    setSelectedGroup(group);
    setGroupMembersLoading(true);
    setIsGroupMembersOpen(true);
    setAddGroupMemberSearch("");

    try {
      const [members, users] = await Promise.all([
        getGroupMembersApi(group.id),
        getUsersApi(),
      ]);
      setGroupMembers(Array.isArray(members) ? members : []);
      setGroupAllUsers(Array.isArray(users) ? users : []);
    } catch (error: any) {
      toast({
        title: "加载失败",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setGroupMembersLoading(false);
    }
  };

  const handleAddGroupMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await addGroupMemberApi(selectedGroup.id, userId);
      const members = await getGroupMembersApi(selectedGroup.id);
      setGroupMembers(Array.isArray(members) ? members : []);
      toast({ title: "用户已加入工作组" });
    } catch (error: any) {
      toast({
        title: "添加失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRemoveGroupMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await removeGroupMemberApi(selectedGroup.id, userId);
      setGroupMembers((prev) => prev.filter((m) => m.id !== userId));
      toast({ title: "成员已移除" });
    } catch (error: any) {
      toast({
        title: "移除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const availableGroupUsers = groupAllUsers.filter(
    (user) =>
      !groupMembers.some((m) => m.id === user.id) &&
      (addGroupMemberSearch
        ? user.name.includes(addGroupMemberSearch) ||
          user.username.includes(addGroupMemberSearch) ||
          (user.department || "").includes(addGroupMemberSearch)
        : true),
  );

  const groupUserDetailsById = new Map(
    groupAllUsers.map((u) => [u.id, u]),
  );

  // ─── 渲染部门树节点 ────────────────────────────

  const renderNode = (dept: DepartmentDto, depth = 0) => {
    const children = dept.children || [];
    const isExpanded = expandedIds.includes(dept.id);
    const isActive = selectedDept?.id === dept.id;
    const managerUser = userDtos.find((user) => user.id === dept.managerId);

    return (
      <div key={dept.id}>
        <div
          className={`group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer ${
            isActive
              ? "bg-primary/10 ring-1 ring-primary/20"
              : "hover:bg-muted/30"
          }`}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
          onClick={() => setSelectedDept(dept)}
        >
          {children.length > 0 ? (
            <button
              type="button"
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(dept.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="h-3.5 w-3.5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{dept.name}</span>
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {dept.memberCount ?? 0} 人
              </Badge>
              {managerUser && (
                <span className="text-xs text-muted-foreground">
                  · {getDisplayName(managerUser.name)}
                </span>
              )}
            </div>
          </div>

          {canManageDepts && (
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  openDeptSheet(dept);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDeleteDept(dept.id);
                }}
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
      <div className="grid items-start gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* ─── 左侧：部门树 ──────────────────────── */}
        <Card className="border-border/50 bg-white/80 shadow-sm dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">部门组织架构</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  点击部门可在右侧查看其工作组配置
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

        {/* ─── 右侧：选中部门的工作组列表 ────────────── */}
        <Card className="border-border/50 bg-white/80 shadow-sm xl:sticky xl:top-6 dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold truncate">
                    {selectedDept ? `${selectedDept.name} · 工作组` : "工作组"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  内置工作组作为部门默认协作入口，自定义工作组可用于流程任务分派
                </p>
              </div>
              {canManageGroups && (
                <Button
                  size="sm"
                  className="h-9 rounded-lg gradient-primary text-xs"
                  disabled={!selectedDept}
                  onClick={() => {
                    setNewGroupForm({ name: "", actions: "" });
                    setIsCreateGroupOpen(true);
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  新建工作组
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {!selectedDept ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                请先在左侧选择部门
              </p>
            ) : groupsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : groups.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                该部门暂无工作组
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/10 p-3 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          group.isBuiltin
                            ? "bg-blue-100 text-blue-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        <Users className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium">
                            {group.name || "未命名工作组"}
                          </span>
                          {group.isBuiltin && (
                            <Badge
                              variant="secondary"
                              className="px-1 py-0 text-[10px]"
                            >
                              内置
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {group.isBuiltin ? "部门默认协作组" : "自定义协作组"}
                          {group.actions.length > 0
                            ? ` · 已配置 ${group.actions.length} 个流程动作`
                            : " · 暂未配置流程动作"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => void openGroupMembers(group)}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        成员
                      </Button>
                      {canManageGroups && !group.isBuiltin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-1.5 text-destructive hover:text-destructive"
                          onClick={() => void handleDeleteGroup(group.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── 部门表单 Sheet ─────────────────────── */}
      <Sheet open={isDeptSheetOpen} onOpenChange={setIsDeptSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle>{editingDept ? "编辑部门" : "新建部门"}</SheetTitle>
            <SheetDescription>
              填写名称、层级和负责人后即可保存
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

      {/* ─── 工作组创建 Sheet ────────────────────── */}
      <Sheet open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle>新建工作组</SheetTitle>
            <SheetDescription>
              在"{selectedDept?.name || ""}"下创建工作组，可按需补充流程动作
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm">名称</Label>
                <Input
                  placeholder="请输入工作组名称"
                  value={newGroupForm.name}
                  onChange={(event) =>
                    setNewGroupForm({
                      ...newGroupForm,
                      name: event.target.value,
                    })
                  }
                  className="h-10 rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">流程动作</Label>
                <Input
                  placeholder="可选，多个动作请用逗号分隔"
                  value={newGroupForm.actions}
                  onChange={(event) =>
                    setNewGroupForm({
                      ...newGroupForm,
                      actions: event.target.value,
                    })
                  }
                  className="h-10 rounded-lg text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  仅用于流程分派配置，不会在列表中直接展示
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsCreateGroupOpen(false)}
              className="rounded-lg"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateGroup}
              className="rounded-lg gradient-primary"
            >
              创建
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── 工作组成员 Sheet ────────────────────── */}
      <Sheet open={isGroupMembersOpen} onOpenChange={setIsGroupMembersOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-4xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {selectedGroup ? `${selectedGroup.name} / 成员管理` : "成员管理"}
            </SheetTitle>
            <SheetDescription>
              这里只会把已有账号加入当前工作组
            </SheetDescription>
          </SheetHeader>

          {groupMembersLoading ? (
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
                        {groupMembers.length} 人
                      </span>
                    </div>

                    <div className="space-y-2">
                      {groupMembers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          当前工作组还没有成员
                        </div>
                      )}

                      {groupMembers.map((member) => {
                        const detail = groupUserDetailsById.get(member.id);

                        return (
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
                                    {detail?.department?.trim() || "未分配部门"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {canManageGroups && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() =>
                                  void handleRemoveGroupMember(member.id)
                                }
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
                        这里只会把已有账号加入当前工作组
                      </p>
                    </div>

                    <Input
                      placeholder="搜索姓名、账号或部门"
                      value={addGroupMemberSearch}
                      onChange={(event) =>
                        setAddGroupMemberSearch(event.target.value)
                      }
                      className="h-10 rounded-lg text-sm"
                    />

                    <div className="space-y-2">
                      {availableGroupUsers.length === 0 && (
                        <div className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
                          没有可加入的用户
                        </div>
                      )}

                      {availableGroupUsers.slice(0, 24).map((user) => (
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
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            onClick={() => void handleAddGroupMember(user.id)}
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
                  onClick={() => setIsGroupMembersOpen(false)}
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
