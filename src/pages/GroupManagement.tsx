import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Building2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  UserPlus,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useUserContext, flattenDepartmentTree } from "@/contexts/UserContext";
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
import { Separator } from "@/components/ui/separator";
import {
  getGroupsApi,
  createGroupApi,
  deleteGroupApi,
  getGroupMembersApi,
  addGroupMemberApi,
  removeGroupMemberApi,
} from "@/services/apis/groups";
import { getUsersApi } from "@/services/apis/users";
import type { GroupDto, GroupMemberDto, DepartmentDto, UserDto } from "@/types/user";

export default function GroupManagement() {
  const { departmentTree, can } = useUserContext();
  const { toast } = useToast();
  const canManageGroups = can("group:manage");

  const allFlatDepts = flattenDepartmentTree(departmentTree);

  // --- 选中的部门 ---
  const [selectedDeptId, setSelectedDeptId] = useState<string>(departmentTree[0]?.id || "");
  const [expandedDeptIds, setExpandedDeptIds] = useState<string[]>(departmentTree.map(d => d.id));

  // --- 工作组列表 ---
  const [groups, setGroups] = useState<GroupDto[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // --- 创建工作组 Dialog ---
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({ id: "", name: "", actions: "" });

  // --- 成员管理 Dialog ---
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupDto | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMemberDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState("");

  // --- 加载工作组 ---
  useEffect(() => {
    if (!selectedDeptId) return;
    const loadGroups = async () => {
      setGroupsLoading(true);
      try {
        const data = await getGroupsApi({ departmentId: selectedDeptId });
        setGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load groups", error);
        setGroups([]);
      } finally {
        setGroupsLoading(false);
      }
    };
    void loadGroups();
  }, [selectedDeptId]);

  // --- 部门树操作 ---
  const toggleDepartment = (deptId: string) => {
    setExpandedDeptIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  // --- 创建工作组 ---
  const handleCreateGroup = async () => {
    if (!newGroupForm.name) {
      toast({ title: "请填写工作组名称", variant: "destructive" });
      return;
    }
    try {
      await createGroupApi({
        id: newGroupForm.id || undefined,
        name: newGroupForm.name,
        departmentId: selectedDeptId,
        actions: newGroupForm.actions ? newGroupForm.actions.split(",").map(s => s.trim()) : [],
      });
      toast({ title: "工作组已创建" });
      setIsCreateDialogOpen(false);
      setNewGroupForm({ id: "", name: "", actions: "" });
      // 刷新
      const data = await getGroupsApi({ departmentId: selectedDeptId });
      setGroups(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "创建失败", description: error.message, variant: "destructive" });
    }
  };

  // --- 删除工作组 ---
  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteGroupApi(groupId);
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast({ title: "工作组已删除" });
    } catch (error: any) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    }
  };

  // --- 成员管理 ---
  const openMembersDialog = async (group: GroupDto) => {
    setSelectedGroup(group);
    setMembersLoading(true);
    setIsMembersDialogOpen(true);
    setAddMemberSearch("");
    try {
      const [members, users] = await Promise.all([
        getGroupMembersApi(group.id),
        getUsersApi(),
      ]);
      setGroupMembers(Array.isArray(members) ? members : []);
      setAllUsers(Array.isArray(users) ? users : []);
    } catch (error: any) {
      toast({ title: "加载失败", description: error.message, variant: "destructive" });
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
      toast({ title: "成员已添加" });
    } catch (error: any) {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;
    try {
      await removeGroupMemberApi(selectedGroup.id, userId);
      setGroupMembers((prev) => prev.filter((m) => m.id !== userId));
      toast({ title: "成员已移除" });
    } catch (error: any) {
      toast({ title: "移除失败", description: error.message, variant: "destructive" });
    }
  };

  const availableUsersToAdd = allUsers.filter(
    (u) =>
      !groupMembers.some((m) => m.id === u.id) &&
      (addMemberSearch
        ? u.name.includes(addMemberSearch) || u.username.includes(addMemberSearch) || (u.staffId || "").includes(addMemberSearch)
        : true)
  );

  // --- 渲染部门树 ---
  const renderDeptNode = (dept: DepartmentDto) => {
    const children = dept.children || [];
    const isExpanded = expandedDeptIds.includes(dept.id);
    const isActive = selectedDeptId === dept.id;

    return (
      <div key={dept.id} className="space-y-0.5">
        <button
          type="button"
          onClick={() => setSelectedDeptId(dept.id)}
          className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/40"}`}
        >
          <div className="flex items-center gap-2">
            {children.length > 0 ? (
              <span
                role="button"
                tabIndex={0}
                className="shrink-0 text-muted-foreground"
                onClick={(e) => { e.stopPropagation(); toggleDepartment(dept.id); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggleDepartment(dept.id); } }}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            ) : (
              <span className="w-4 shrink-0" />
            )}
            <span className="truncate">{dept.name}</span>
          </div>
        </button>
        {children.length > 0 && isExpanded && (
          <div className="ml-6 border-l border-border/40 pl-3 space-y-0.5">
            {children.map((child) => renderDeptNode(child))}
          </div>
        )}
      </div>
    );
  };

  const selectedDeptName = allFlatDepts.find(d => d.id === selectedDeptId)?.name || "";

  return (
    <AppLayout title="工作组管理">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">工作组管理</h2>
          <p className="text-sm text-muted-foreground">管理部门下的工作组及其成员，工作组用于流程任务分派</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)] items-start">
          {/* 部门树 */}
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm xl:sticky xl:top-6">
            <CardHeader className="pb-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">部门</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-3 space-y-1">
              {departmentTree.map((dept) => renderDeptNode(dept))}
              {departmentTree.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">暂无部门数据</p>
              )}
            </CardContent>
          </Card>

          {/* 工作组列表 */}
          <Card className="border-border/50 shadow-sm rounded-2xl overflow-hidden bg-white/80 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="pb-4 border-b border-border/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{selectedDeptName} — 工作组</CardTitle>
                  <CardDescription className="text-sm">内置工作组不可删改，自定义工作组可自由管理</CardDescription>
                </div>
                {canManageGroups && (
                  <Button
                    className="gradient-primary rounded-xl shadow-md shadow-blue-500/20 text-sm"
                    onClick={() => {
                      setNewGroupForm({ id: "", name: "", actions: "" });
                      setIsCreateDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新建工作组
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {groupsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">该部门下暂无工作组</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${group.isBuiltin ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{group.name}</p>
                            {group.isBuiltin && <Badge variant="secondary" className="text-xs">内置</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground font-mono">{group.id}</span>
                            {group.actions.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Tag className="h-3 w-3 text-muted-foreground" />
                                {group.actions.map((action) => (
                                  <Badge key={action} variant="outline" className="text-xs px-1.5 py-0">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={() => openMembersDialog(group)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          成员
                        </Button>
                        {canManageGroups && !group.isBuiltin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                            onClick={() => handleDeleteGroup(group.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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
      </div>

      {/* 创建工作组 Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建工作组</DialogTitle>
            <DialogDescription>在「{selectedDeptName}」下创建自定义工作组</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">工作组 ID</Label>
              <Input
                placeholder="如 frontend（可选，不填自动生成）"
                value={newGroupForm.id}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, id: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">名称</Label>
              <Input
                placeholder="如 前端组"
                value={newGroupForm.name}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">动作标识</Label>
              <Input
                placeholder="如 review, submit（逗号分隔，可选）"
                value={newGroupForm.actions}
                onChange={(e) => setNewGroupForm({ ...newGroupForm, actions: e.target.value })}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">用于流程动态分派，如 review 表示该组可执行审核任务</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateDialogOpen(false)} className="rounded-xl">取消</Button>
            <Button onClick={handleCreateGroup} className="gradient-primary rounded-xl">创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 成员管理 Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              成员管理 — {selectedGroup?.name}
            </DialogTitle>
            <DialogDescription>管理工作组成员</DialogDescription>
          </DialogHeader>
          {membersLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {/* 当前成员 */}
              <div>
                <Label className="text-sm font-bold">当前成员 ({groupMembers.length})</Label>
                <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                  {groupMembers.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无成员</p>
                  )}
                  {groupMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between px-3 py-2 rounded-xl border border-border/40 bg-muted/10">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.avatar || member.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      {canManageGroups && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          移除
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 添加成员 */}
              {canManageGroups && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-bold">添加成员</Label>
                    <Input
                      placeholder="搜索用户名/姓名/工号..."
                      value={addMemberSearch}
                      onChange={(e) => setAddMemberSearch(e.target.value)}
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
                            onClick={() => handleAddMember(user.id)}
                          >
                            添加
                          </Button>
                        </div>
                      ))}
                      {availableUsersToAdd.length === 0 && addMemberSearch && (
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
