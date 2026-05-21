import { useEffect, useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { flattenDepartmentTree, useUserContext } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
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

export function GroupManagementContent() {
  const { departmentTree, can } = useUserContext();
  const { toast } = useToast();

  const canManageGroups = can("group:manage");
  const allFlatDepts = flattenDepartmentTree(departmentTree);

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departmentTree[0]?.id || "",
  );
  const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(
    departmentTree.map((dept) => dept.id),
  );
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ name: "", actions: "" });

  const [isMembersSheetOpen, setIsMembersSheetOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  useEffect(() => {
    if (!selectedDeptId && departmentTree[0]?.id) {
      setSelectedDeptId(departmentTree[0].id);
    }
  }, [departmentTree, selectedDeptId]);

  useEffect(() => {
    if (!selectedDeptId) return;

    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const data = await getGroupsApi({ departmentId: selectedDeptId });
        setGroups(Array.isArray(data) ? data : []);
      } catch {
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };

    void loadGroups();
  }, [selectedDeptId]);

  const toggleDept = (deptId: string) => {
    setExpandedDeptIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId],
    );
  };

  const handleCreateGroup = async () => {
    if (!newGroupForm.name.trim()) {
      toast({ title: "请填写工作组名称", variant: "destructive" });
      return;
    }

    try {
      await createGroupApi({
        name: newGroupForm.name,
        departmentId: selectedDeptId,
        actions: newGroupForm.actions
          ? newGroupForm.actions
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      });

      toast({ title: "工作组已创建" });
      setIsCreateSheetOpen(false);
      setNewGroupForm({ name: "", actions: "" });

      const data = await getGroupsApi({ departmentId: selectedDeptId });
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
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      toast({ title: "工作组已删除" });
    } catch (error: any) {
      toast({
        title: "删除失败",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openMembersSheet = async (group: GroupDto) => {
    setSelectedGroup(group);
    setMembersLoading(true);
    setIsMembersSheetOpen(true);
    setAddMemberSearch("");

    try {
      const [members, users] = await Promise.all([
        getGroupMembersApi(group.id),
        getUsersApi(),
      ]);
      setGroupMembers(Array.isArray(members) ? members : []);
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

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      await removeGroupMemberApi(selectedGroup.id, userId);
      setGroupMembers((prev) => prev.filter((member) => member.id !== userId));
      toast({ title: "成员已移除" });
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
      !groupMembers.some((member) => member.id === user.id) &&
      (addMemberSearch
        ? user.name.includes(addMemberSearch) ||
          user.username.includes(addMemberSearch) ||
          (user.department || "").includes(addMemberSearch)
        : true),
  );

  const userDetailsById = new Map(allUsers.map((user) => [user.id, user]));

  const renderDeptNode = (dept: DepartmentDto) => {
    const children = dept.children || [];
    const isExpanded = expandedDeptIds.includes(dept.id);
    const isActive = selectedDeptId === dept.id;

    return (
      <div key={dept.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSelectedDeptId(dept.id)}
          className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
            isActive
              ? "bg-primary/10 font-medium text-primary"
              : "hover:bg-muted/40"
          }`}
        >
          <div className="flex items-center gap-1.5">
            {children.length > 0 ? (
              <span
                role="button"
                tabIndex={0}
                className="shrink-0 text-muted-foreground"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleDept(dept.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleDept(dept.id);
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
        </button>

        {children.length > 0 && isExpanded && (
          <div className="ml-5 space-y-0.5 border-l border-border/40 pl-2.5">
            {children.map((child) => renderDeptNode(child))}
          </div>
        )}
      </div>
    );
  };

  const selectedDeptName =
    allFlatDepts.find((dept) => dept.id === selectedDeptId)?.name ||
    "未选择部门";

  return (
    <>
      <div className="grid items-start gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
        <Card className="border-border/50 bg-white/80 shadow-sm xl:sticky xl:top-6 dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-3 pb-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold">
              <Building2 className="h-4 w-4 text-primary" />
              选择部门
            </span>
          </CardHeader>
          <CardContent className="max-h-[400px] overflow-y-auto p-2.5">
            {departmentTree.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                暂无可选部门
              </div>
            ) : (
              departmentTree.map((dept) => renderDeptNode(dept))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-white/80 shadow-sm dark:bg-black/20">
          <CardHeader className="border-b border-border/30 p-4 pb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">
                  {selectedDeptName}的工作组
                </CardTitle>
                <CardDescription className="text-xs">
                  内置工作组作为部门默认协作入口，自定义工作组可用于流程中的任务分派。
                </CardDescription>
              </div>
              {canManageGroups && (
                <Button
                  size="sm"
                  className="h-8 rounded-lg gradient-primary text-xs"
                  disabled={!selectedDeptId}
                  onClick={() => {
                    setNewGroupForm({ name: "", actions: "" });
                    setIsCreateSheetOpen(true);
                  }}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  新建
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-3">
            {groupsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : groups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无工作组
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
                        onClick={() => void openMembersSheet(group)}
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

      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent
          side="right"
          className="flex h-full w-full flex-col overflow-hidden p-0 sm:max-w-xl"
        >
          <SheetHeader className="border-b border-border/50 px-6 py-5">
            <SheetTitle>新建工作组</SheetTitle>
            <SheetDescription>
              在“{selectedDeptName}”下创建工作组，可按需补充流程动作。
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
                  仅用于流程分派配置，不会在列表中直接展示。
                </p>
              </div>
            </div>
          </div>

          <SheetFooter className="border-t border-border/50 px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => setIsCreateSheetOpen(false)}
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

      <Sheet open={isMembersSheetOpen} onOpenChange={setIsMembersSheetOpen}>
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
              右侧可直接搜索并加入已有用户，空间更宽，方便对照成员信息。
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
                        const detail = userDetailsById.get(member.id);

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
                            {canManageGroups && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                                onClick={() =>
                                  void handleRemoveMember(member.id)
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
                        这里只会把已有账号加入当前工作组。
                      </p>
                    </div>

                    <Input
                      placeholder="搜索姓名、账号或部门"
                      value={addMemberSearch}
                      onChange={(event) =>
                        setAddMemberSearch(event.target.value)
                      }
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
                            onClick={() => void handleAddMember(user.id)}
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
