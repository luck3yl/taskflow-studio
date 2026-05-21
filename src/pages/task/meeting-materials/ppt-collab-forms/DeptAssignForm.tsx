import { useState, useEffect } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTaskContext } from "@/contexts/TaskContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { PptCollabFormProps } from "./types";
import { getDepartmentsApi } from "@/services/apis/departments";
import { getUsersApi } from "@/services/apis/users";
import type { DepartmentDto, UserDto } from "@/types/user";

// ---- PageSelector with range support ----
function PageSelector({
  pages,
  selectedPages,
  otherDeptPages,
  onChange,
}: {
  pages: number[];
  selectedPages: number[];
  /** Pages selected by other departments (for color coding) */
  otherDeptPages: number[];
  onChange: (pages: number[]) => void;
}) {
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const toggle = (page: number) => {
    const next = selectedPages.includes(page)
      ? selectedPages.filter((p) => p !== page)
      : [...selectedPages, page].sort((a, b) => a - b);
    onChange(next);
  };

  // 自动选择范围（当两个输入框都有值时自动触发）
  const applyRange = (start: string, end: string) => {
    const s = parseInt(start);
    const e = parseInt(end);
    if (isNaN(s) || isNaN(e) || s > e) return;

    const rangePagesToAdd = pages.filter((p) => p >= s && p <= e);
    const merged = [...new Set([...selectedPages, ...rangePagesToAdd])].sort((a, b) => a - b);
    onChange(merged);
    setRangeStart("");
    setRangeEnd("");
  };

  const handleStartChange = (val: string) => {
    setRangeStart(val);
    if (val && rangeEnd) applyRange(val, rangeEnd);
  };

  const handleEndChange = (val: string) => {
    setRangeEnd(val);
    if (rangeStart && val) applyRange(rangeStart, val);
  };

  const handleSelectRemaining = () => {
    const remaining = pages.filter(
      (p) => !otherDeptPages.includes(p) && !selectedPages.includes(p)
    );
    const merged = [...new Set([...selectedPages, ...remaining])].sort((a, b) => a - b);
    onChange(merged);
  };

  const handleSelectAll = () => {
    onChange([...pages]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const remainingCount = pages.filter(
    (p) => !otherDeptPages.includes(p) && !selectedPages.includes(p)
  ).length;

  return (
    <div className="space-y-2 mt-2">
      {/* 快捷操作 */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder="起"
            className="h-7 w-14 text-xs px-2"
            value={rangeStart}
            onChange={(e) => handleStartChange(e.target.value)}
            min={1}
            max={pages.length}
          />
          <span className="text-xs text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="止"
            className="h-7 w-14 text-xs px-2"
            value={rangeEnd}
            onChange={(e) => handleEndChange(e.target.value)}
            min={1}
            max={pages.length}
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleSelectRemaining}
          disabled={remainingCount === 0}
        >
          剩余页({remainingCount})
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleSelectAll}
        >
          全选
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={handleClearAll}
          disabled={selectedPages.length === 0}
        >
          清空
        </Button>
      </div>

      {/* 页码网格 */}
      <div className="flex flex-wrap gap-1.5">
        {pages.map((page) => {
          const isSelected = selectedPages.includes(page);
          const isOtherDept = otherDeptPages.includes(page);
          const isOverlap = isSelected && isOtherDept;
          return (
            <button
              key={page}
              type="button"
              onClick={() => toggle(page)}
              className={cn(
                "h-8 w-8 rounded-md border text-xs font-medium transition-all",
                isOverlap
                  ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                  : isSelected
                    ? "bg-primary text-white border-primary shadow-sm"
                    : isOtherDept
                      ? "bg-muted border-border text-muted-foreground"
                      : "border-border hover:border-primary hover:text-primary"
              )}
              title={
                isOverlap
                  ? "与其他部门重复"
                  : isOtherDept
                    ? "已被其他部门选择"
                    : undefined
              }
            >
              {page}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Types ----
interface DeptAssignment {
  departmentId: string;
  departmentName: string;
  pages: number[];
  headUserId: string;
  requirement: string;
}

// ---- DeptAssignForm ----
export function DeptAssignForm({ task, onSuccess, onError, totalPages: propTotalPages, templateFileId: propTemplateFileId }: PptCollabFormProps) {
  const { completePptAction } = useTaskContext();
  const { toast } = useToast();

  const workflow = task.meetingMaterialWorkflow;
  const totalPagesNum = propTotalPages || workflow?.totalPages || 0;
  const allPages =
    totalPagesNum > 0
      ? Array.from({ length: totalPagesNum }, (_, i) => i + 1)
      : [];

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [allUsers, setAllUsers] = useState<UserDto[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserDto[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // 加载部门和用户列表
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [depts, users] = await Promise.all([
          getDepartmentsApi(),
          getUsersApi(),
        ]);
        setDepartments(Array.isArray(depts) ? depts : []);
        setAllUsers(Array.isArray(users) ? users : []);
      } catch (error) {
        console.error("Failed to load departments/users", error);
      } finally {
        setLoadingData(false);
      }
    };
    void loadData();
  }, []);

  const [deptAssignments, setDeptAssignments] = useState<DeptAssignment[]>([
    { departmentId: "", departmentName: "", pages: [], headUserId: "", requirement: "" },
  ]);
  const [selectedDeptIndex, setSelectedDeptIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当选中行的部门变化时，按 departmentId 筛选用户
  const currentAssignment = deptAssignments[selectedDeptIndex];

  useEffect(() => {
    if (!currentAssignment?.departmentId) {
      setFilteredUsers(allUsers);
      return;
    }
    const loadUsersForDept = async () => {
      try {
        const users = await getUsersApi({ departmentId: currentAssignment.departmentId });
        setFilteredUsers(Array.isArray(users) ? users : []);
      } catch {
        setFilteredUsers([]);
      }
    };
    void loadUsersForDept();
  }, [currentAssignment?.departmentId, allUsers]);

  const addRow = () => {
    const newAssignments = [
      ...deptAssignments,
      { departmentId: "", departmentName: "", pages: [], headUserId: "", requirement: "" },
    ];
    setDeptAssignments(newAssignments);
    setSelectedDeptIndex(newAssignments.length - 1);
  };

  const removeRow = (index: number) => {
    const newAssignments = deptAssignments.filter((_, i) => i !== index);
    setDeptAssignments(newAssignments);
    if (selectedDeptIndex >= newAssignments.length) {
      setSelectedDeptIndex(Math.max(0, newAssignments.length - 1));
    } else if (selectedDeptIndex > index) {
      setSelectedDeptIndex(selectedDeptIndex - 1);
    }
  };

  const updateRow = (index: number, updated: DeptAssignment) => {
    setDeptAssignments((prev) =>
      prev.map((item, i) => (i === index ? updated : item))
    );
  };

  const handleSubmit = async () => {
    if (deptAssignments.length === 0) {
      toast({ title: "至少需要配置一个部门", variant: "destructive" });
      return;
    }

    if (totalPagesNum <= 0) {
      toast({ title: "请先上传模板文件以确定总页数", variant: "destructive" });
      return;
    }

    // 检查是否所有页码都已分配
    const allAssignedPages = deptAssignments.flatMap((a) => a.pages);
    const uniqueAssignedPages = [...new Set(allAssignedPages)];
    if (uniqueAssignedPages.length < totalPagesNum) {
      const unassignedCount = totalPagesNum - uniqueAssignedPages.length;
      const confirmed = window.confirm(
        `还有 ${unassignedCount} 页未分配，确定要继续提交吗？`
      );
      if (!confirmed) return;
    }

    setIsSubmitting(true);
    try {
      const updatedTask = await completePptAction(task.id, {
        action: "dept_assign",
        payload: {
          totalPages: totalPagesNum,
          templateFileId: propTemplateFileId || undefined,
          deptAssignments: deptAssignments.map((a) => ({
            department: a.departmentName,
            pages: a.pages,
            headUserId: a.headUserId,
            requirement: a.requirement || undefined,
          })),
        },
      });
      toast({ title: "部门分配成功" });
      onSuccess(updatedTask);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      toast({
        title: "分配失败",
        description: err.message,
        variant: "destructive",
      });
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h3 className="text-sm font-bold text-foreground">分配部门</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalPagesNum > 0
            ? `共 ${totalPagesNum} 页，选择各部门负责的页码范围`
            : "请先上传模板文件，上传后自动识别页数"}
        </p>
      </div>

      {loadingData ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">加载部门和用户数据...</span>
        </div>
      ) : (
        /* Main: left dept list + right detail */
        <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
          {/* Left: Department list */}
          <div className="w-44 shrink-0 flex flex-col gap-2 overflow-auto">
            {deptAssignments.map((assignment, index) => (
              <div
                key={index}
                onClick={() => setSelectedDeptIndex(index)}
                className={cn(
                  "group relative rounded-lg border px-3 py-2.5 cursor-pointer transition-all text-sm",
                  selectedDeptIndex === index
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/40 hover:bg-muted/30"
                )}
              >
                <div className="font-medium truncate">
                  {assignment.departmentName || `部门 ${index + 1}`}
                </div>
                {assignment.pages.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {assignment.pages.length} 页：第 {assignment.pages.join("、")} 页
                  </div>
                )}
                {deptAssignments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-1 right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRow(index);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full h-9 border-dashed gap-1.5 shrink-0"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5" />
              添加部门
            </Button>
          </div>

          {/* Right: Detail panel for selected department */}
          <div className="flex-1 overflow-auto space-y-4">
            {currentAssignment && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">部门名称</Label>
                    <Select
                      value={currentAssignment.departmentId}
                      onValueChange={(val) => {
                        const dept = departments.find((d) => d.id === val);
                        updateRow(selectedDeptIndex, {
                          ...currentAssignment,
                          departmentId: val,
                          departmentName: dept?.name || "",
                          headUserId: "",
                        });
                      }}
                    >
                      <SelectTrigger className="mt-1 h-9 text-sm">
                        <SelectValue placeholder="选择部门" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">负责人</Label>
                    <Select
                      value={currentAssignment.headUserId}
                      onValueChange={(val) =>
                        updateRow(selectedDeptIndex, {
                          ...currentAssignment,
                          headUserId: val,
                        })
                      }
                      disabled={!currentAssignment.departmentId}
                    >
                      <SelectTrigger className="mt-1 h-9 text-sm">
                        <SelectValue placeholder={currentAssignment.departmentId ? "选择负责人" : "请先选择部门"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredUsers.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {allPages.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium">负责页码</Label>
                    <PageSelector
                      pages={allPages}
                      selectedPages={currentAssignment.pages}
                      otherDeptPages={
                        deptAssignments
                          .filter((_, i) => i !== selectedDeptIndex)
                          .flatMap((a) => a.pages)
                      }
                      onChange={(pages) =>
                        updateRow(selectedDeptIndex, {
                          ...currentAssignment,
                          pages,
                        })
                      }
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs font-medium">需求说明（选填）</Label>
                  <Textarea
                    className="mt-1 resize-none text-sm"
                    rows={3}
                    placeholder="填写该部门的具体需求..."
                    value={currentAssignment.requirement}
                    onChange={(e) =>
                      updateRow(selectedDeptIndex, {
                        ...currentAssignment,
                        requirement: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer: Submit */}
      <div className="shrink-0 pt-4">
        <Button
          className="w-full h-10 font-semibold"
          disabled={isSubmitting || totalPagesNum <= 0 || loadingData}
          onClick={handleSubmit}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          确认分配
        </Button>
      </div>
    </div>
  );
}
